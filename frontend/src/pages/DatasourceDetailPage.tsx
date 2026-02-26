import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { api } from "@/lib/api"
import {
  Button,
  Tile,
  Tag,
  SkeletonText,
  SkeletonPlaceholder,
  Modal,
  InlineLoading,
} from "@carbon/react"
import {
  DatasourceForm,
  type DatasourceFormData,
} from "@/components/datasource/DatasourceForm"
import { useState } from "react"
import {
  ArrowLeft,
  Camera,
  Edit,
  TrashCan,
  CheckmarkFilled,
  WarningAlt,
  Time,
} from "@carbon/react/icons"

interface DatasourceResponse {
  id: string
  name: string
  type: string
  host: string
  port: number
  database: string
  username: string
  schemas: string[]
  cronExpression: string | null
  retentionDaily: number
  retentionMonthly: number
  includedTables: Record<string, string[]>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface SnapshotResponse {
  id: string
  datasourceId: string
  datasourceName: string
  snapshotType: string
  snapshotDate: string
  status: string
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
  tables: { schema: string; table: string; rowCount: number; sizeBytes: number }[]
}

export function DatasourceDetailPage() {
  const { id } = useParams({ from: "/authenticated/datasources/$id" })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)

  const { data: ds, isLoading } = useQuery({
    queryKey: ["datasources", id],
    queryFn: () => api.get<DatasourceResponse>(`/api/datasources/${id}`),
  })

  const { data: snapshots } = useQuery({
    queryKey: ["snapshots", { datasourceId: id }],
    queryFn: () =>
      api.get<SnapshotResponse[]>(`/api/snapshots?datasourceId=${id}`),
  })

  const updateMutation = useMutation({
    mutationFn: (data: DatasourceFormData) =>
      api.put(`/api/datasources/${id}`, {
        name: data.name,
        type: data.type,
        host: data.host,
        port: parseInt(data.port, 10),
        database: data.database,
        username: data.username,
        password: data.password || undefined,
        schemas: data.schemas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        cronExpression: data.cronExpression,
        retentionDaily: data.retentionDaily,
        retentionMonthly: data.retentionMonthly,
        includedTables: data.includedTables,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasources"] })
      setShowEdit(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/datasources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasources"] })
      navigate({ to: "/datasources" })
    },
  })

  const snapshotMutation = useMutation({
    mutationFn: () =>
      api.post<SnapshotResponse>(`/api/datasources/${id}/snapshot`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["snapshots", { datasourceId: id }],
      })
    },
  })

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <SkeletonText heading width="30%" />
        <SkeletonPlaceholder style={{ height: "16rem", width: "100%" }} />
      </div>
    )
  }

  if (!ds) {
    return <p style={{ color: "var(--cds-text-secondary)" }}>Datasource not found.</p>
  }

  const recentSnapshots = snapshots
    ?.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    .slice(0, 10)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          renderIcon={ArrowLeft}
          iconDescription="Back"
          onClick={() => navigate({ to: "/datasources" })}
        />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{ds.name}</h1>
          <p style={{ color: "var(--cds-text-secondary)" }}>
            {ds.type} &middot; {ds.host}:{ds.port}/{ds.database}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            kind="tertiary"
            size="sm"
            renderIcon={Camera}
            onClick={() => snapshotMutation.mutate()}
            disabled={snapshotMutation.isPending}
          >
            {snapshotMutation.isPending ? (
              <InlineLoading description="Taking..." />
            ) : (
              "Take Snapshot"
            )}
          </Button>
          <Button
            kind="tertiary"
            size="sm"
            renderIcon={Edit}
            onClick={() => setShowEdit(true)}
          >
            Edit
          </Button>
          <Button
            kind="danger"
            size="sm"
            renderIcon={TrashCan}
            onClick={() => {
              if (confirm("Delete this datasource? This cannot be undone.")) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Tile>
          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--cds-text-secondary)", marginBottom: "0.5rem" }}>Status</p>
          <Tag type={ds.enabled ? "green" : "gray"} size="sm">
            {ds.enabled ? "Active" : "Disabled"}
          </Tag>
        </Tile>
        <Tile>
          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--cds-text-secondary)", marginBottom: "0.5rem" }}>Schedule</p>
          <p style={{ fontSize: "0.875rem" }}>
            {ds.cronExpression ?? "Manual only"}
          </p>
        </Tile>
        <Tile>
          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--cds-text-secondary)", marginBottom: "0.5rem" }}>Schemas</p>
          <p style={{ fontSize: "0.875rem" }}>{ds.schemas.join(", ")}</p>
        </Tile>
      </div>

      {/* Mutation error display */}
      {(deleteMutation.isError || snapshotMutation.isError) && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem",
          fontSize: "0.875rem",
          color: "var(--cds-support-error)",
          border: "1px solid var(--cds-support-error)",
          backgroundColor: "var(--cds-notification-error-background-color, rgba(218, 30, 40, 0.1))",
        }}>
          <WarningAlt size={16} style={{ flexShrink: 0 }} />
          {(deleteMutation.error ?? snapshotMutation.error) instanceof Error
            ? (deleteMutation.error ?? snapshotMutation.error)?.message
            : "An error occurred"}
        </div>
      )}

      {/* Snapshots */}
      <section>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Snapshots</h2>
        <p style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Recent snapshot operations
        </p>
        {!recentSnapshots?.length ? (
          <p style={{ padding: "2rem 0", textAlign: "center", color: "var(--cds-text-secondary)" }}>
            No snapshots yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentSnapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--cds-border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {snapshot.status === "COMPLETED" ? (
                    <CheckmarkFilled size={16} style={{ color: "var(--cds-support-success)" }} />
                  ) : snapshot.status === "FAILED" ? (
                    <WarningAlt size={16} style={{ color: "var(--cds-support-error)" }} />
                  ) : (
                    <Time size={16} style={{ color: "var(--cds-text-secondary)" }} />
                  )}
                  <div>
                    <p style={{ fontWeight: 500 }}>
                      {snapshot.snapshotType} &middot;{" "}
                      {snapshot.snapshotDate}
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
                      {snapshot.tables.length} tables &middot;{" "}
                      {new Date(snapshot.startedAt).toLocaleString()}
                    </p>
                    {snapshot.status === "FAILED" && snapshot.errorMessage && (
                      <p style={{ fontSize: "0.75rem", color: "var(--cds-support-error)" }}>{snapshot.errorMessage}</p>
                    )}
                  </div>
                </div>
                <Tag
                  type={snapshot.status === "COMPLETED" ? "green" : snapshot.status === "FAILED" ? "red" : "gray"}
                  size="sm"
                >
                  {snapshot.status}
                </Tag>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={showEdit}
        onRequestClose={() => setShowEdit(false)}
        modalHeading="Edit Datasource"
        passiveModal
        size="md"
      >
        {updateMutation.isError && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            color: "var(--cds-support-error)",
            border: "1px solid var(--cds-support-error)",
            backgroundColor: "var(--cds-notification-error-background-color, rgba(218, 30, 40, 0.1))",
          }}>
          <WarningAlt size={16} style={{ flexShrink: 0 }} />
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "Failed to update datasource"}
          </div>
        )}
        <DatasourceForm
          datasourceId={id}
          initialData={{
            name: ds.name,
            type: ds.type,
            host: ds.host,
            port: String(ds.port),
            database: ds.database,
            username: ds.username,
            password: "",
            schemas: ds.schemas.join(", "),
            cronExpression: ds.cronExpression,
            retentionDaily: ds.retentionDaily,
            retentionMonthly: ds.retentionMonthly,
            includedTables: ds.includedTables ?? {},
          }}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync(data)
          }}
          submitLabel="Save Changes"
          isSubmitting={updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
