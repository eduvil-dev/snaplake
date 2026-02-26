package io.clroot.snaplake.adapter.outbound.database

import io.clroot.snaplake.domain.model.DatabaseType
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe

class PostgresDialectTest :
    DescribeSpec({

        val dialect = PostgresDialect()

        describe("type") {
            it("POSTGRESQL 타입을 반환한다") {
                dialect.type shouldBe DatabaseType.POSTGRESQL
            }
        }

        describe("testConnection") {
            it("연결 실패 시 success=false를 반환한다") {
                val datasource =
                    io.clroot.snaplake.domain.model.Datasource.reconstitute(
                        id =
                            io.clroot.snaplake.domain.vo.DatasourceId
                                .generate(),
                        name = "test-pg",
                        type = DatabaseType.POSTGRESQL,
                        host = "localhost",
                        port = 65432, // unlikely to have PG running here
                        database = "nonexistent",
                        username = "test",
                        encryptedPassword = "encrypted",
                        schemas = listOf("public"),
                        cronExpression = null,
                        retentionPolicy =
                            io.clroot.snaplake.domain.model
                                .RetentionPolicy(),
                        enabled = true,
                        createdAt = java.time.Instant.now(),
                        updatedAt = java.time.Instant.now(),
                    )

                val result = dialect.testConnection(datasource, "test-password")
                result.success shouldBe false
            }
        }
    })
