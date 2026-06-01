package io.clroot.snaplake.adapter.outbound.storage

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain

class SmbStorageAdapterTest :
    DescribeSpec({
        describe("getUri") {
            it("base path 아래의 SMB URI를 반환한다") {
                val adapter =
                    SmbStorageAdapter.create(
                        host = "nas.local",
                        share = "snapshots",
                        path = "snaplake",
                    )

                adapter.getUri("ds1/daily/file.parquet") shouldBe
                    "smb://nas.local/snapshots/snaplake/ds1/daily/file.parquet"
            }

            it("기본 포트가 아니면 URI에 포트를 포함한다") {
                val adapter =
                    SmbStorageAdapter.create(
                        host = "nas.local",
                        share = "snapshots",
                        port = 1445,
                    )

                adapter.getUri("file.parquet") shouldBe "smb://nas.local:1445/snapshots/file.parquet"
            }
        }

        describe("path traversal 방어") {
            it("상위 디렉토리로 빠져나가는 경로를 차단한다") {
                val adapter =
                    SmbStorageAdapter.create(
                        host = "nas.local",
                        share = "snapshots",
                        path = "snaplake",
                    )

                shouldThrow<IllegalArgumentException> {
                    adapter.getUri("../escape.parquet")
                }.message shouldContain "Path traversal detected"
            }

            it("base path 자체가 상위 디렉토리를 가리키면 차단한다") {
                shouldThrow<IllegalArgumentException> {
                    SmbStorageAdapter.create(
                        host = "nas.local",
                        share = "snapshots",
                        path = "../escape",
                    )
                }.message shouldContain "Path traversal detected"
            }

            it("정규화 후 안전한 경로는 허용한다") {
                val adapter =
                    SmbStorageAdapter.create(
                        host = "nas.local",
                        share = "snapshots",
                        path = "snaplake",
                    )

                adapter.getUri("daily/tmp/../file.parquet") shouldBe
                    "smb://nas.local/snapshots/snaplake/daily/file.parquet"
            }
        }
    })
