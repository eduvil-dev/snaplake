package io.clroot.snaplake.application.port.outbound

import io.clroot.snaplake.domain.model.*
import io.clroot.snaplake.domain.vo.DatasourceId
import io.clroot.snaplake.domain.vo.SnapshotId

interface SaveUserPort {
    fun save(user: User): User
}

interface LoadUserPort {
    fun findByUsername(username: String): User?

    fun existsAny(): Boolean
}

interface SaveDatasourcePort {
    fun save(datasource: Datasource): Datasource

    fun deleteById(id: DatasourceId)
}

interface LoadDatasourcePort {
    fun findById(id: DatasourceId): Datasource?

    fun findAll(): List<Datasource>

    fun findAllEnabled(): List<Datasource>
}

interface SaveStorageConfigPort {
    fun save(config: StorageConfig): StorageConfig
}

interface LoadStorageConfigPort {
    fun find(): StorageConfig?
}

interface SaveSnapshotPort {
    fun save(snapshot: SnapshotMeta): SnapshotMeta
}

interface LoadSnapshotPort {
    fun findById(id: SnapshotId): SnapshotMeta?

    fun findByDatasourceId(datasourceId: DatasourceId): List<SnapshotMeta>

    fun findByDatasourceIdAndStatus(
        datasourceId: DatasourceId,
        status: SnapshotStatus,
    ): SnapshotMeta?

    fun findAll(): List<SnapshotMeta>

    fun deleteById(id: SnapshotId)
}
