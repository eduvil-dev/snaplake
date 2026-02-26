import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
  Button,
  Modal,
  SkeletonPlaceholder,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@carbon/react"
import { WarningAlt, Row, Column, Information } from "@carbon/react/icons"
import { CellDisplay } from "@/components/common/CellDisplay"

interface DiffColumn {
  name: string
  type: string
}

interface DiffSummary {
  added: number
  removed: number
  changed: number
}

type DiffRow =
  | { diffType: "ADDED"; values: unknown[] }
  | { diffType: "REMOVED"; values: unknown[] }
  | {
      diffType: "CHANGED"
      left: unknown[]
      right: unknown[]
      changedColumns: number[]
    }

interface UnifiedDiffResponse {
  columns: DiffColumn[]
  primaryKeys: string[]
  rows: DiffRow[]
  totalRows: number
  summary: DiffSummary
}

interface CompareDiffViewProps {
  leftSnapshotId: string
  rightSnapshotId: string
  tableName: string
}

type SelectedCellInfo = {
  columnName: string
  columnType: string
} & (
  | { diffType: "ADDED"; value: unknown }
  | { diffType: "REMOVED"; value: unknown }
  | { diffType: "CHANGED"; leftValue: unknown; rightValue: unknown; isChanged: boolean }
)

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL"
  if (typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}

const PAGE_SIZE = 100

export function CompareDiffView({
  leftSnapshotId,
  rightSnapshotId,
  tableName,
}: CompareDiffViewProps) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified")
  const [selectedCell, setSelectedCell] = useState<SelectedCellInfo | null>(null)
  const [page, setPage] = useState(0)
  const [prevKey, setPrevKey] = useState(
    `${leftSnapshotId}-${rightSnapshotId}-${tableName}`,
  )

  const currentKey = `${leftSnapshotId}-${rightSnapshotId}-${tableName}`
  if (currentKey !== prevKey) {
    setPrevKey(currentKey)
    setPage(0)
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "compare-unified-diff",
      leftSnapshotId,
      rightSnapshotId,
      tableName,
      page,
    ],
    queryFn: () =>
      api.post<UnifiedDiffResponse>("/api/compare/unified-diff", {
        leftSnapshotId,
        rightSnapshotId,
        tableName,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  })

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <SkeletonPlaceholder style={{ height: "2rem", width: "100%" }} />
        <SkeletonPlaceholder style={{ height: "12rem", width: "100%" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        padding: "3rem 0",
        color: "var(--cds-support-error)",
      }}>
        <WarningAlt size={32} />
        <p style={{ fontSize: "0.875rem" }}>Failed to load diff data</p>
      </div>
    )
  }

  if (!data) return null

  const totalPages = Math.max(1, Math.ceil(data.totalRows / PAGE_SIZE))
  const startRow = page * PAGE_SIZE + 1
  const endRow = Math.min((page + 1) * PAGE_SIZE, data.totalRows)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <span style={{ fontWeight: 500, color: "var(--cds-support-success)" }}>
              +{data.summary.added}
            </span>
            <span style={{ fontWeight: 500, color: "var(--cds-support-error)" }}>
              -{data.summary.removed}
            </span>
            {data.summary.changed > 0 && (
              <span style={{ fontWeight: 500, color: "var(--cds-support-warning)" }}>
                ~{data.summary.changed}
              </span>
            )}
          </div>
          {data.primaryKeys.length === 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.75rem",
              color: "var(--cds-text-secondary)",
            }}>
              <Information size={12} />
              <span>No PK — changed rows cannot be detected</span>
            </div>
          )}
        </div>
        <div style={{
          display: "flex",
          gap: "0.25rem",
          border: "1px solid var(--cds-border-subtle)",
          padding: "0.125rem",
        }}>
          <Button
            kind={viewMode === "unified" ? "secondary" : "ghost"}
            size="sm"
            renderIcon={Row}
            onClick={() => setViewMode("unified")}
          >
            Unified
          </Button>
          <Button
            kind={viewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            renderIcon={Column}
            onClick={() => setViewMode("split")}
          >
            Split
          </Button>
        </div>
      </div>

      {/* Diff Table */}
      {data.rows.length === 0 ? (
        <div style={{
          padding: "3rem 0",
          textAlign: "center",
          color: "var(--cds-text-secondary)",
        }}>
          No differences found
        </div>
      ) : viewMode === "unified" ? (
        <UnifiedView columns={data.columns} rows={data.rows} onCellClick={setSelectedCell} />
      ) : (
        <SplitView columns={data.columns} rows={data.rows} onCellClick={setSelectedCell} />
      )}

      {/* Cell Detail Modal */}
      <CellDetailModal
        cell={selectedCell}
        onClose={() => setSelectedCell(null)}
      />

      {/* Pagination */}
      {data.totalRows > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
            Showing {startRow}-{endRow} of {data.totalRows.toLocaleString()}{" "}
            changes
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              kind="tertiary"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              kind="tertiary"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function UnifiedView({
  columns,
  rows,
  onCellClick,
}: {
  columns: DiffColumn[]
  rows: DiffRow[]
  onCellClick: (info: SelectedCellInfo) => void
}) {
  return (
    <div style={{ overflow: "auto", border: "1px solid var(--cds-border-subtle)" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader style={{ width: "2rem" }} />
            {columns.map((col) => (
              <TableHeader key={col.name}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span>{col.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                    {col.type}
                  </span>
                </div>
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.flatMap((row, i) => {
            if (row.diffType === "ADDED") {
              return [
                <TableRow key={i} style={{
                  borderLeft: "4px solid var(--cds-support-success)",
                  backgroundColor: "rgba(36, 161, 72, 0.1)",
                }}>
                  <TableCell style={{
                    width: "2rem",
                    textAlign: "center",
                    fontFamily: "monospace",
                    color: "var(--cds-support-success)",
                  }}>
                    +
                  </TableCell>
                  {row.values.map((cell, j) => (
                    <TableCell
                      key={j}
                      style={{ maxWidth: "20rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                      onClick={() => onCellClick({ columnName: columns[j].name, columnType: columns[j].type, diffType: "ADDED", value: cell })}
                    >
                      <CellDisplay value={cell} />
                    </TableCell>
                  ))}
                </TableRow>,
              ]
            }
            if (row.diffType === "REMOVED") {
              return [
                <TableRow key={i} style={{
                  borderLeft: "4px solid var(--cds-support-error)",
                  backgroundColor: "rgba(218, 30, 40, 0.1)",
                }}>
                  <TableCell style={{
                    width: "2rem",
                    textAlign: "center",
                    fontFamily: "monospace",
                    color: "var(--cds-support-error)",
                  }}>
                    -
                  </TableCell>
                  {row.values.map((cell, j) => (
                    <TableCell
                      key={j}
                      style={{ maxWidth: "20rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                      onClick={() => onCellClick({ columnName: columns[j].name, columnType: columns[j].type, diffType: "REMOVED", value: cell })}
                    >
                      <CellDisplay value={cell} />
                    </TableCell>
                  ))}
                </TableRow>,
              ]
            }
            // CHANGED: two rows
            const changedSet = new Set(row.changedColumns)
            const changedCellClick = (j: number) =>
              onCellClick({
                columnName: columns[j].name,
                columnType: columns[j].type,
                diffType: "CHANGED",
                leftValue: row.left[j],
                rightValue: row.right[j],
                isChanged: changedSet.has(j),
              })
            return [
              <TableRow key={`${i}-left`} style={{
                borderLeft: "4px solid var(--cds-support-error)",
                backgroundColor: "rgba(218, 30, 40, 0.1)",
              }}>
                <TableCell style={{
                  width: "2rem",
                  textAlign: "center",
                  fontFamily: "monospace",
                  color: "var(--cds-support-error)",
                }}>
                  -
                </TableCell>
                {row.left.map((cell, j) => (
                  <TableCell
                    key={j}
                    style={{
                      maxWidth: "20rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      ...(changedSet.has(j) ? { backgroundColor: "rgba(218, 30, 40, 0.2)", fontWeight: 500 } : {}),
                    }}
                    onClick={() => changedCellClick(j)}
                  >
                    <CellDisplay value={cell} />
                  </TableCell>
                ))}
              </TableRow>,
              <TableRow key={`${i}-right`} style={{
                borderLeft: "4px solid var(--cds-support-success)",
                backgroundColor: "rgba(36, 161, 72, 0.1)",
              }}>
                <TableCell style={{
                  width: "2rem",
                  textAlign: "center",
                  fontFamily: "monospace",
                  color: "var(--cds-support-success)",
                }}>
                  +
                </TableCell>
                {row.right.map((cell, j) => (
                  <TableCell
                    key={j}
                    style={{
                      maxWidth: "20rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      ...(changedSet.has(j) ? { backgroundColor: "rgba(36, 161, 72, 0.2)", fontWeight: 500 } : {}),
                    }}
                    onClick={() => changedCellClick(j)}
                  >
                    <CellDisplay value={cell} />
                  </TableCell>
                ))}
              </TableRow>,
            ]
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SplitView({
  columns,
  rows,
  onCellClick,
}: {
  columns: DiffColumn[]
  rows: DiffRow[]
  onCellClick: (info: SelectedCellInfo) => void
}) {
  const leftRows: { values: unknown[]; type: "removed" | "changed"; changedCols?: Set<number>; sourceRow: DiffRow }[] = []
  const rightRows: { values: unknown[]; type: "added" | "changed"; changedCols?: Set<number>; sourceRow: DiffRow }[] = []

  for (const row of rows) {
    if (row.diffType === "ADDED") {
      leftRows.push({ values: columns.map(() => null), type: "removed", sourceRow: row })
      rightRows.push({ values: row.values, type: "added", sourceRow: row })
    } else if (row.diffType === "REMOVED") {
      leftRows.push({ values: row.values, type: "removed", sourceRow: row })
      rightRows.push({ values: columns.map(() => null), type: "added", sourceRow: row })
    } else {
      const changedCols = new Set(row.changedColumns)
      leftRows.push({ values: row.left, type: "changed", changedCols, sourceRow: row })
      rightRows.push({ values: row.right, type: "changed", changedCols, sourceRow: row })
    }
  }

  const handleCellClick = (sourceRow: DiffRow, colIndex: number) => {
    const col = columns[colIndex]
    if (sourceRow.diffType === "ADDED") {
      onCellClick({ columnName: col.name, columnType: col.type, diffType: "ADDED", value: sourceRow.values[colIndex] })
    } else if (sourceRow.diffType === "REMOVED") {
      onCellClick({ columnName: col.name, columnType: col.type, diffType: "REMOVED", value: sourceRow.values[colIndex] })
    } else {
      onCellClick({
        columnName: col.name,
        columnType: col.type,
        diffType: "CHANGED",
        leftValue: sourceRow.left[colIndex],
        rightValue: sourceRow.right[colIndex],
        isChanged: sourceRow.changedColumns.includes(colIndex),
      })
    }
  }

  const header = (
    <TableRow>
      {columns.map((col) => (
        <TableHeader key={col.name}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span>{col.name}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>{col.type}</span>
          </div>
        </TableHeader>
      ))}
    </TableRow>
  )

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      {/* Left (old) */}
      <div style={{ overflow: "auto", border: "1px solid var(--cds-border-subtle)" }}>
        <Table>
          <TableHead>{header}</TableHead>
          <TableBody>
            {leftRows.map((row, i) => {
              const isBlank = row.type === "removed" && row.values.every((v) => v === null)
              const isChanged = row.type === "changed"
              return (
                <TableRow
                  key={i}
                  style={{
                    ...(isBlank ? { backgroundColor: "var(--cds-layer-02)" } : {}),
                    ...(!isBlank && !isChanged ? {
                      borderLeft: "4px solid var(--cds-support-error)",
                      backgroundColor: "rgba(218, 30, 40, 0.1)",
                    } : {}),
                    ...(isChanged ? {
                      borderLeft: "4px solid var(--cds-support-warning)",
                      backgroundColor: "rgba(218, 30, 40, 0.1)",
                    } : {}),
                  }}
                >
                  {row.values.map((cell, j) => (
                    <TableCell
                      key={j}
                      style={{
                        maxWidth: "20rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        ...(!isBlank ? { cursor: "pointer" } : {}),
                        ...(isChanged && row.changedCols?.has(j) ? { backgroundColor: "rgba(218, 30, 40, 0.2)", fontWeight: 500 } : {}),
                      }}
                      onClick={!isBlank ? () => handleCellClick(row.sourceRow, j) : undefined}
                    >
                      {!isBlank && <CellDisplay value={cell} />}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Right (new) */}
      <div style={{ overflow: "auto", border: "1px solid var(--cds-border-subtle)" }}>
        <Table>
          <TableHead>{header}</TableHead>
          <TableBody>
            {rightRows.map((row, i) => {
              const isBlank = row.type === "added" && row.values.every((v) => v === null)
              const isChanged = row.type === "changed"
              return (
                <TableRow
                  key={i}
                  style={{
                    ...(isBlank ? { backgroundColor: "var(--cds-layer-02)" } : {}),
                    ...(!isBlank && !isChanged ? {
                      borderLeft: "4px solid var(--cds-support-success)",
                      backgroundColor: "rgba(36, 161, 72, 0.1)",
                    } : {}),
                    ...(isChanged ? {
                      borderLeft: "4px solid var(--cds-support-warning)",
                      backgroundColor: "rgba(36, 161, 72, 0.1)",
                    } : {}),
                  }}
                >
                  {row.values.map((cell, j) => (
                    <TableCell
                      key={j}
                      style={{
                        maxWidth: "20rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        ...(!isBlank ? { cursor: "pointer" } : {}),
                        ...(isChanged && row.changedCols?.has(j) ? { backgroundColor: "rgba(36, 161, 72, 0.2)", fontWeight: 500 } : {}),
                      }}
                      onClick={!isBlank ? () => handleCellClick(row.sourceRow, j) : undefined}
                    >
                      {!isBlank && <CellDisplay value={cell} />}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function CellDetailModal({
  cell,
  onClose,
}: {
  cell: SelectedCellInfo | null
  onClose: () => void
}) {
  const diffLabel =
    cell?.diffType === "ADDED" ? "Added" :
    cell?.diffType === "REMOVED" ? "Removed" :
    "Changed"

  return (
    <Modal
      open={cell !== null}
      onRequestClose={onClose}
      modalHeading={cell?.columnName ?? ""}
      modalLabel={`${cell?.columnType ?? ""} · ${diffLabel}`}
      passiveModal
      size="md"
    >
      {cell && (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {cell.diffType === "CHANGED" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--cds-support-error)",
                }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "1.25rem",
                    height: "1.25rem",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    borderRadius: "2px",
                    backgroundColor: "rgba(218, 30, 40, 0.1)",
                  }}>-</span>
                  Old
                </div>
                <pre style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontFamily: "var(--cds-code-01-font-family, monospace)",
                  fontSize: "0.875rem",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  backgroundColor: "rgba(218, 30, 40, 0.05)",
                  border: "1px solid rgba(218, 30, 40, 0.2)",
                  margin: 0,
                }}>
                  {formatCellValue(cell.leftValue)}
                </pre>
              </div>
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--cds-support-success)",
                }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "1.25rem",
                    height: "1.25rem",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    borderRadius: "2px",
                    backgroundColor: "rgba(36, 161, 72, 0.1)",
                  }}>+</span>
                  New
                </div>
                <pre style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontFamily: "var(--cds-code-01-font-family, monospace)",
                  fontSize: "0.875rem",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  backgroundColor: "rgba(36, 161, 72, 0.05)",
                  border: "1px solid rgba(36, 161, 72, 0.2)",
                  margin: 0,
                }}>
                  {formatCellValue(cell.rightValue)}
                </pre>
              </div>
            </div>
          ) : (
            <pre style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              fontFamily: "var(--cds-code-01-font-family, monospace)",
              fontSize: "0.875rem",
              padding: "0.75rem",
              borderRadius: "4px",
              backgroundColor: cell.diffType === "ADDED"
                ? "rgba(36, 161, 72, 0.05)"
                : "rgba(218, 30, 40, 0.05)",
              border: `1px solid ${
                cell.diffType === "ADDED"
                  ? "rgba(36, 161, 72, 0.2)"
                  : "rgba(218, 30, 40, 0.2)"
              }`,
              margin: 0,
            }}>
              {formatCellValue(cell.value)}
            </pre>
          )}
        </div>
      )}
    </Modal>
  )
}
