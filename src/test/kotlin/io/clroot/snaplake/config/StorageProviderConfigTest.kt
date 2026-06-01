package io.clroot.snaplake.config

import io.clroot.snaplake.application.port.outbound.LoadStorageConfigPort
import io.clroot.snaplake.domain.model.StorageConfig
import io.clroot.snaplake.domain.model.StorageType
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk

class StorageProviderConfigTest :
    DescribeSpec({
        describe("testConnection") {
            it("저장된 SMB 설정이 어댑터 생성 단계에서 실패하면 false를 반환한다") {
                val loadStorageConfigPort = mockk<LoadStorageConfigPort>()
                every { loadStorageConfigPort.find() } returns
                    StorageConfig.reconstitute(
                        type = StorageType.SMB,
                        localPath = null,
                        s3Bucket = null,
                        s3Region = null,
                        s3Endpoint = null,
                        s3AccessKey = null,
                        s3SecretKey = null,
                        smbHost = null,
                        smbPort = null,
                        smbShare = "snapshots",
                        smbPath = null,
                        smbDomain = null,
                        smbUsername = null,
                        smbPassword = null,
                    )

                val config = StorageProviderConfig(loadStorageConfigPort, "./build/test-data")

                config.testConnection() shouldBe false
            }
        }
    })
