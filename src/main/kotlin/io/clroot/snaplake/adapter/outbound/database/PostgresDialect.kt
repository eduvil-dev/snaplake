package io.clroot.snaplake.adapter.outbound.database

import io.clroot.snaplake.application.port.outbound.ConnectionTestResult
import io.clroot.snaplake.application.port.outbound.DatabaseDialect
import io.clroot.snaplake.application.port.outbound.TableInfo
import io.clroot.snaplake.domain.model.DatabaseType
import io.clroot.snaplake.domain.model.Datasource
import org.springframework.stereotype.Component
import java.sql.Connection
import java.sql.DriverManager

@Component
class PostgresDialect : DatabaseDialect {
    override val type: DatabaseType = DatabaseType.POSTGRESQL

    override fun createConnection(
        datasource: Datasource,
        decryptedPassword: String,
    ): Connection {
        val url = "jdbc:postgresql://${datasource.host}:${datasource.port}/${datasource.database}"
        return DriverManager.getConnection(url, datasource.username, decryptedPassword)
    }

    override fun listTables(
        connection: Connection,
        schema: String,
    ): List<TableInfo> {
        val sql =
            """
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema = ? 
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
            """.trimIndent()

        return connection.prepareStatement(sql).use { stmt ->
            stmt.setString(1, schema)
            stmt.executeQuery().use { rs ->
                val tables = mutableListOf<TableInfo>()
                while (rs.next()) {
                    tables.add(
                        TableInfo(
                            schema = rs.getString("table_schema"),
                            name = rs.getString("table_name"),
                        ),
                    )
                }
                tables
            }
        }
    }

    override fun listPrimaryKeys(
        connection: Connection,
        schema: String,
        table: String,
    ): List<String> {
        val sql =
            """
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = ?
              AND tc.table_name = ?
            ORDER BY kcu.ordinal_position
            """.trimIndent()

        return connection.prepareStatement(sql).use { stmt ->
            stmt.setString(1, schema)
            stmt.setString(2, table)
            stmt.executeQuery().use { rs ->
                val columns = mutableListOf<String>()
                while (rs.next()) {
                    columns.add(rs.getString("column_name"))
                }
                columns
            }
        }
    }

    override fun testConnection(
        datasource: Datasource,
        decryptedPassword: String,
    ): ConnectionTestResult =
        try {
            createConnection(datasource, decryptedPassword).use { conn ->
                conn.createStatement().use { stmt ->
                    stmt.execute("SELECT 1")
                }
            }
            ConnectionTestResult(success = true, message = "Connection successful")
        } catch (e: Exception) {
            ConnectionTestResult(success = false, message = e.message ?: "Unknown error")
        }
}
