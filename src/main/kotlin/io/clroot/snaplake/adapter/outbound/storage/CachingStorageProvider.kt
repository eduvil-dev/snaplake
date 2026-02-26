package io.clroot.snaplake.adapter.outbound.storage

import io.clroot.snaplake.application.port.outbound.StorageProvider
import org.slf4j.LoggerFactory
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import kotlin.io.path.exists
import kotlin.io.path.isDirectory

class CachingStorageProvider(
    private val delegate: StorageProvider,
    private val cacheDir: Path,
) : StorageProvider by delegate {
    private val log = LoggerFactory.getLogger(javaClass)
    private val inFlightDownloads = ConcurrentHashMap<String, CompletableFuture<Path>>()

    init {
        Files.createDirectories(cacheDir)
    }

    override fun getUri(path: String): String {
        val cachedFile = cacheDir.resolve(path)
        if (cachedFile.exists()) {
            return cachedFile.toAbsolutePath().normalize().toString()
        }

        val future =
            inFlightDownloads.computeIfAbsent(path) {
                CompletableFuture.supplyAsync {
                    downloadAndCache(path, cachedFile)
                }
            }

        return try {
            future.join()
            cachedFile.toAbsolutePath().normalize().toString()
        } finally {
            inFlightDownloads.remove(path)
        }
    }

    private fun downloadAndCache(
        path: String,
        cachedFile: Path,
    ): Path {
        // Double-check after acquiring slot
        if (cachedFile.exists()) return cachedFile

        Files.createDirectories(cachedFile.parent)
        val tempFile = Files.createTempFile(cachedFile.parent, ".download-", ".tmp")
        Files.delete(tempFile) // ResponseTransformer.toFile() requires non-existent target
        try {
            delegate.downloadToFile(path, tempFile)
            Files.move(tempFile, cachedFile, StandardCopyOption.ATOMIC_MOVE)
            log.debug("Cached snapshot file: {}", path)
        } catch (e: Exception) {
            Files.deleteIfExists(tempFile)
            throw e
        }
        return cachedFile
    }

    override fun delete(path: String) {
        delegate.delete(path)
        val cachedFile = cacheDir.resolve(path)
        Files.deleteIfExists(cachedFile)
    }

    override fun deleteAll(prefix: String) {
        delegate.deleteAll(prefix)
        val cachedDir = cacheDir.resolve(prefix)
        if (cachedDir.exists() && cachedDir.isDirectory()) {
            Files
                .walk(cachedDir)
                .sorted(Comparator.reverseOrder())
                .forEach { Files.deleteIfExists(it) }
        }
    }

    fun clearCache() {
        if (!cacheDir.exists()) return
        Files
            .walk(cacheDir)
            .sorted(Comparator.reverseOrder())
            .forEach { Files.deleteIfExists(it) }
        Files.createDirectories(cacheDir)
        log.info("Snapshot cache cleared")
    }

    fun getCacheInfo(): CacheInfo {
        if (!cacheDir.exists()) return CacheInfo(0, 0)

        var fileCount = 0L
        var totalSize = 0L
        Files.walk(cacheDir).use { stream ->
            stream
                .filter { Files.isRegularFile(it) }
                .forEach {
                    fileCount++
                    totalSize += Files.size(it)
                }
        }
        return CacheInfo(fileCount, totalSize)
    }

    data class CacheInfo(
        val fileCount: Long,
        val totalSizeBytes: Long,
    )
}
