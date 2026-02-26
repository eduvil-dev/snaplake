package io.clroot.snaplake.application.port.outbound

import java.nio.file.Files
import java.nio.file.Path

interface StorageProvider {
    fun write(
        path: String,
        data: ByteArray,
    )

    fun read(path: String): ByteArray

    fun list(prefix: String): List<String>

    fun delete(path: String)

    fun deleteAll(prefix: String)

    fun exists(path: String): Boolean

    fun getUri(path: String): String

    fun testConnection(): Boolean

    fun downloadToFile(
        path: String,
        destination: Path,
    ) {
        Files.createDirectories(destination.parent)
        Files.write(destination, read(path))
    }
}
