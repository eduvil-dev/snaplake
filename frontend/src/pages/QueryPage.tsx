import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useMutation, useQueries, useQuery } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { api } from "@/lib/api"
import { Button, SkeletonPlaceholder } from "@carbon/react"
import { Time, Play, TrashCan } from "@carbon/react/icons"
import { QueryEditor } from "@/components/query/QueryEditor"
import { QueryResult } from "@/components/query/QueryResult"
import { SnapshotContextBar } from "@/components/query/SnapshotContextBar"
import {
  type SnapshotContextState,
  type SnapshotResponse,
  formatSnapshotLabel,
} from "@/components/query/snapshot-context-utils"
import {
  addQueryHistory,
  getQueryHistory,
  clearQueryHistory,
  type QueryHistoryEntry,
} from "@/lib/query-history"

interface Column {
  name: string
  type: string
}

interface QueryResultData {
  columns: Column[]
  rows: unknown[][]
  totalRows: number
}

const PAGE_SIZE = 100

function buildInitialContext(snap: SnapshotResponse): SnapshotContextState {
  return {
    entries: [
      {
        datasourceId: snap.datasourceId,
        snapshotId: snap.id,
        snapshotLabel: formatSnapshotLabel(snap),
        datasourceName: snap.datasourceName,
        alias: "s1",
      },
    ],
  }
}

function buildInitialSql(snap: SnapshotResponse): string {
  const firstTable = snap.tables[0]
  return firstTable ? `SELECT * FROM ${firstTable.table}` : ""
}

export function QueryPage() {
  const { snapshotId: initialSnapshotId } = useSearch({
    from: "/authenticated/query",
  })
  const [sqlText, setSqlText] = useState("")
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<QueryResultData | null>(null)
  const [executionTime, setExecutionTime] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<QueryHistoryEntry[]>(getQueryHistory)
  const [context, setContext] = useState<SnapshotContextState>({
    entries: [],
  })
  const [initialized, setInitialized] = useState(false)

  // Fetch initial snapshot and auto-configure context
  const { data: initialSnapshot } = useQuery({
    queryKey: ["snapshot", initialSnapshotId],
    queryFn: () =>
      api.get<SnapshotResponse>(`/api/snapshots/${initialSnapshotId}`),
    enabled: !!initialSnapshotId && !initialized,
  })

  // Initialize context from fetched snapshot (runs once)
  if (initialSnapshot && !initialized) {
    setInitialized(true)
    setContext(buildInitialContext(initialSnapshot))
    setSqlText(buildInitialSql(initialSnapshot))
  }

  // Fetch schema for each selected snapshot (for autocomplete)
  const validEntries = useMemo(
    () => context.entries.filter((e) => e.snapshotId),
    [context.entries],
  )
  const schemaData = useQueries({
    queries: validEntries.map((entry) => ({
      queryKey: ["snapshotSchema", entry.snapshotId],
      queryFn: () =>
        api.get<{ tables: Record<string, { name: string }[]> }>(
          `/api/snapshots/${entry.snapshotId}/schema`,
        ),
      staleTime: Infinity,
    })),
    combine: (results) => results.map((r) => r.data),
  })

  const editorTables = useMemo(() => {
    const tables: Record<string, string[]> = {}
    for (let i = 0; i < validEntries.length; i++) {
      const data = schemaData[i]
      if (!data) continue
      const alias = validEntries[i].alias
      for (const [tableName, columns] of Object.entries(data.tables)) {
        const columnNames = columns.map((c) => c.name)
        tables[`${alias}.${tableName}`] = columnNames
        if (validEntries.length === 1) {
          tables[tableName] = columnNames
        }
      }
    }
    return Object.keys(tables).length > 0 ? tables : undefined
  }, [validEntries, schemaData])

  const sqlTextRef = useRef(sqlText)
  useEffect(() => {
    sqlTextRef.current = sqlText
  }, [sqlText])

  const executeMutation = useMutation({
    mutationFn: async (params: { sql: string; offset: number }) => {
      const validEntries = context.entries.filter((e) => e.snapshotId)
      const apiContext =
        validEntries.length > 0
          ? {
              snapshots: validEntries.map((e) => ({
                snapshotId: e.snapshotId,
                alias: e.alias,
              })),
            }
          : undefined

      const start = performance.now()
      const data = await api.post<QueryResultData>("/api/query", {
        sql: params.sql,
        limit: PAGE_SIZE,
        offset: params.offset,
        context: apiContext,
      })
      const duration = performance.now() - start
      return { data, duration }
    },
    onSuccess: ({ data, duration }) => {
      setResult(data)
      setExecutionTime(duration)
      setError(null)

      const entry: QueryHistoryEntry = {
        sql: sqlText,
        executedAt: new Date().toISOString(),
        rowCount: data.totalRows,
        durationMs: Math.round(duration),
      }
      addQueryHistory(entry)
      setHistory(getQueryHistory())
    },
    onError: (err: Error) => {
      setError(err.message)
      setResult(null)
    },
  })

  const handleExecute = useCallback(() => {
    const query = sqlTextRef.current
    if (!query.trim()) return
    setPage(0)
    executeMutation.mutate({ sql: query, offset: 0 })
  }, [executeMutation])

  const handleExecuteRef = useRef(handleExecute)
  useEffect(() => {
    handleExecuteRef.current = handleExecute
  }, [handleExecute])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if ((e.target as Element)?.closest(".cm-editor")) return
        e.preventDefault()
        handleExecuteRef.current()
      }
      if (e.key === "Escape") {
        setShowHistory(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    executeMutation.mutate({ sql: sqlText, offset: newPage * PAGE_SIZE })
  }

  function handleHistorySelect(entry: QueryHistoryEntry) {
    setSqlText(entry.sql)
    setShowHistory(false)
  }

  function handleClearHistory() {
    clearQueryHistory()
    setHistory([])
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 3rem)",
      margin: "-1.5rem",
    }}>
      {/* Context Bar */}
      <SnapshotContextBar context={context} onContextChange={setContext} />

      {/* Editor area */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "40%",
        borderBottom: "1px solid var(--cds-border-subtle)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--cds-border-subtle)",
          padding: "0.5rem 1rem",
        }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>SQL Query</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Time}
              onClick={() => setShowHistory(!showHistory)}
            >
              History
            </Button>
            <Button
              size="sm"
              renderIcon={Play}
              onClick={handleExecute}
              disabled={executeMutation.isPending || !sqlText.trim()}
            >
              {executeMutation.isPending ? "Executing..." : "Execute"}
            </Button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {showHistory ? (
            <div style={{ height: "100%", overflowY: "auto", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <h3 style={{ fontWeight: 500 }}>Query History</h3>
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={TrashCan}
                  onClick={handleClearHistory}
                >
                  Clear
                </Button>
              </div>
              {history.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
                  No queries yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {history.map((entry, i) => (
                    <button
                      key={i}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        textAlign: "left",
                        border: "1px solid var(--cds-border-subtle)",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => handleHistorySelect(entry)}
                    >
                      <code style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "0.875rem",
                        fontFamily: "var(--cds-code-01-font-family, monospace)",
                      }}>
                        {entry.sql}
                      </code>
                      <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                        {new Date(entry.executedAt).toLocaleString()} &middot;{" "}
                        {entry.rowCount} rows &middot; {entry.durationMs}ms
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <QueryEditor
              value={sqlText}
              onChange={setSqlText}
              onExecute={handleExecute}
              tables={editorTables}
            />
          )}
        </div>
      </div>

      {/* Results area */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "1.5rem" }}>
        {executeMutation.isPending ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <SkeletonPlaceholder style={{ height: "2rem", width: "100%" }} />
            <SkeletonPlaceholder style={{ height: "16rem", width: "100%" }} />
          </div>
        ) : error ? (
          <div style={{
            padding: "1rem",
            border: "1px solid var(--cds-support-error)",
            backgroundColor: "var(--cds-notification-error-background-color, rgba(218, 30, 40, 0.1))",
          }}>
            <p style={{ fontWeight: 500, color: "var(--cds-support-error)" }}>Query Error</p>
            <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--cds-support-error)", opacity: 0.8 }}>{error}</p>
          </div>
        ) : result ? (
          <QueryResult
            columns={result.columns}
            rows={result.rows}
            totalRows={result.totalRows}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            executionTime={executionTime}
          />
        ) : (
          <div style={{
            display: "flex",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--cds-text-secondary)",
          }}>
            <p>Execute a query to see results</p>
          </div>
        )}
      </div>
    </div>
  )
}
