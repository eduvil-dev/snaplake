package io.clroot.snaplake.domain.model

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe

class StorageConfigTest :
    DescribeSpec({
        describe("smb") {
            it("SMB 필드를 정규화한다") {
                val config =
                    StorageConfig.smb(
                        host = " nas.local ",
                        share = " snapshots ",
                        port = 445,
                        path = " snaplake ",
                        domain = " WORKGROUP ",
                        username = " snaplake ",
                        password = "secret",
                    )

                config.smbHost shouldBe "nas.local"
                config.smbShare shouldBe "snapshots"
                config.smbPath shouldBe "snaplake"
                config.smbDomain shouldBe "WORKGROUP"
                config.smbUsername shouldBe "snaplake"
                config.smbPassword shouldBe "secret"
            }

            it("사용자명이 비어 있으면 게스트 접속으로 보고 비밀번호를 저장하지 않는다") {
                val config =
                    StorageConfig.smb(
                        host = "nas.local",
                        share = "snapshots",
                        username = "",
                        password = "secret",
                    )

                config.smbUsername shouldBe null
                config.smbPassword shouldBe null
            }

            it("잘못된 포트를 거부한다") {
                shouldThrow<IllegalArgumentException> {
                    StorageConfig.smb(
                        host = "nas.local",
                        share = "snapshots",
                        port = 0,
                    )
                }
            }

            it("path traversal 세그먼트가 포함된 sub path를 거부한다") {
                shouldThrow<IllegalArgumentException> {
                    StorageConfig.smb(
                        host = "nas.local",
                        share = "snapshots",
                        path = "../escape",
                    )
                }
            }
        }
    })
