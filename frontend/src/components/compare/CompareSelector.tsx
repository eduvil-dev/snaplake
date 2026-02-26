import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Select, SelectItem } from "@carbon/react"

interface SnapshotResponse {
  id: string
  datasourceId: string
  datasourceName: string
  snapshotType: string
  snapshotDate: string
  startedAt: string
  status: string
  tables: { schema: string; table: string }[]
}

interface DatasourceResponse {
  id: string
  name: string
}

interface CompareSelectorProps {
  datasourceId: string | null
  onDatasourceChange: (id: string) => void
  leftSnapshotId: string | null
  onLeftChange: (id: string) => void
  rightSnapshotId: string | null
  onRightChange: (id: string) => void
  tableName: string | null
  onTableChange: (name: string) => void
}

function formatSnapshotLabel(snap: SnapshotResponse): string {
  const time = new Date(snap.startedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${snap.snapshotType} / ${snap.snapshotDate} ${time}`
}

export function CompareSelector({
  datasourceId,
  onDatasourceChange,
  leftSnapshotId,
  onLeftChange,
  rightSnapshotId,
  onRightChange,
  tableName,
  onTableChange,
}: CompareSelectorProps) {
  const { data: datasources } = useQuery({
    queryKey: ["datasources"],
    queryFn: () => api.get<DatasourceResponse[]>("/api/datasources"),
  })

  const { data: snapshots } = useQuery({
    queryKey: ["snapshots", { datasourceId }],
    queryFn: () =>
      api.get<SnapshotResponse[]>(
        `/api/snapshots${datasourceId ? `?datasourceId=${datasourceId}` : ""}`,
      ),
    enabled: !!datasourceId,
  })

  const completedSnapshots = useMemo(
    () =>
      snapshots
        ?.filter((s) => s.status === "COMPLETED")
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)) ?? [],
    [snapshots],
  )

  const leftSnapshot = completedSnapshots.find(
    (s) => s.id === leftSnapshotId,
  )
  const rightSnapshot = completedSnapshots.find(
    (s) => s.id === rightSnapshotId,
  )

  // Available tables = intersection of both snapshot tables
  const availableTables = useMemo(() => {
    if (!leftSnapshot || !rightSnapshot) return []

    const leftTables = new Set(
      leftSnapshot.tables.map((t) => `${t.schema}.${t.table}`),
    )
    return rightSnapshot.tables
      .map((t) => `${t.schema}.${t.table}`)
      .filter((t) => leftTables.has(t))
  }, [leftSnapshot, rightSnapshot])

  return (
    <div style={{
      display: "grid",
      gap: "1rem",
      gridTemplateColumns: "repeat(4, 1fr)",
    }}>
      <Select
        id="compare-datasource"
        labelText="Datasource"
        value={datasourceId ?? ""}
        onChange={(e) => onDatasourceChange(e.target.value)}
      >
        <SelectItem value="" text="Select datasource" />
        {datasources?.map((ds) => (
          <SelectItem key={ds.id} value={ds.id} text={ds.name} />
        ))}
      </Select>

      <Select
        id="compare-left-snapshot"
        labelText="Left Snapshot"
        value={leftSnapshotId ?? ""}
        onChange={(e) => onLeftChange(e.target.value)}
        disabled={!datasourceId}
      >
        <SelectItem value="" text="Select snapshot" />
        {completedSnapshots.map((snap) => (
          <SelectItem
            key={snap.id}
            value={snap.id}
            text={formatSnapshotLabel(snap)}
          />
        ))}
      </Select>

      <Select
        id="compare-right-snapshot"
        labelText="Right Snapshot"
        value={rightSnapshotId ?? ""}
        onChange={(e) => onRightChange(e.target.value)}
        disabled={!datasourceId}
      >
        <SelectItem value="" text="Select snapshot" />
        {completedSnapshots.map((snap) => (
          <SelectItem
            key={snap.id}
            value={snap.id}
            text={formatSnapshotLabel(snap)}
          />
        ))}
      </Select>

      <Select
        id="compare-table"
        labelText="Table"
        value={tableName ?? ""}
        onChange={(e) => onTableChange(e.target.value)}
        disabled={availableTables.length === 0}
      >
        <SelectItem value="" text="Select table" />
        {availableTables.map((t) => (
          <SelectItem key={t} value={t} text={t} />
        ))}
      </Select>
    </div>
  )
}
