import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
  Tag,
  SkeletonText,
  Tile,
  Accordion,
  AccordionItem,
} from "@carbon/react"
import { WarningAlt } from "@carbon/react/icons"

interface ColumnInfoResponse {
  name: string
  type: string
}

interface ColumnTypeChangeResponse {
  name: string
  leftType: string
  rightType: string
}

interface TableSchemaChangeResponse {
  tableName: string
  columnsAdded: ColumnInfoResponse[]
  columnsRemoved: ColumnInfoResponse[]
  columnsTypeChanged: ColumnTypeChangeResponse[]
}

interface SchemaChangeResultResponse {
  tablesAdded: string[]
  tablesRemoved: string[]
  tablesModified: TableSchemaChangeResponse[]
  tablesUnchanged: string[]
}

interface CompareSchemaViewProps {
  leftSnapshotId: string
  rightSnapshotId: string
}

export function CompareSchemaView({
  leftSnapshotId,
  rightSnapshotId,
}: CompareSchemaViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["compare-schema", leftSnapshotId, rightSnapshotId],
    queryFn: () =>
      api.post<SchemaChangeResultResponse>("/api/compare/schema", {
        leftSnapshotId,
        rightSnapshotId,
      }),
  })

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <SkeletonText heading width="40%" />
        <SkeletonText paragraph lineCount={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "1rem",
        color: "var(--cds-support-error)",
      }}>
        <WarningAlt size={16} />
        <span>{error instanceof Error ? error.message : "Failed to load schema comparison"}</span>
      </div>
    )
  }

  if (!data) return null

  const totalChanges =
    data.tablesAdded.length +
    data.tablesRemoved.length +
    data.tablesModified.length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Tile style={{ flex: 1, minWidth: "120px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>Added</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 600, color: data.tablesAdded.length > 0 ? "var(--cds-support-success)" : "var(--cds-text-primary)" }}>
            {data.tablesAdded.length}
          </p>
        </Tile>
        <Tile style={{ flex: 1, minWidth: "120px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>Removed</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 600, color: data.tablesRemoved.length > 0 ? "var(--cds-support-error)" : "var(--cds-text-primary)" }}>
            {data.tablesRemoved.length}
          </p>
        </Tile>
        <Tile style={{ flex: 1, minWidth: "120px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>Modified</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 600, color: data.tablesModified.length > 0 ? "var(--cds-support-warning)" : "var(--cds-text-primary)" }}>
            {data.tablesModified.length}
          </p>
        </Tile>
        <Tile style={{ flex: 1, minWidth: "120px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>Unchanged</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            {data.tablesUnchanged.length}
          </p>
        </Tile>
      </div>

      {totalChanges === 0 ? (
        <Tile>
          <p style={{ textAlign: "center", padding: "2rem 0", color: "var(--cds-text-secondary)" }}>
            No schema changes detected between these two snapshots.
          </p>
        </Tile>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Added tables */}
          {data.tablesAdded.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Tables Added
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {data.tablesAdded.map((table) => (
                  <div
                    key={table}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "rgba(36, 161, 72, 0.1)",
                      borderLeft: "3px solid var(--cds-support-success)",
                    }}
                  >
                    <Tag type="green" size="sm">+</Tag>
                    <span style={{ fontSize: "0.875rem" }}>{table}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed tables */}
          {data.tablesRemoved.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Tables Removed
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {data.tablesRemoved.map((table) => (
                  <div
                    key={table}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "rgba(218, 30, 40, 0.1)",
                      borderLeft: "3px solid var(--cds-support-error)",
                    }}
                  >
                    <Tag type="red" size="sm">-</Tag>
                    <span style={{ fontSize: "0.875rem" }}>{table}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified tables */}
          {data.tablesModified.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Tables Modified
              </h3>
              <Accordion>
                {data.tablesModified.map((change) => (
                  <AccordionItem
                    key={change.tableName}
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Tag type="warm-gray" size="sm">~</Tag>
                        <span>{change.tableName}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                          ({change.columnsAdded.length} added, {change.columnsRemoved.length} removed, {change.columnsTypeChanged.length} type changed)
                        </span>
                      </div>
                    }
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
                      {change.columnsAdded.length > 0 && (
                        <div>
                          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>
                            Columns Added
                          </p>
                          {change.columnsAdded.map((col) => (
                            <div
                              key={col.name}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.875rem",
                                color: "var(--cds-support-success)",
                              }}
                            >
                              <span>+ {col.name}</span>
                              <span style={{ color: "var(--cds-text-secondary)" }}>{col.type}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {change.columnsRemoved.length > 0 && (
                        <div>
                          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>
                            Columns Removed
                          </p>
                          {change.columnsRemoved.map((col) => (
                            <div
                              key={col.name}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.875rem",
                                color: "var(--cds-support-error)",
                              }}
                            >
                              <span>- {col.name}</span>
                              <span style={{ color: "var(--cds-text-secondary)" }}>{col.type}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {change.columnsTypeChanged.length > 0 && (
                        <div>
                          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>
                            Type Changes
                          </p>
                          {change.columnsTypeChanged.map((col) => (
                            <div
                              key={col.name}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>{col.name}</span>
                              <span style={{ color: "var(--cds-support-error)", textDecoration: "line-through" }}>
                                {col.leftType}
                              </span>
                              <span style={{ color: "var(--cds-text-secondary)" }}>&rarr;</span>
                              <span style={{ color: "var(--cds-support-success)" }}>
                                {col.rightType}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Unchanged tables (collapsed) */}
          {data.tablesUnchanged.length > 0 && (
            <Accordion>
              <AccordionItem
                title={
                  <span style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
                    {data.tablesUnchanged.length} unchanged tables
                  </span>
                }
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.5rem 0" }}>
                  {data.tablesUnchanged.map((table) => (
                    <Tag key={table} type="gray" size="sm">
                      {table}
                    </Tag>
                  ))}
                </div>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      )}
    </div>
  )
}
