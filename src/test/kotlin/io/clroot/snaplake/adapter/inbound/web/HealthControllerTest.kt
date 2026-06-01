package io.clroot.snaplake.adapter.inbound.web

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import org.springframework.http.HttpStatus
import java.sql.Connection
import java.sql.Statement
import javax.sql.DataSource

class HealthControllerTest :
    DescribeSpec({
        describe("ready") {
            it("스토리지 연결이 실패해도 DB가 정상이면 readiness는 UP이다") {
                val dataSource = mockk<DataSource>()
                val connection = mockk<Connection>()
                val statement = mockk<Statement>()

                every { dataSource.connection } returns connection
                every { connection.createStatement() } returns statement
                every { statement.execute("SELECT 1") } returns true
                every { statement.close() } just runs
                every { connection.close() } just runs

                val response = HealthController(dataSource).ready()

                response.statusCode shouldBe HttpStatus.OK
                response.body?.get("database") shouldBe "UP"
                response.body?.get("storage") shouldBe "NOT_CHECKED"
                response.body?.get("status") shouldBe "UP"
            }
        }
    })
