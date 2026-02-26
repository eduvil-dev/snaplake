package io.clroot.snaplake.application.port.inbound

import io.clroot.snaplake.domain.model.SnapshotMeta
import io.clroot.snaplake.domain.vo.DatasourceId
import io.clroot.snaplake.domain.vo.SnapshotId

interface TakeSnapshotUseCase {
    fun takeSnapshot(datasourceId: DatasourceId): SnapshotMeta
}

interface GetSnapshotUseCase {
    fun getById(id: SnapshotId): SnapshotMeta

    fun getAll(): List<SnapshotMeta>

    fun getByDatasourceId(datasourceId: DatasourceId): List<SnapshotMeta>
}

interface DeleteSnapshotUseCase {
    fun delete(id: SnapshotId)
}

interface RecoverOrphanedSnapshotsUseCase {
    fun recoverAll(): Int

    fun recoverStale(): Int
}

interface UpdateSnapshotMetadataUseCase {
    fun updateMetadata(command: Command): SnapshotMeta

    data class Command(
        val snapshotId: SnapshotId,
        val tags: List<String>?,
        val memo: String?,
    )
}
