import { useState } from "react"
import { DataTable, type Column } from "@/components/common/DataTable"
import { Modal } from "@carbon/react"
import { exportToCsv, exportToJson } from "@/lib/export"

interface QueryResultProps {
  columns: Column[]
  rows: unknown[][]
  totalRows: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  executionTime?: number
}

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

export function QueryResult({
  columns,
  rows,
  totalRows,
  page,
  pageSize,
  onPageChange,
  executionTime,
}: QueryResultProps) {
  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number
    colIndex: number
  } | null>(null)

  function handleExport(format: "csv" | "json") {
    const filename = `query_result_${Date.now()}`
    if (format === "csv") {
      exportToCsv(columns, rows, filename)
    } else {
      exportToJson(columns, rows, filename)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {executionTime !== undefined && (
        <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
          Executed in {executionTime.toFixed(0)}ms &middot;{" "}
          {totalRows.toLocaleString()} rows
        </p>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        totalRows={totalRows}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onExport={handleExport}
        onCellClick={(rowIndex, colIndex) =>
          setSelectedCell({ rowIndex, colIndex })
        }
      />

      <Modal
        open={selectedCell !== null}
        onRequestClose={() => setSelectedCell(null)}
        modalHeading={selectedCell !== null ? columns[selectedCell.colIndex].name : ""}
        modalLabel={selectedCell !== null ? columns[selectedCell.colIndex].type : ""}
        passiveModal
        size="sm"
      >
        {selectedCell !== null && (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <pre style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              fontFamily: "var(--cds-code-01-font-family, monospace)",
              fontSize: "0.875rem",
            }}>
              {formatCellValue(
                rows[selectedCell.rowIndex][selectedCell.colIndex],
              )}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  )
}
