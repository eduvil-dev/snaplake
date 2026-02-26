import { useState, useCallback } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { SnapshotLayout } from "@/components/snapshot/SnapshotLayout"
import {
  Tile,
  Tag,
  SkeletonText,
  SkeletonPlaceholder,
  TextInput,
  TextArea,
  Button,
} from "@carbon/react"
import {
  DataTable,
  Db2Database,
  Calendar,
  Time,
  Add,
} from "@carbon/react/icons"

interface SnapshotResponse {
  id: string
  datasourceId: string
  datasourceName: string
  snapshotType: string
  snapshotDate: string
  status: string
  startedAt: string
  completedAt: string | null
  tags: string[]
  memo: string | null
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
  const queryClient = useQueryClient()
  const [newTag, setNewTag] = useState("")
  const [memoValue, setMemoValue] = useState<string | null>(null)
  const [memoEditing, setMemoEditing] = useState(false)

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["snapshots", snapshotId],
    queryFn: () => api.get<SnapshotResponse>(`/api/snapshots/${snapshotId}`),
  })

  const metadataMutation = useMutation({
    mutationFn: (body: { tags?: string[]; memo?: string | null }) =>
      api.patch<SnapshotResponse>(
        `/api/snapshots/${snapshotId}/metadata`,
        body,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots", snapshotId] })
      queryClient.invalidateQueries({ queryKey: ["snapshots"] })
    },
  })

  const handleAddTag = useCallback(() => {
    const tag = newTag.trim()
    if (!tag || !snapshot) return
    if (snapshot.tags.includes(tag)) {
      setNewTag("")
      return
    }
    metadataMutation.mutate({ tags: [...snapshot.tags, tag] })
    setNewTag("")
  }, [newTag, snapshot, metadataMutation])

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      if (!snapshot) return
      metadataMutation.mutate({
        tags: snapshot.tags.filter((t) => t !== tagToRemove),
      })
    },
    [snapshot, metadataMutation],
  )

  const handleSaveMemo = useCallback(() => {
    metadataMutation.mutate({ memo: memoValue ?? "" })
    setMemoEditing(false)
  }, [memoValue, metadataMutation])

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

          {/* Tags */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--cds-text-secondary)" }}>
              Tags
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              {snapshot.tags.map((tag) => (
                <Tag
                  key={tag}
                  type="blue"
                  size="sm"
                  filter
                  onClose={() => handleRemoveTag(tag)}
                >
                  {tag}
                </Tag>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <TextInput
                  id="new-tag"
                  size="sm"
                  labelText=""
                  hideLabel
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  style={{ width: "8rem" }}
                />
                <Button
                  kind="ghost"
                  size="sm"
                  hasIconOnly
                  renderIcon={Add}
                  iconDescription="Add tag"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                />
              </div>
            </div>
          </div>

          {/* Memo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--cds-text-secondary)" }}>
              Memo
            </h3>
            {memoEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <TextArea
                  id="snapshot-memo"
                  labelText=""
                  hideLabel
                  rows={3}
                  value={memoValue ?? ""}
                  onChange={(e) => setMemoValue(e.target.value)}
                  placeholder="Add a note about this snapshot..."
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button size="sm" onClick={handleSaveMemo}>
                    Save
                  </Button>
                  <Button
                    kind="ghost"
                    size="sm"
                    onClick={() => {
                      setMemoEditing(false)
                      setMemoValue(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Tile
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setMemoValue(snapshot.memo ?? "")
                  setMemoEditing(true)
                }}
              >
                <p style={{ fontSize: "0.875rem", color: snapshot.memo ? "var(--cds-text-primary)" : "var(--cds-text-secondary)", whiteSpace: "pre-wrap" }}>
                  {snapshot.memo || "Click to add a memo..."}
                </p>
              </Tile>
            )}
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
