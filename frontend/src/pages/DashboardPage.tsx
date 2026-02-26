import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button, ClickableTile, Tag, SkeletonText, SkeletonPlaceholder } from "@carbon/react"
import { useNavigate } from "@tanstack/react-router"
import {
  Db2Database,
  Layers,
  Time,
  WarningAlt,
  CheckmarkFilled,
  Add,
} from "@carbon/react/icons"

interface DatasourceResponse {
  id: string
  name: string
  type: string
  cronExpression: string | null
  enabled: boolean
}

interface SnapshotResponse {
  id: string
  datasourceId: string
  datasourceName: string
  snapshotType: string
  snapshotDate: string
  status: string
  startedAt: string
  completedAt: string | null
  tables: { schema: string; table: string; rowCount: number; sizeBytes: number }[]
}

export function DashboardPage() {
  const navigate = useNavigate()

  const { data: datasources, isLoading: dsLoading } = useQuery({
    queryKey: ["datasources"],
    queryFn: () => api.get<DatasourceResponse[]>("/api/datasources"),
  })

  const { data: snapshots, isLoading: snapLoading } = useQuery({
    queryKey: ["snapshots"],
    queryFn: () => api.get<SnapshotResponse[]>("/api/snapshots"),
  })

  const recentSnapshots = snapshots
    ?.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    .slice(0, 10)

  const activeDatasources = datasources?.filter((d) => d.enabled).length ?? 0
  const scheduledDatasources =
    datasources?.filter((d) => d.cronExpression).length ?? 0
  const completedSnapshots =
    snapshots?.filter((s) => s.status === "COMPLETED").length ?? 0
  const failedSnapshots =
    snapshots?.filter((s) => s.status === "FAILED").length ?? 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ color: "var(--cds-text-secondary)" }}>
            Overview of your database snapshots
          </p>
        </div>
        <Button renderIcon={Add} onClick={() => navigate({ to: "/datasources" })}>
          Add Datasource
        </Button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <SummaryCard
          title="Datasources"
          value={dsLoading ? null : String(activeDatasources)}
          description={`${scheduledDatasources} scheduled`}
          icon={<Db2Database size={16} />}
          onClick={() => navigate({ to: "/datasources" })}
        />
        <SummaryCard
          title="Total Snapshots"
          value={snapLoading ? null : String(snapshots?.length ?? 0)}
          description={`${completedSnapshots} completed`}
          icon={<Layers size={16} />}
          onClick={() => navigate({ to: "/snapshots" })}
        />
        <SummaryCard
          title="Scheduled"
          value={dsLoading ? null : String(scheduledDatasources)}
          description="Active schedules"
          icon={<Time size={16} />}
          onClick={() => navigate({ to: "/datasources" })}
        />
        <SummaryCard
          title="Failed"
          value={snapLoading ? null : String(failedSnapshots)}
          description="Snapshots with errors"
          icon={<WarningAlt size={16} />}
          onClick={() => navigate({ to: "/snapshots" })}
        />
      </div>

      {/* Recent Snapshots */}
      <section>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Recent Snapshots</h2>
        <p style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Last 10 snapshot operations
        </p>
        {snapLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonPlaceholder key={i} style={{ height: "3rem", width: "100%" }} />
            ))}
          </div>
        ) : !recentSnapshots?.length ? (
          <p style={{ padding: "2rem 0", textAlign: "center", color: "var(--cds-text-secondary)" }}>
            No snapshots yet. Trigger one from a datasource.
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
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate({
                    to: "/snapshots/$snapshotId",
                    params: { snapshotId: snapshot.id },
                  })
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <StatusIcon status={snapshot.status} />
                  <div>
                    <p style={{ fontWeight: 500 }}>{snapshot.datasourceName}</p>
                    <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
                      {snapshot.snapshotType} &middot;{" "}
                      {snapshot.snapshotDate} &middot;{" "}
                      {snapshot.tables.length} tables
                    </p>
                  </div>
                </div>
                <SnapshotStatusTag status={snapshot.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Datasource Status */}
      <section>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Datasources</h2>
        <p style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Connection status overview
        </p>
        {dsLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonPlaceholder key={i} style={{ height: "3rem", width: "100%" }} />
            ))}
          </div>
        ) : !datasources?.length ? (
          <p style={{ padding: "2rem 0", textAlign: "center", color: "var(--cds-text-secondary)" }}>
            No datasources registered yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {datasources.map((ds) => (
              <div
                key={ds.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--cds-border-subtle)",
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate({ to: "/datasources/$id", params: { id: ds.id } })
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Db2Database size={16} style={{ color: "var(--cds-text-secondary)" }} />
                  <div>
                    <p style={{ fontWeight: 500 }}>{ds.name}</p>
                    <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
                      {ds.type}
                      {ds.cronExpression && ` \u00b7 ${ds.cronExpression}`}
                    </p>
                  </div>
                </div>
                <Tag type={ds.enabled ? "green" : "gray"} size="sm">
                  {ds.enabled ? "Active" : "Disabled"}
                </Tag>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  onClick,
}: {
  title: string
  value: string | null
  description: string
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <ClickableTile onClick={onClick ?? (() => {})}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--cds-text-secondary)" }}>{title}</span>
        <span style={{ color: "var(--cds-text-secondary)" }}>{icon}</span>
      </div>
      {value === null ? (
        <SkeletonText heading width="40%" />
      ) : (
        <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
      )}
      <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", marginTop: "0.25rem" }}>{description}</p>
    </ClickableTile>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return <CheckmarkFilled size={16} style={{ color: "var(--cds-support-success)" }} />
  }
  if (status === "FAILED") {
    return <WarningAlt size={16} style={{ color: "var(--cds-support-error)" }} />
  }
  return <Time size={16} style={{ color: "var(--cds-text-secondary)" }} />
}

function SnapshotStatusTag({ status }: { status: string }) {
  const type = status === "COMPLETED" ? "green" : status === "FAILED" ? "red" : "gray"
  return (
    <Tag type={type} size="sm">
      {status}
    </Tag>
  )
}
