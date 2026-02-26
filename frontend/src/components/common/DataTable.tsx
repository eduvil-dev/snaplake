import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Pagination,
} from "@carbon/react"
import { ArrowDown, ArrowUp, ArrowsVertical, Download } from "@carbon/react/icons"
import { CellDisplay } from "./CellDisplay"

export interface Column {
  name: string
  type: string
}

interface DataTableProps {
  columns: Column[]
  rows: unknown[][]
  totalRows: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  sortColumn?: string
  sortDirection?: "asc" | "desc"
  onSort?: (column: string) => void
  onExport?: (format: "csv" | "json") => void
  onRowClick?: (rowIndex: number) => void
  onCellClick?: (rowIndex: number, colIndex: number) => void
}

export function DataTable({
  columns,
  rows,
  totalRows,
  page,
  pageSize,
  onPageChange,
  sortColumn,
  sortDirection,
  onSort,
  onExport,
  onRowClick,
  onCellClick,
}: DataTableProps) {
  return (
    <div>
      {onExport && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1rem" }}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Download}
            onClick={() => onExport("csv")}
          >
            CSV
          </Button>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Download}
            onClick={() => onExport("json")}
          >
            JSON
          </Button>
        </div>
      )}

      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableHeader
                key={col.name}
                isSortable={!!onSort}
                isSortHeader={sortColumn === col.name}
                sortDirection={
                  sortColumn === col.name
                    ? sortDirection === "asc"
                      ? "ASC"
                      : "DESC"
                    : "NONE"
                }
                onClick={() => onSort?.(col.name)}
              >
                <span>{col.name}</span>
                {" "}
                <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{col.type}</span>
                {onSort && sortColumn !== col.name && (
                  <ArrowsVertical size={12} style={{ marginLeft: "0.25rem", opacity: 0.3 }} />
                )}
                {onSort && sortColumn === col.name && (
                  sortDirection === "asc"
                    ? <ArrowUp size={12} style={{ marginLeft: "0.25rem" }} />
                    : <ArrowDown size={12} style={{ marginLeft: "0.25rem" }} />
                )}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                style={{ textAlign: "center", padding: "2rem 0" }}
              >
                No data
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow
                key={i}
                style={onRowClick ? { cursor: "pointer" } : undefined}
                onClick={() => onRowClick?.(i)}
              >
                {row.map((cell, j) => (
                  <TableCell
                    key={j}
                    style={{ maxWidth: "20rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    onClick={
                      onCellClick
                        ? (e: React.MouseEvent) => {
                            e.stopPropagation()
                            onCellClick(i, j)
                          }
                        : undefined
                    }
                  >
                    <CellDisplay value={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination
        page={page + 1}
        totalItems={totalRows}
        pageSize={pageSize}
        pageSizes={[pageSize]}
        onChange={({ page: newPage }: { page: number }) => onPageChange(newPage - 1)}
      />
    </div>
  )
}
