package io.clroot.snaplake.application.port.inbound

import io.clroot.snaplake.application.port.outbound.ColumnSchema
import io.clroot.snaplake.application.port.outbound.QueryResult
import io.clroot.snaplake.domain.vo.SnapshotId

interface ExecuteQueryUseCase {
    fun executeQuery(command: Command): QueryResult

    data class Command(
        val sql: String,
        val limit: Int = 100,
        val offset: Int = 0,
        val context: SnapshotContext? = null,
    )

    data class SnapshotContext(
        val snapshots: List<AliasedSnapshot>,
    )

    data class AliasedSnapshot(
        val snapshotId: SnapshotId,
        val alias: String,
    )
}

interface DescribeTableUseCase {
    fun describe(
        snapshotId: SnapshotId,
        tableName: String,
    ): List<ColumnSchema>

    fun describeAll(snapshotId: SnapshotId): Map<String, List<ColumnSchema>>
}

interface PreviewTableUseCase {
    fun preview(command: Command): QueryResult

    data class Command(
        val snapshotId: SnapshotId,
        val tableName: String,
        val where: String? = null,
        val orderBy: String? = null,
        val limit: Int = 100,
        val offset: Int = 0,
    )
}
