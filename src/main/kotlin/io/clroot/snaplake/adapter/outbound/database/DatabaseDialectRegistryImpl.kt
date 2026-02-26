package io.clroot.snaplake.adapter.outbound.database

import io.clroot.snaplake.application.port.outbound.DatabaseDialect
import io.clroot.snaplake.application.port.outbound.DatabaseDialectRegistry
import io.clroot.snaplake.domain.model.DatabaseType
import org.springframework.stereotype.Component

@Component
class DatabaseDialectRegistryImpl(
    dialects: List<DatabaseDialect>,
) : DatabaseDialectRegistry {
    private val dialectMap: Map<DatabaseType, DatabaseDialect> =
        dialects.associateBy { it.type }

    override fun getDialect(type: DatabaseType): DatabaseDialect =
        dialectMap[type]
            ?: throw IllegalArgumentException("No dialect found for database type: $type")
}
