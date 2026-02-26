package io.clroot.snaplake.adapter.outbound.database

import io.clroot.snaplake.domain.model.DatabaseType
import io.clroot.snaplake.domain.model.Datasource
import io.clroot.snaplake.domain.model.RetentionPolicy
import io.clroot.snaplake.domain.vo.DatasourceId
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import java.time.Instant

class MySqlDialectTest :
    DescribeSpec({

        val dialect = MySqlDialect()

        describe("type") {
            it("MYSQL 타입을 반환한다") {
                dialect.type shouldBe DatabaseType.MYSQL
            }
        }

        describe("testConnection") {
            it("연결 실패 시 success=false를 반환한다") {
                val datasource =
                    Datasource.reconstitute(
                        id = DatasourceId.generate(),
                        name = "test-mysql",
                        type = DatabaseType.MYSQL,
                        host = "localhost",
                        port = 63306,
                        database = "nonexistent",
                        username = "test",
                        encryptedPassword = "encrypted",
                        schemas = listOf("mydb"),
                        cronExpression = null,
                        retentionPolicy = RetentionPolicy(),
                        enabled = true,
                        createdAt = Instant.now(),
                        updatedAt = Instant.now(),
                    )

                val result = dialect.testConnection(datasource, "test-password")
                result.success shouldBe false
            }
        }
    })
