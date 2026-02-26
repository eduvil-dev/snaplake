import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
  SkeletonPlaceholder,
  Tile,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@carbon/react"

interface ColumnStat {
  column: string
  leftDistinctCount: number
  rightDistinctCount: number
  leftNullCount: number
  rightNullCount: number
}

interface StatsResult {
  leftRowCount: number
  rightRowCount: number
  columnStats: ColumnStat[]
}

interface CompareStatsProps {
  leftSnapshotId: string
  rightSnapshotId: string
  tableName: string
}

export function CompareStats({
  leftSnapshotId,
  rightSnapshotId,
  tableName,
}: CompareStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["compare-stats", leftSnapshotId, rightSnapshotId, tableName],
    queryFn: () =>
      api.post<StatsResult>("/api/compare/stats", {
        leftSnapshotId,
        rightSnapshotId,
        tableName,
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

  if (!data) return null

  const rowDiff = data.rightRowCount - data.leftRowCount

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Row count summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <Tile style={{ textAlign: "center", padding: "1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>Left</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {data.leftRowCount.toLocaleString()}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>rows</p>
        </Tile>
        <Tile style={{ textAlign: "center", padding: "1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>Right</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {data.rightRowCount.toLocaleString()}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>rows</p>
        </Tile>
        <Tile style={{ textAlign: "center", padding: "1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>Difference</p>
          <p style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: rowDiff > 0
              ? "var(--cds-support-success)"
              : rowDiff < 0
                ? "var(--cds-support-error)"
                : undefined,
          }}>
            {rowDiff > 0 ? "+" : ""}
            {rowDiff.toLocaleString()}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>rows</p>
        </Tile>
      </div>

      {/* Column stats */}
      <div style={{ overflow: "auto", border: "1px solid var(--cds-border-subtle)" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Column</TableHeader>
              <TableHeader style={{ textAlign: "right" }}>Left Distinct</TableHeader>
              <TableHeader style={{ textAlign: "right" }}>Right Distinct</TableHeader>
              <TableHeader style={{ textAlign: "right" }}>Left Nulls</TableHeader>
              <TableHeader style={{ textAlign: "right" }}>Right Nulls</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.columnStats.map((stat) => (
              <TableRow key={stat.column}>
                <TableCell style={{ fontWeight: 500 }}>{stat.column}</TableCell>
                <TableCell style={{ textAlign: "right", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
                  {stat.leftDistinctCount.toLocaleString()}
                </TableCell>
                <TableCell style={{
                  textAlign: "right",
                  fontFamily: "monospace",
                  fontVariantNumeric: "tabular-nums",
                  ...(stat.rightDistinctCount !== stat.leftDistinctCount
                    ? { fontWeight: 700, color: "var(--cds-support-warning)" }
                    : {}),
                }}>
                  {stat.rightDistinctCount.toLocaleString()}
                </TableCell>
                <TableCell style={{ textAlign: "right", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
                  {stat.leftNullCount.toLocaleString()}
                </TableCell>
                <TableCell style={{
                  textAlign: "right",
                  fontFamily: "monospace",
                  fontVariantNumeric: "tabular-nums",
                  ...(stat.rightNullCount !== stat.leftNullCount
                    ? { fontWeight: 700, color: "var(--cds-support-warning)" }
                    : {}),
                }}>
                  {stat.rightNullCount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
