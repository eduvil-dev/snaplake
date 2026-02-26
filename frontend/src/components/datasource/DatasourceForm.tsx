import { useState, useCallback } from "react"
import {
  TextInput,
  NumberInput,
  Select,
  SelectItem,
  Button,
  InlineLoading,
} from "@carbon/react"
import { CheckmarkFilled, ErrorFilled } from "@carbon/react/icons"
import { ScheduleInput } from "./ScheduleInput"
import { api } from "@/lib/api"

export interface DatasourceFormData {
  name: string
  type: string
  host: string
  port: string
  database: string
  username: string
  password: string
  schemas: string
  cronExpression: string | null
  retentionDaily: number
  retentionMonthly: number
}

interface DatasourceFormProps {
  initialData?: DatasourceFormData
  datasourceId?: string
  onSubmit: (data: DatasourceFormData) => Promise<void>
  submitLabel: string
  isSubmitting: boolean
}

const DEFAULT_DATA: DatasourceFormData = {
  name: "",
  type: "POSTGRESQL",
  host: "",
  port: "5432",
  database: "",
  username: "",
  password: "",
  schemas: "public",
  cronExpression: null,
  retentionDaily: 30,
  retentionMonthly: 12,
}

export function DatasourceForm({
  initialData,
  datasourceId,
  onSubmit,
  submitLabel,
  isSubmitting,
}: DatasourceFormProps) {
  const [data, setData] = useState<DatasourceFormData>(
    initialData ?? DEFAULT_DATA,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle")
  const [testMessage, setTestMessage] = useState("")

  const handleScheduleChange = useCallback((cron: string | null) => {
    setData((prev) => ({ ...prev, cronExpression: cron }))
  }, [])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!data.name.trim()) newErrors.name = "Name is required"
    if (!data.host.trim()) newErrors.host = "Host is required"
    if (!data.port.trim()) newErrors.port = "Port is required"
    if (!data.database.trim()) newErrors.database = "Database is required"
    if (!data.username.trim()) newErrors.username = "Username is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleTest() {
    if (!datasourceId) return
    setTestStatus("testing")
    try {
      const result = await api.post<{ success: boolean; message: string }>(
        `/api/datasources/${datasourceId}/test`,
      )
      setTestStatus(result.success ? "success" : "error")
      setTestMessage(result.message)
    } catch (err) {
      setTestStatus("error")
      setTestMessage(err instanceof Error ? err.message : "Test failed")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(data)
  }

  function updatePort(type: string) {
    const portMap: Record<string, string> = {
      POSTGRESQL: "5432",
      MYSQL: "3306",
    }
    setData((prev) => ({
      ...prev,
      type,
      port: portMap[type] ?? prev.port,
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Connection */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Connection</h3>
        <TextInput
          id="ds-name"
          labelText="Name"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="production-db"
          invalid={!!errors.name}
          invalidText={errors.name}
        />
        <Select
          id="ds-type"
          labelText="Database Type"
          value={data.type}
          onChange={(e) => updatePort(e.target.value)}
        >
          <SelectItem value="POSTGRESQL" text="PostgreSQL" />
          <SelectItem value="MYSQL" text="MySQL" />
        </Select>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
          <TextInput
            id="ds-host"
            labelText="Host"
            value={data.host}
            onChange={(e) => setData({ ...data, host: e.target.value })}
            placeholder="localhost"
            invalid={!!errors.host}
            invalidText={errors.host}
          />
          <TextInput
            id="ds-port"
            labelText="Port"
            value={data.port}
            onChange={(e) => setData({ ...data, port: e.target.value })}
            invalid={!!errors.port}
            invalidText={errors.port}
          />
        </div>
        <TextInput
          id="ds-database"
          labelText="Database"
          value={data.database}
          onChange={(e) => setData({ ...data, database: e.target.value })}
          placeholder="mydb"
          invalid={!!errors.database}
          invalidText={errors.database}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <TextInput
            id="ds-username"
            labelText="Username"
            value={data.username}
            onChange={(e) => setData({ ...data, username: e.target.value })}
            invalid={!!errors.username}
            invalidText={errors.username}
          />
          <TextInput
            id="ds-password"
            type="password"
            labelText="Password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
        </div>
        <TextInput
          id="ds-schemas"
          labelText="Schemas (comma-separated)"
          value={data.schemas}
          onChange={(e) => setData({ ...data, schemas: e.target.value })}
          placeholder="public"
        />
        {datasourceId && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Button
              type="button"
              kind="tertiary"
              size="sm"
              onClick={handleTest}
              disabled={testStatus === "testing"}
            >
              Test Connection
            </Button>
            {testStatus === "testing" && <InlineLoading description="Testing..." />}
            {testStatus === "success" && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", color: "var(--cds-support-success)" }}>
                <CheckmarkFilled size={16} /> {testMessage}
              </span>
            )}
            {testStatus === "error" && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", color: "var(--cds-support-error)" }}>
                <ErrorFilled size={16} /> {testMessage}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div style={{ marginBottom: "2rem" }}>
        <ScheduleInput
          value={data.cronExpression}
          onChange={handleScheduleChange}
        />
      </div>

      {/* Retention */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Retention Policy</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <NumberInput
            id="ret-daily"
            label="Daily Snapshots to Keep"
            min={0}
            value={data.retentionDaily}
            onChange={(_e: unknown, { value }: { value: number | string }) =>
              setData({ ...data, retentionDaily: Number(value) || 0 })
            }
            helperText="0 = keep all"
          />
          <NumberInput
            id="ret-monthly"
            label="Monthly Snapshots to Keep"
            min={0}
            value={data.retentionMonthly}
            onChange={(_e: unknown, { value }: { value: number | string }) =>
              setData({ ...data, retentionMonthly: Number(value) || 0 })
            }
            helperText="0 = keep all"
          />
        </div>
      </div>

      <Button type="submit" style={{ width: "100%" }} disabled={isSubmitting}>
        {isSubmitting ? (
          <InlineLoading description="Saving..." />
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
