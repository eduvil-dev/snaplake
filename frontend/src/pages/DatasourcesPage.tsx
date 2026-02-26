import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { api } from "@/lib/api"
import {
  Button,
  Tile,
  Tag,
  SkeletonPlaceholder,
  Modal,
} from "@carbon/react"
import {
  DatasourceForm,
  type DatasourceFormData,
} from "@/components/datasource/DatasourceForm"
import { Db2Database, Add, WarningAlt } from "@carbon/react/icons"
import cronstrue from "cronstrue"

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
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export function DatasourcesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: datasources, isLoading } = useQuery({
    queryKey: ["datasources"],
    queryFn: () => api.get<DatasourceResponse[]>("/api/datasources"),
  })

  const createMutation = useMutation({
    mutationFn: (data: DatasourceFormData) =>
      api.post("/api/datasources", {
        name: data.name,
        type: data.type,
        host: data.host,
        port: parseInt(data.port, 10),
        database: data.database,
        username: data.username,
        password: data.password,
        schemas: data.schemas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        cronExpression: data.cronExpression,
        retentionDaily: data.retentionDaily,
        retentionMonthly: data.retentionMonthly,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasources"] })
      setShowCreate(false)
    },
  })

  function getCronLabel(cron: string | null) {
    if (!cron) return "Manual only"
    try {
      return cronstrue.toString(cron)
    } catch {
      return cron
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Datasources</h1>
          <p style={{ color: "var(--cds-text-secondary)" }}>
            Manage database connections and snapshot schedules
          </p>
        </div>
        <Button renderIcon={Add} onClick={() => setShowCreate(true)}>
          Add Datasource
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonPlaceholder key={i} style={{ height: "10rem", width: "100%" }} />
          ))}
        </div>
      ) : !datasources?.length ? (
        <Tile>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 0" }}>
            <Db2Database size={48} style={{ color: "var(--cds-text-secondary)", marginBottom: "1rem" }} />
            <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>No datasources yet</p>
            <p style={{ color: "var(--cds-text-secondary)", marginBottom: "1.5rem" }}>
              Add your first database connection to start taking snapshots.
            </p>
            <Button renderIcon={Add} onClick={() => setShowCreate(true)}>
              Add Datasource
            </Button>
          </div>
        </Tile>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {datasources.map((ds) => (
            <Tile
              key={ds.id}
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate({ to: "/datasources/$id", params: { id: ds.id } })
              }
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <p style={{ fontSize: "1rem", fontWeight: 600 }}>{ds.name}</p>
                <Tag type={ds.enabled ? "green" : "gray"} size="sm">
                  {ds.enabled ? "Active" : "Disabled"}
                </Tag>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", marginBottom: "1rem" }}>
                {ds.type} &middot; {ds.host}:{ds.port}/{ds.database}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
                <div>
                  <span>Schedule: </span>
                  <span>{getCronLabel(ds.cronExpression)}</span>
                </div>
                <div>
                  <span>Schemas: </span>
                  <span>{ds.schemas.join(", ")}</span>
                </div>
              </div>
            </Tile>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onRequestClose={() => setShowCreate(false)}
        modalHeading="Add Datasource"
        passiveModal
        size="md"
      >
        {createMutation.isError && (
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
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "Failed to create datasource"}
          </div>
        )}
        <DatasourceForm
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data)
          }}
          submitLabel="Create Datasource"
          isSubmitting={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}
