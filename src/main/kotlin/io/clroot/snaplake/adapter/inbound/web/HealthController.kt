package io.clroot.snaplake.adapter.inbound.web

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import javax.sql.DataSource

@RestController
class HealthController(
    private val dataSource: DataSource,
) {
    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, String>> = ResponseEntity.ok(mapOf("status" to "UP"))

    @GetMapping("/health/ready")
    fun ready(): ResponseEntity<Map<String, Any>> {
        val checks = mutableMapOf<String, Any>()

        val dbHealthy =
            try {
                dataSource.connection.use { conn ->
                    conn.createStatement().use { stmt ->
                        stmt.execute("SELECT 1")
                    }
                }
                true
            } catch (e: Exception) {
                false
            }
        checks["database"] = if (dbHealthy) "UP" else "DOWN"

        checks["storage"] = "NOT_CHECKED"

        checks["status"] = if (dbHealthy) "UP" else "DOWN"

        val status =
            if (dbHealthy) {
                ResponseEntity.ok()
            } else {
                ResponseEntity.status(503)
            }
        return status.body(checks)
    }
}
