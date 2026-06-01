package io.clroot.snaplake.application.service

import io.clroot.snaplake.application.port.inbound.UpdateStorageSettingsUseCase
import io.clroot.snaplake.application.port.outbound.LoadStorageConfigPort
import io.clroot.snaplake.application.port.outbound.SaveStorageConfigPort
import io.clroot.snaplake.config.StorageProviderConfig
import io.clroot.snaplake.domain.model.StorageConfig
import io.clroot.snaplake.domain.model.StorageType
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify

class StorageSettingsServiceTest :
    DescribeSpec({

        val loadStorageConfigPort = mockk<LoadStorageConfigPort>()
        val saveStorageConfigPort = mockk<SaveStorageConfigPort>()
        val storageProviderConfig = mockk<StorageProviderConfig>(relaxed = true)

        val sut = StorageSettingsService(loadStorageConfigPort, saveStorageConfigPort, storageProviderConfig)

        beforeTest {
            clearAllMocks()
        }

        fun smbCommand(
            host: String? = "nas.local",
            share: String? = "snapshots",
            domain: String? = "WORKGROUP",
            username: String? = "snaplake",
            password: String? = "secret",
        ): UpdateStorageSettingsUseCase.Command =
            UpdateStorageSettingsUseCase.Command(
                storageType = StorageType.SMB,
                localPath = null,
                s3Bucket = null,
                s3Region = null,
                s3Endpoint = null,
                s3AccessKey = null,
                s3SecretKey = null,
                smbHost = host,
                smbPort = 445,
                smbShare = share,
                smbPath = "snaplake",
                smbDomain = domain,
                smbUsername = username,
                smbPassword = password,
            )

        describe("getSettings") {
            it("저장된 설정을 반환한다") {
                val config = StorageConfig.local("/data/snapshots")
                every { loadStorageConfigPort.find() } returns config

                val result = sut.getSettings()

                result shouldBe config
            }

            it("설정이 없으면 null을 반환한다") {
                every { loadStorageConfigPort.find() } returns null

                val result = sut.getSettings()

                result shouldBe null
            }
        }

        describe("update") {
            it("LOCAL 설정을 저장한다") {
                every { loadStorageConfigPort.find() } returns null
                every { saveStorageConfigPort.save(any()) } answers { firstArg() }

                val result =
                    sut.update(
                        UpdateStorageSettingsUseCase.Command(
                            storageType = StorageType.LOCAL,
                            localPath = "/data/snapshots",
                            s3Bucket = null,
                            s3Region = null,
                            s3Endpoint = null,
                            s3AccessKey = null,
                            s3SecretKey = null,
                            smbHost = null,
                            smbPort = null,
                            smbShare = null,
                            smbPath = null,
                            smbDomain = null,
                            smbUsername = null,
                            smbPassword = null,
                        ),
                    )

                result.type shouldBe StorageType.LOCAL
                result.localPath shouldBe "/data/snapshots"
                verify { storageProviderConfig.refresh() }
            }

            it("S3 설정을 저장한다") {
                every { loadStorageConfigPort.find() } returns null
                every { saveStorageConfigPort.save(any()) } answers { firstArg() }

                val result =
                    sut.update(
                        UpdateStorageSettingsUseCase.Command(
                            storageType = StorageType.S3,
                            localPath = null,
                            s3Bucket = "my-bucket",
                            s3Region = "us-east-1",
                            s3Endpoint = "https://s3.example.com",
                            s3AccessKey = "access",
                            s3SecretKey = "secret",
                            smbHost = null,
                            smbPort = null,
                            smbShare = null,
                            smbPath = null,
                            smbDomain = null,
                            smbUsername = null,
                            smbPassword = null,
                        ),
                    )

                result.type shouldBe StorageType.S3
                result.s3Bucket shouldBe "my-bucket"
                verify { storageProviderConfig.refresh() }
            }

            it("S3 업데이트 시 비밀값이 null이면 기존 값을 유지한다") {
                val existingConfig =
                    StorageConfig.s3(
                        bucket = "old-bucket",
                        region = "us-east-1",
                        endpoint = null,
                        accessKey = "existing-access-key",
                        secretKey = "existing-secret-key",
                    )
                every { loadStorageConfigPort.find() } returns existingConfig
                every { saveStorageConfigPort.save(any()) } answers { firstArg() }

                val result =
                    sut.update(
                        UpdateStorageSettingsUseCase.Command(
                            storageType = StorageType.S3,
                            localPath = null,
                            s3Bucket = "new-bucket",
                            s3Region = "us-west-2",
                            s3Endpoint = null,
                            s3AccessKey = null,
                            s3SecretKey = null,
                            smbHost = null,
                            smbPort = null,
                            smbShare = null,
                            smbPath = null,
                            smbDomain = null,
                            smbUsername = null,
                            smbPassword = null,
                        ),
                    )

                result.type shouldBe StorageType.S3
                result.s3Bucket shouldBe "new-bucket"
                result.s3Region shouldBe "us-west-2"
                result.s3AccessKey shouldBe "existing-access-key"
                result.s3SecretKey shouldBe "existing-secret-key"
            }

            it("SMB 설정을 저장한다") {
                every { loadStorageConfigPort.find() } returns null
                every { saveStorageConfigPort.save(any()) } answers { firstArg() }

                val result = sut.update(smbCommand())

                result.type shouldBe StorageType.SMB
                result.smbHost shouldBe "nas.local"
                result.smbShare shouldBe "snapshots"
                result.smbUsername shouldBe "snaplake"
                result.smbPassword shouldBe "secret"
                verify { storageProviderConfig.refresh() }
            }

            it("SMB 업데이트 시 같은 계정이면 빈 비밀번호는 기존 값을 유지한다") {
                val existingConfig =
                    StorageConfig.smb(
                        host = "nas.local",
                        share = "snapshots",
                        path = "snaplake",
                        domain = "WORKGROUP",
                        username = "snaplake",
                        password = "existing-password",
                    )
                every { loadStorageConfigPort.find() } returns existingConfig
                every { saveStorageConfigPort.save(any()) } answers { firstArg() }

                val result = sut.update(smbCommand(password = ""))

                result.smbUsername shouldBe "snaplake"
                result.smbPassword shouldBe "existing-password"
            }

            it("SMB 업데이트 시 사용자명이 비면 게스트 접속으로 전환하고 기존 비밀번호를 제거한다") {
                val existingConfig =
                    StorageConfig.smb(
                        host = "nas.local",
                        share = "snapshots",
                        path = "snaplake",
                        domain = "WORKGROUP",
                        username = "snaplake",
                        password = "existing-password",
                    )
                every { loadStorageConfigPort.find() } returns existingConfig
                every { saveStorageConfigPort.save(any()) } answers { firstArg() }

                val result = sut.update(smbCommand(domain = "", username = "", password = ""))

                result.smbDomain shouldBe null
                result.smbUsername shouldBe null
                result.smbPassword shouldBe null
            }
        }

        describe("test") {
            it("연결 테스트 결과를 반환한다") {
                every { storageProviderConfig.testConnection() } returns true

                sut.test() shouldBe true
            }
        }
    })
