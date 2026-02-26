import { useNavigate, useParams } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { SnapshotLayout } from "@/components/snapshot/SnapshotLayout"
import { Tile, Tag, SkeletonText, SkeletonPlaceholder } from "@carbon/react"
import { DataTable, Db2Database, Calendar, Time } from "@carbon/react/icons"

interface SnapshotResponse {
  id: string
  datasourceId: string
  datasourceName: string
  snapshotType: string
  snapshotDate: string
  status: string
  startedAt: string
  completedAt: string | null
  tables: {
    schema: string
    table: string
    rowCount: number
    sizeBytes: number
  }[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function SnapshotDetailPage() {
  const { snapshotId } = useParams({
    from: "/authenticated/snapshots/$snapshotId",
  })
  const navigate = useNavigate()

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["snapshots", snapshotId],
    queryFn: () => api.get<SnapshotResponse>(`/api/snapshots/${snapshotId}`),
  })

  function handleSelectSnapshot(sid: string) {
    navigate({
      to: "/snapshots/$snapshotId",
      params: { snapshotId: sid },
    })
  }

  function handleSelectTable(sid: string, tableName: string) {
    const dotIndex = tableName.indexOf(".")
    const schema = tableName.substring(0, dotIndex)
    const table = tableName.substring(dotIndex + 1)
    navigate({
      to: "/snapshots/$snapshotId/$schema/$table",
      params: { snapshotId: sid, schema, table },
    })
  }

  return (
    <SnapshotLayout
      onSelectTable={handleSelectTable}
      onSelectSnapshot={handleSelectSnapshot}
      selectedSnapshotId={snapshotId}
    >
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <SkeletonText heading width="30%" />
          <SkeletonPlaceholder style={{ height: "8rem", width: "100%" }} />
          <SkeletonPlaceholder style={{ height: "16rem", width: "100%" }} />
        </div>
      ) : snapshot ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{snapshot.datasourceName}</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
              {snapshot.snapshotDate} &middot;{" "}
              {snapshot.snapshotType.toLowerCase()}
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
              <Db2Database size={16} />
              <span>{snapshot.datasourceName}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
              <Calendar size={16} />
              <span>{snapshot.snapshotDate}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
              <Time size={16} />
              <span>{snapshot.snapshotType.toLowerCase()}</span>
            </div>
            <Tag type="gray" size="sm">{snapshot.status}</Tag>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--cds-text-secondary)" }}>
              Tables ({snapshot.tables.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {snapshot.tables.map((t) => (
                <Tile
                  key={`${t.schema}.${t.table}`}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate({
                      to: "/snapshots/$snapshotId/$schema/$table",
                      params: {
                        snapshotId: snapshot.id,
                        schema: t.schema,
                        table: t.table,
                      },
                    })
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <DataTable size={16} style={{ color: "var(--cds-text-secondary)" }} />
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t.table}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                          {t.schema}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                      <span>{t.rowCount.toLocaleString()} rows</span>
                      <span>{formatBytes(t.sizeBytes)}</span>
                    </div>
                  </div>
                </Tile>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </SnapshotLayout>
  )
}
