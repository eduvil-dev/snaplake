import { TextInput, Select, SelectItem, Button } from "@carbon/react"

export interface DatasourceData {
  skip: boolean
  name: string
  type: string
  host: string
  port: string
  database: string
  username: string
  password: string
  schemas: string
}

interface DatasourceStepProps {
  data: DatasourceData
  onChange: (data: DatasourceData) => void
  onNext: () => void
  onBack: () => void
}

export function DatasourceStep({
  data,
  onChange,
  onNext,
  onBack,
}: DatasourceStepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Register a Datasource
        </h2>
        <p style={{ marginTop: "0.5rem", color: "var(--cds-text-secondary)" }}>
          Optionally register your first database connection. You can skip this
          and add one later.
        </p>
      </div>

      {data.skip ? (
        <div>
          <p style={{ color: "var(--cds-text-secondary)", marginBottom: "1rem" }}>
            You chose to skip datasource registration. You can add datasources
            from the dashboard.
          </p>
          <Button
            kind="tertiary"
            onClick={() => onChange({ ...data, skip: false })}
          >
            Add a datasource now
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <TextInput
            id="ds-name"
            labelText="Name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="production-db"
          />
          <Select
            id="ds-type"
            labelText="Database Type"
            value={data.type}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
          >
            <SelectItem value="POSTGRESQL" text="PostgreSQL" />
            <SelectItem value="MYSQL" text="MySQL" />
          </Select>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
            <TextInput
              id="ds-host"
              labelText="Host"
              value={data.host}
              onChange={(e) => onChange({ ...data, host: e.target.value })}
              placeholder="localhost"
            />
            <TextInput
              id="ds-port"
              labelText="Port"
              value={data.port}
              onChange={(e) => onChange({ ...data, port: e.target.value })}
              placeholder="5432"
            />
          </div>
          <TextInput
            id="ds-database"
            labelText="Database"
            value={data.database}
            onChange={(e) => onChange({ ...data, database: e.target.value })}
            placeholder="mydb"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <TextInput
              id="ds-username"
              labelText="Username"
              value={data.username}
              onChange={(e) => onChange({ ...data, username: e.target.value })}
            />
            <TextInput
              id="ds-password"
              type="password"
              labelText="Password"
              value={data.password}
              onChange={(e) => onChange({ ...data, password: e.target.value })}
            />
          </div>
          <TextInput
            id="ds-schemas"
            labelText="Schemas (comma-separated)"
            value={data.schemas}
            onChange={(e) => onChange({ ...data, schemas: e.target.value })}
            placeholder="public"
          />
          <Button
            kind="ghost"
            size="sm"
            onClick={() => onChange({ ...data, skip: true })}
          >
            Skip this step
          </Button>
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem" }}>
        <Button kind="secondary" onClick={onBack} style={{ flex: 1 }}>
          Back
        </Button>
        <Button onClick={onNext} style={{ flex: 1 }}>
          Next
        </Button>
      </div>
    </div>
  )
}
