package io.clroot.snaplake.adapter.outbound.storage

import io.clroot.snaplake.application.port.outbound.StorageProvider
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldStartWith
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import io.mockk.verify
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

class CachingStorageProviderTest :
    DescribeSpec({

        val delegate = mockk<StorageProvider>()
        lateinit var cacheDir: Path
        lateinit var sut: CachingStorageProvider

        beforeTest {
            clearAllMocks()
            cacheDir = Files.createTempDirectory("snaplake-cache-test")
            sut = CachingStorageProvider(delegate, cacheDir)
        }

        afterTest {
            cacheDir.toFile().deleteRecursively()
        }

        describe("getUri") {
            context("캐시에 파일이 없는 경우") {
                it("delegate.downloadToFile을 호출하고 로컬 경로를 반환한다") {
                    every { delegate.downloadToFile(any(), any()) } answers {
                        val dest = secondArg<Path>()
                        Files.createDirectories(dest.parent)
                        Files.write(dest, byteArrayOf(1, 2, 3))
                    }

                    val uri = sut.getUri("ds1/snapshot.parquet")

                    uri shouldStartWith "/"
                    uri shouldBe cacheDir.resolve("ds1/snapshot.parquet").toAbsolutePath().normalize().toString()
                    verify(exactly = 1) { delegate.downloadToFile("ds1/snapshot.parquet", any()) }
                }
            }

            context("캐시에 파일이 이미 있는 경우") {
                it("delegate.downloadToFile을 호출하지 않고 로컬 경로를 반환한다") {
                    val cachedFile = cacheDir.resolve("ds1/snapshot.parquet")
                    Files.createDirectories(cachedFile.parent)
                    Files.write(cachedFile, byteArrayOf(1, 2, 3))

                    val uri = sut.getUri("ds1/snapshot.parquet")

                    uri shouldBe cachedFile.toAbsolutePath().normalize().toString()
                    verify(exactly = 0) { delegate.downloadToFile(any(), any()) }
                }
            }

            context("동시에 같은 파일을 요청하는 경우") {
                it("한 번만 다운로드한다") {
                    val downloadCount = AtomicInteger(0)
                    val latch = CountDownLatch(1)

                    every { delegate.downloadToFile(any(), any()) } answers {
                        latch.await()
                        downloadCount.incrementAndGet()
                        val dest = secondArg<Path>()
                        Files.createDirectories(dest.parent)
                        Files.write(dest, byteArrayOf(1, 2, 3))
                    }

                    val executor = Executors.newFixedThreadPool(4)
                    val futures =
                        (1..4).map {
                            executor.submit<String> { sut.getUri("concurrent/file.parquet") }
                        }

                    latch.countDown()
                    val results = futures.map { it.get() }
                    executor.shutdown()

                    results.distinct().size shouldBe 1
                    downloadCount.get() shouldBe 1
                }
            }
        }

        describe("delete") {
            it("delegate를 호출하고 캐시 파일도 삭제한다") {
                val cachedFile = cacheDir.resolve("to-delete.parquet")
                Files.createDirectories(cachedFile.parent)
                Files.write(cachedFile, byteArrayOf(1))
                every { delegate.delete("to-delete.parquet") } just runs

                sut.delete("to-delete.parquet")

                verify { delegate.delete("to-delete.parquet") }
                Files.exists(cachedFile) shouldBe false
            }
        }

        describe("deleteAll") {
            it("delegate를 호출하고 캐시 디렉토리도 삭제한다") {
                val file1 = cacheDir.resolve("prefix/a.parquet")
                val file2 = cacheDir.resolve("prefix/sub/b.parquet")
                Files.createDirectories(file1.parent)
                Files.createDirectories(file2.parent)
                Files.write(file1, byteArrayOf(1))
                Files.write(file2, byteArrayOf(2))
                every { delegate.deleteAll("prefix") } just runs

                sut.deleteAll("prefix")

                verify { delegate.deleteAll("prefix") }
                Files.exists(cacheDir.resolve("prefix")) shouldBe false
            }
        }

        describe("clearCache") {
            it("캐시 디렉토리의 모든 파일을 삭제한다") {
                val file1 = cacheDir.resolve("a/1.parquet")
                val file2 = cacheDir.resolve("b/2.parquet")
                Files.createDirectories(file1.parent)
                Files.createDirectories(file2.parent)
                Files.write(file1, byteArrayOf(1))
                Files.write(file2, byteArrayOf(2))

                sut.clearCache()

                Files.exists(file1) shouldBe false
                Files.exists(file2) shouldBe false
                Files.exists(cacheDir) shouldBe true
            }
        }

        describe("getCacheInfo") {
            it("캐시 파일 수와 총 크기를 반환한다") {
                val file1 = cacheDir.resolve("info/a.parquet")
                val file2 = cacheDir.resolve("info/b.parquet")
                Files.createDirectories(file1.parent)
                Files.write(file1, byteArrayOf(1, 2, 3))
                Files.write(file2, byteArrayOf(4, 5))

                val info = sut.getCacheInfo()

                info.fileCount shouldBe 2
                info.totalSizeBytes shouldBe 5
            }

            it("캐시가 비어있으면 0을 반환한다") {
                val info = sut.getCacheInfo()

                info.fileCount shouldBe 0
                info.totalSizeBytes shouldBe 0
            }
        }
    })
