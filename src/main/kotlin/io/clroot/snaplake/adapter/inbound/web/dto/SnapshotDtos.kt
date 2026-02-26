package io.clroot.snaplake.adapter.inbound.web.dto

import io.clroot.snaplake.domain.model.SnapshotMeta
import io.clroot.snaplake.domain.model.TableMeta
import java.time.Instant
import java.time.LocalDate

data class SnapshotResponse(
    val id: String,
    val datasourceId: String,
    val datasourceName: String,
    val snapshotType: String,
    val snapshotDate: LocalDate,
    val status: String,
    val startedAt: Instant,
    val completedAt: Instant?,
    val errorMessage: String?,
    val tags: List<String>,
    val memo: String?,
    val tables: List<TableMetaResponse>,
) {
    companion object {
        fun from(snapshot: SnapshotMeta): SnapshotResponse =
            SnapshotResponse(
                id = snapshot.id.value,
                datasourceId = snapshot.datasourceId.value,
                datasourceName = snapshot.datasourceName,
                snapshotType = snapshot.snapshotType.name,
                snapshotDate = snapshot.snapshotDate,
                status = snapshot.status.name,
                startedAt = snapshot.startedAt,
                completedAt = snapshot.completedAt,
                errorMessage = snapshot.errorMessage,
                tags = snapshot.tags,
                memo = snapshot.memo,
                tables = snapshot.tables.map { TableMetaResponse.from(it) },
            )
    }
}

data class UpdateSnapshotMetadataRequest(
    val tags: List<String>?,
    val memo: String?,
)

data class TableMetaResponse(
    val schema: String,
    val table: String,
    val rowCount: Long,
    val sizeBytes: Long,
    val storagePath: String,
) {
    companion object {
        fun from(meta: TableMeta): TableMetaResponse =
            TableMetaResponse(
                schema = meta.schema,
                table = meta.table,
                rowCount = meta.rowCount,
                sizeBytes = meta.sizeBytes,
                storagePath = meta.storagePath,
            )
    }
}
