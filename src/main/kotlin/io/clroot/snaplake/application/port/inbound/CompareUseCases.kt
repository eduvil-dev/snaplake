package io.clroot.snaplake.application.port.inbound

import io.clroot.snaplake.application.port.outbound.ColumnSchema
import io.clroot.snaplake.application.port.outbound.QueryResult
import io.clroot.snaplake.domain.vo.SnapshotId

data class StatsResult(
    val leftRowCount: Long,
    val rightRowCount: Long,
    val columnStats: List<ColumnStat>,
)

data class ColumnStat(
    val column: String,
    val leftDistinctCount: Long,
    val rightDistinctCount: Long,
    val leftNullCount: Long,
    val rightNullCount: Long,
)

interface CompareStatsUseCase {
    fun compareStats(command: Command): StatsResult

    data class Command(
        val leftSnapshotId: SnapshotId,
        val rightSnapshotId: SnapshotId,
        val tableName: String,
    )
}

interface CompareRowsUseCase {
    fun compareRows(command: Command): RowsCompareResult

    data class Command(
        val leftSnapshotId: SnapshotId,
        val rightSnapshotId: SnapshotId,
        val tableName: String,
        val limit: Int = 100,
        val offset: Int = 0,
    )
}

data class RowsCompareResult(
    val added: QueryResult,
    val removed: QueryResult,
)

interface CompareDiffUseCase {
    fun compareDiff(command: Command): QueryResult

    data class Command(
        val leftSnapshotId: SnapshotId,
        val rightSnapshotId: SnapshotId,
        val tableName: String,
        val primaryKeys: List<String>,
        val limit: Int = 100,
        val offset: Int = 0,
    )
}

enum class DiffType { ADDED, REMOVED, CHANGED }

sealed class DiffRow(
    val diffType: DiffType,
) {
    class Added(
        val values: List<Any?>,
    ) : DiffRow(DiffType.ADDED)

    class Removed(
        val values: List<Any?>,
    ) : DiffRow(DiffType.REMOVED)

    class Changed(
        val left: List<Any?>,
        val right: List<Any?>,
        val changedColumns: List<Int>,
    ) : DiffRow(DiffType.CHANGED)
}

data class DiffSummary(
    val added: Long,
    val removed: Long,
    val changed: Long,
)

data class UnifiedDiffResult(
    val columns: List<ColumnSchema>,
    val primaryKeys: List<String>,
    val rows: List<DiffRow>,
    val totalRows: Long,
    val summary: DiffSummary,
)

interface CompareUnifiedDiffUseCase {
    fun compareUnifiedDiff(command: Command): UnifiedDiffResult

    data class Command(
        val leftSnapshotId: SnapshotId,
        val rightSnapshotId: SnapshotId,
        val tableName: String,
        val limit: Int = 100,
        val offset: Int = 0,
    )
}

data class ColumnInfo(
    val name: String,
    val type: String,
)

data class ColumnTypeChange(
    val name: String,
    val leftType: String,
    val rightType: String,
)

data class TableSchemaChange(
    val tableName: String,
    val columnsAdded: List<ColumnInfo>,
    val columnsRemoved: List<ColumnInfo>,
    val columnsTypeChanged: List<ColumnTypeChange>,
)

data class SchemaChangeResult(
    val tablesAdded: List<String>,
    val tablesRemoved: List<String>,
    val tablesModified: List<TableSchemaChange>,
    val tablesUnchanged: List<String>,
)

interface CompareSchemaUseCase {
    fun compareSchema(command: Command): SchemaChangeResult

    data class Command(
        val leftSnapshotId: SnapshotId,
        val rightSnapshotId: SnapshotId,
    )
}
