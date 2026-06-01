package io.clroot.snaplake.adapter.outbound.storage

import com.hierynomus.msdtyp.AccessMask
import com.hierynomus.msfscc.FileAttributes
import com.hierynomus.msfscc.fileinformation.FileIdBothDirectoryInformation
import com.hierynomus.mssmb2.SMB2CreateDisposition
import com.hierynomus.mssmb2.SMB2CreateOptions
import com.hierynomus.mssmb2.SMB2ShareAccess
import com.hierynomus.smbj.SMBClient
import com.hierynomus.smbj.SmbConfig
import com.hierynomus.smbj.auth.AuthenticationContext
import com.hierynomus.smbj.share.DiskShare
import io.clroot.snaplake.application.port.outbound.StorageProvider
import java.io.ByteArrayOutputStream
import java.util.EnumSet
import java.util.concurrent.TimeUnit

class SmbStorageAdapter private constructor(
    private val host: String,
    private val port: Int,
    private val shareName: String,
    private val basePath: String,
    private val authContext: AuthenticationContext,
) : StorageProvider {
    private val client: SMBClient =
        SMBClient(
            SmbConfig
                .builder()
                .withTimeout(30, TimeUnit.SECONDS)
                .withSoTimeout(30, TimeUnit.SECONDS)
                .build(),
        )

    private fun <T> withShare(action: (DiskShare) -> T): T {
        val connection = client.connect(host, port)
        return try {
            val session = connection.authenticate(authContext)
            val share = session.connectShare(shareName) as DiskShare
            try {
                action(share)
            } finally {
                share.close()
            }
        } finally {
            connection.close()
        }
    }

    private fun resolvePath(path: String): String {
        val normalized = normalizeRelativePath(path)
        return when {
            basePath.isEmpty() -> normalized
            normalized.isEmpty() -> basePath
            else -> "$basePath\\$normalized"
        }
    }

    private fun ensureParentDir(
        share: DiskShare,
        path: String,
    ) {
        val parts = path.split("\\").dropLast(1)
        var current = ""
        for (part in parts) {
            current = if (current.isEmpty()) part else "$current\\$part"
            if (!share.folderExists(current)) {
                share.mkdir(current)
            }
        }
    }

    override fun write(
        path: String,
        data: ByteArray,
    ) {
        withShare { share ->
            val smbPath = resolvePath(path)
            ensureParentDir(share, smbPath)
            val file =
                share.openFile(
                    smbPath,
                    EnumSet.of(AccessMask.GENERIC_WRITE),
                    EnumSet.of(FileAttributes.FILE_ATTRIBUTE_NORMAL),
                    SMB2ShareAccess.ALL,
                    SMB2CreateDisposition.FILE_OVERWRITE_IF,
                    EnumSet.noneOf(SMB2CreateOptions::class.java),
                )
            file.use { it.write(data, 0) }
        }
    }

    override fun read(path: String): ByteArray {
        return withShare { share ->
            val smbPath = resolvePath(path)
            val file =
                share.openFile(
                    smbPath,
                    EnumSet.of(AccessMask.GENERIC_READ),
                    EnumSet.of(FileAttributes.FILE_ATTRIBUTE_NORMAL),
                    SMB2ShareAccess.ALL,
                    SMB2CreateDisposition.FILE_OPEN,
                    EnumSet.noneOf(SMB2CreateOptions::class.java),
                )
            file.use { f ->
                val inputStream = f.inputStream
                val buffer = ByteArrayOutputStream()
                inputStream.use { it.copyTo(buffer) }
                buffer.toByteArray()
            }
        }
    }

    override fun list(prefix: String): List<String> {
        return withShare { share ->
            val smbPath = resolvePath(prefix)
            if (smbPath.isNotEmpty() && !share.folderExists(smbPath)) return@withShare emptyList()
            listRecursive(share, smbPath)
                .map { it.replace("\\", "/") }
                .map { fullPath ->
                    if (basePath.isEmpty()) {
                        fullPath
                    } else {
                        fullPath.removePrefix(basePath.replace("\\", "/") + "/")
                    }
                }
        }
    }

    private fun listRecursive(
        share: DiskShare,
        dir: String,
    ): List<String> {
        val result = mutableListOf<String>()
        val entries: List<FileIdBothDirectoryInformation> = share.list(dir)
        for (entry in entries) {
            val name = entry.fileName
            if (name == "." || name == "..") continue
            val fullPath = if (dir.isEmpty()) name else "$dir\\$name"
            val isDirectory =
                entry.fileAttributes and FileAttributes.FILE_ATTRIBUTE_DIRECTORY.value != 0L
            if (isDirectory) {
                result.addAll(listRecursive(share, fullPath))
            } else {
                result.add(fullPath.replace("\\", "/"))
            }
        }
        return result
    }

    override fun delete(path: String) {
        withShare { share ->
            val smbPath = resolvePath(path)
            if (share.fileExists(smbPath)) {
                share.rm(smbPath)
            }
        }
    }

    override fun deleteAll(prefix: String) {
        withShare { share ->
            val smbPath = resolvePath(prefix)
            require(smbPath.isNotEmpty()) { "Refusing to delete SMB share root" }
            if (share.folderExists(smbPath)) {
                deleteRecursive(share, smbPath)
            }
        }
    }

    private fun deleteRecursive(
        share: DiskShare,
        dir: String,
    ) {
        val entries = share.list(dir)
        for (entry in entries) {
            val name = entry.fileName
            if (name == "." || name == "..") continue
            val fullPath = "$dir\\$name"
            val isDirectory =
                entry.fileAttributes and FileAttributes.FILE_ATTRIBUTE_DIRECTORY.value != 0L
            if (isDirectory) {
                deleteRecursive(share, fullPath)
            } else {
                share.rm(fullPath)
            }
        }
        share.rmdir(dir, false)
    }

    override fun exists(path: String): Boolean {
        return withShare { share ->
            val smbPath = resolvePath(path)
            share.fileExists(smbPath) || share.folderExists(smbPath)
        }
    }

    override fun getUri(path: String): String {
        val smbPath = resolvePath(path).replace("\\", "/")
        val authority = if (port == DEFAULT_SMB_PORT) host else "$host:$port"
        return "smb://$authority/$shareName/$smbPath"
    }

    override fun testConnection(): Boolean =
        try {
            withShare { share ->
                share.list("")
            }
            true
        } catch (_: Exception) {
            false
        }

    companion object {
        private const val DEFAULT_SMB_PORT = 445

        private fun normalizeRelativePath(path: String): String {
            val parts = ArrayDeque<String>()
            val normalized = path.replace("/", "\\")

            for (rawPart in normalized.split('\\')) {
                if (rawPart.isEmpty() || rawPart == ".") continue

                require(!rawPart.contains('\u0000') && !rawPart.contains(':')) {
                    "Invalid SMB path segment: $path"
                }

                if (rawPart == "..") {
                    require(parts.isNotEmpty()) { "Path traversal detected: $path" }
                    parts.removeLast()
                } else {
                    parts.addLast(rawPart)
                }
            }

            return parts.joinToString("\\")
        }

        fun create(
            host: String,
            share: String,
            port: Int? = null,
            path: String? = null,
            domain: String? = null,
            username: String? = null,
            password: String? = null,
        ): SmbStorageAdapter {
            val normalizedHost = host.trim()
            val normalizedShare = share.trim()
            val normalizedUsername = username?.trim()?.takeIf { it.isNotBlank() }
            val normalizedDomain = domain?.trim()?.takeIf { it.isNotBlank() }

            require(normalizedHost.isNotBlank()) { "SMB host must not be blank" }
            require(normalizedShare.isNotBlank()) { "SMB share must not be blank" }
            require('/' !in normalizedShare && '\\' !in normalizedShare) {
                "SMB share must not contain path separators"
            }
            require(port == null || port in 1..65535) { "SMB port must be between 1 and 65535" }

            val authContext =
                if (normalizedUsername != null) {
                    AuthenticationContext(
                        normalizedUsername,
                        password?.toCharArray() ?: CharArray(0),
                        normalizedDomain,
                    )
                } else {
                    AuthenticationContext.guest()
                }

            val basePath =
                path
                    ?.trim()
                    ?.takeIf { it.isNotBlank() }
                    ?.let { normalizeRelativePath(it) }
                    ?: ""

            return SmbStorageAdapter(
                host = normalizedHost,
                port = port ?: DEFAULT_SMB_PORT,
                shareName = normalizedShare,
                basePath = basePath,
                authContext = authContext,
            )
        }
    }
}
