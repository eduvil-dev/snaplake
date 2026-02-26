import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { DataTable, type Column } from "@/components/common/DataTable"
import { CellDisplay } from "@/components/common/CellDisplay"
import {
  TextInput,
  Button,
  SkeletonPlaceholder,
  Modal,
} from "@carbon/react"
import { Filter, Terminal } from "@carbon/react/icons"
import { exportToCsv, exportToJson } from "@/lib/export"
import { useNavigate } from "@tanstack/react-router"

interface QueryResult {
  columns: Column[]
  rows: unknown[][]
  totalRows: number
}

interface TablePreviewProps {
  snapshotId: string
  tableName: string
}

const PAGE_SIZE = 100

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL"
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export function TablePreview({ snapshotId, tableName }: TablePreviewProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [sortColumn, setSortColumn] = useState<string | undefined>()
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [whereClause, setWhereClause] = useState("")
  const [appliedWhere, setAppliedWhere] = useState("")
  const [orderByClause, setOrderByClause] = useState("")
  const [appliedOrderBy, setAppliedOrderBy] = useState("")
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number
    colIndex: number
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [
      "table-preview",
      snapshotId,
      tableName,
      page,
      appliedWhere,
      appliedOrderBy,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (appliedWhere) params.set("where", appliedWhere)
      if (appliedOrderBy) params.set("orderBy", appliedOrderBy)

      return api.get<QueryResult>(
        `/api/snapshots/${snapshotId}/tables/${tableName}/preview?${params}`,
      )
    },
  })

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        const newDir = sortDirection === "asc" ? "desc" : "asc"
        setSortDirection(newDir)
        setAppliedOrderBy(`${column} ${newDir}`)
      } else {
        setSortColumn(column)
        setSortDirection("asc")
        setAppliedOrderBy(`${column} asc`)
      }
      setPage(0)
    },
    [sortColumn, sortDirection],
  )

  function applyFilter() {
    setAppliedWhere(whereClause)
    setAppliedOrderBy(orderByClause)
    setPage(0)
  }

  function handleExport(format: "csv" | "json") {
    if (!data) return
    const filename = `${tableName}_${snapshotId}`
    if (format === "csv") {
      exportToCsv(data.columns, data.rows, filename)
    } else {
      exportToJson(data.columns, data.rows, filename)
    }
  }

  return (
    <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{tableName}</h2>
        <Button
          kind="tertiary"
          size="sm"
          renderIcon={Terminal}
          onClick={() => {
            navigate({
              to: "/query",
              search: { snapshotId },
            })
          }}
        >
          Open in Query
        </Button>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: "1rem",
        padding: "1rem",
        border: "1px solid var(--cds-border-subtle)",
      }}>
        <div style={{ flex: 1 }}>
          <TextInput
            id="where-clause"
            labelText="WHERE"
            size="sm"
            value={whereClause}
            onChange={(e) => setWhereClause(e.target.value)}
            placeholder="column = 'value' AND ..."
            style={{ fontFamily: "var(--cds-code-01-font-family, monospace)" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput
            id="orderby-clause"
            labelText="ORDER BY"
            size="sm"
            value={orderByClause}
            onChange={(e) => setOrderByClause(e.target.value)}
            placeholder="column ASC"
            style={{ fontFamily: "var(--cds-code-01-font-family, monospace)" }}
          />
        </div>
        <Button size="sm" renderIcon={Filter} onClick={applyFilter}>
          Apply
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <SkeletonPlaceholder style={{ height: "2rem", width: "100%" }} />
          <SkeletonPlaceholder style={{ height: "16rem", width: "100%" }} />
        </div>
      ) : data ? (
        <DataTable
          columns={data.columns}
          rows={data.rows}
          totalRows={data.totalRows}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onExport={handleExport}
          onRowClick={setSelectedRow}
          onCellClick={(rowIndex, colIndex) =>
            setSelectedCell({ rowIndex, colIndex })
          }
        />
      ) : null}

      {/* Row Detail Modal */}
      <Modal
        open={selectedRow !== null}
        onRequestClose={() => setSelectedRow(null)}
        modalHeading="Row Detail"
        modalLabel={`Row #${selectedRow !== null ? page * PAGE_SIZE + selectedRow + 1 : ""}`}
        passiveModal
        size="sm"
      >
        {selectedRow !== null && data && (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.columns.map((col, i) => (
                <div key={col.name} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--cds-text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }} title={col.name}>
                    {col.name}
                  </span>
                  <div style={{ minWidth: 0, wordBreak: "break-all", fontSize: "0.875rem" }}>
                    <CellDisplay value={data.rows[selectedRow][i]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Cell Detail Modal */}
      <Modal
        open={selectedCell !== null}
        onRequestClose={() => setSelectedCell(null)}
        modalHeading={selectedCell !== null && data ? data.columns[selectedCell.colIndex].name : ""}
        modalLabel={selectedCell !== null && data ? data.columns[selectedCell.colIndex].type : ""}
        passiveModal
        size="sm"
      >
        {selectedCell !== null && data && (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <pre style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              fontFamily: "var(--cds-code-01-font-family, monospace)",
              fontSize: "0.875rem",
            }}>
              {formatCellValue(data.rows[selectedCell.rowIndex][selectedCell.colIndex])}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  )
}
