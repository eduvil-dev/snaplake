import { useState, useMemo, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Search, Modal, TextInput } from "@carbon/react"
import {
  ChevronDown,
  ChevronRight,
  Db2Database,
  Folder,
  DataTable,
} from "@carbon/react/icons"

interface SnapshotResponse {
  id: string
  datasourceId: string
  datasourceName: string
  snapshotType: string
  snapshotDate: string
  startedAt: string
  status: string
  tables: { schema: string; table: string; rowCount: number; sizeBytes: number }[]
}

interface SidePanelProps {
  onSelectTable: (snapshotId: string, tableName: string) => void
  onSelectSnapshot?: (snapshotId: string) => void
  selectedSnapshotId?: string
  selectedTable?: string
}

interface TreeNode {
  type: "datasource" | "snapshotType" | "date" | "table"
  label: string
  children?: TreeNode[]
  snapshotId?: string
  tableName?: string
}

export function SidePanel({ onSelectTable, onSelectSnapshot, selectedSnapshotId, selectedTable }: SidePanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: snapshots } = useQuery({
    queryKey: ["snapshots"],
    queryFn: () => api.get<SnapshotResponse[]>("/api/snapshots"),
  })

  const tree = useMemo(() => {
    if (!snapshots) return []

    const completed = snapshots.filter((s) => s.status === "COMPLETED")
    const byDatasource = new Map<string, SnapshotResponse[]>()

    for (const snap of completed) {
      const list = byDatasource.get(snap.datasourceName) ?? []
      list.push(snap)
      byDatasource.set(snap.datasourceName, list)
    }

    const nodes: TreeNode[] = []

    for (const [dsName, snaps] of byDatasource) {
      const byType = new Map<string, SnapshotResponse[]>()
      for (const snap of snaps) {
        const list = byType.get(snap.snapshotType) ?? []
        list.push(snap)
        byType.set(snap.snapshotType, list)
      }

      const typeNodes: TreeNode[] = []
      for (const [type, typeSnaps] of byType) {
        const sorted = typeSnaps.sort(
          (a, b) => b.startedAt.localeCompare(a.startedAt),
        )

        const dateNodes: TreeNode[] = sorted.map((snap) => {
          const time = new Date(snap.startedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
          return {
            type: "date" as const,
            label: `${snap.snapshotDate} ${time}`,
            snapshotId: snap.id,
            children: snap.tables.map((t) => ({
              type: "table" as const,
              label: `${t.schema}.${t.table}`,
              snapshotId: snap.id,
              tableName: `${t.schema}.${t.table}`,
            })),
          }
        })

        typeNodes.push({
          type: "snapshotType",
          label: type.toLowerCase(),
          children: dateNodes,
        })
      }

      nodes.push({
        type: "datasource",
        label: dsName,
        children: typeNodes,
      })
    }

    return nodes
  }, [snapshots])

  const [prevExpansionKey, setPrevExpansionKey] = useState("")
  const expansionKey = `${selectedSnapshotId}-${selectedTable}-${tree.length}`
  if (expansionKey !== prevExpansionKey && selectedSnapshotId && tree.length > 0) {
    setPrevExpansionKey(expansionKey)

    const paths: string[] = []
    for (let di = 0; di < tree.length; di++) {
      const ds = tree[di]
      if (!ds.children) continue
      for (let ti = 0; ti < ds.children.length; ti++) {
        const typeNode = ds.children[ti]
        if (!typeNode.children) continue
        for (let si = 0; si < typeNode.children.length; si++) {
          const dateNode = typeNode.children[si]
          if (dateNode.snapshotId !== selectedSnapshotId) continue

          if (!selectedTable) {
            paths.push(String(di), `${di}/${ti}`, `${di}/${ti}/${si}`)
          } else {
            const hasTable = dateNode.children?.some(
              (t) => t.tableName === selectedTable,
            )
            if (hasTable) {
              paths.push(String(di), `${di}/${ti}`, `${di}/${ti}/${si}`)
            }
          }
        }
      }
    }

    if (paths.length > 0) {
      setExpandedNodes((prev) => {
        const next = new Set(prev)
        for (const p of paths) next.add(p)
        return next
      })
    }
  }

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      setSearchOpen(true)
    }
  }, [])

  useEffect(() => {
    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  }, [handleKeydown])

  function toggleNode(path: string) {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const allTables = useMemo(() => {
    const result: { snapshotId: string; tableName: string; label: string }[] = []
    if (!snapshots) return result

    for (const snap of snapshots) {
      if (snap.status !== "COMPLETED") continue
      for (const t of snap.tables) {
        const time = new Date(snap.startedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
        result.push({
          snapshotId: snap.id,
          tableName: `${t.schema}.${t.table}`,
          label: `${snap.datasourceName} / ${snap.snapshotType} / ${snap.snapshotDate} ${time} / ${t.schema}.${t.table}`,
        })
      }
    }
    return result
  }, [snapshots])

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery) return allTables
    const q = searchQuery.toLowerCase()
    return allTables.filter((item) => item.label.toLowerCase().includes(q))
  }, [allTables, searchQuery])

  function renderNode(node: TreeNode, path: string) {
    const isExpanded = expandedNodes.has(path)
    const hasChildren = node.children && node.children.length > 0

    const filterLower = filter.toLowerCase()
    const matchesFilter =
      !filter || node.label.toLowerCase().includes(filterLower)
    const childrenMatchFilter =
      !filter ||
      node.children?.some(
        (child) =>
          child.label.toLowerCase().includes(filterLower) ||
          child.children?.some((gc) =>
            gc.label.toLowerCase().includes(filterLower),
          ),
      )

    if (!matchesFilter && !childrenMatchFilter) return null

    const isSelected =
      node.type === "table" &&
      node.snapshotId === selectedSnapshotId &&
      node.tableName === selectedTable

    const icon =
      node.type === "datasource" ? (
        <Db2Database size={16} style={{ flexShrink: 0, color: "var(--cds-text-secondary)" }} />
      ) : node.type === "snapshotType" || node.type === "date" ? (
        <Folder size={16} style={{ flexShrink: 0, color: "var(--cds-text-secondary)" }} />
      ) : (
        <DataTable size={16} style={{ flexShrink: 0, color: "var(--cds-text-secondary)" }} />
      )

    return (
      <div key={path}>
        <button
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.5rem",
            fontSize: "0.875rem",
            border: "none",
            backgroundColor: isSelected ? "var(--cds-layer-selected)" : "transparent",
            fontWeight: isSelected ? 500 : "normal",
            cursor: node.type === "table" ? "pointer" : "default",
            textAlign: "left",
          }}
          onClick={() => {
            if (node.type === "table" && node.snapshotId && node.tableName) {
              onSelectTable(node.snapshotId, node.tableName)
            } else if (node.type === "date" && node.snapshotId && onSelectSnapshot) {
              onSelectSnapshot(node.snapshotId)
              toggleNode(path)
            } else if (hasChildren) {
              toggleNode(path)
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={12} style={{ flexShrink: 0 }} />
            ) : (
              <ChevronRight size={12} style={{ flexShrink: 0 }} />
            )
          ) : (
            <span style={{ width: "12px" }} />
          )}
          {icon}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.label}</span>
        </button>
        {isExpanded && node.children && (
          <div style={{ marginLeft: "1rem" }}>
            {node.children.map((child, i) =>
              renderNode(child, `${path}/${i}`),
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      borderRight: "1px solid var(--cds-border-subtle)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--cds-border-subtle)", padding: "0.75rem" }}>
        <Search
          size="sm"
          placeholder="Filter... (Cmd+K)"
          labelText="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target?.value ?? "")}
        />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
        {tree.length === 0 ? (
          <p style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
            No snapshots available
          </p>
        ) : (
          tree.map((node, i) => renderNode(node, String(i)))
        )}
      </div>

      {/* Cmd+K Search Dialog */}
      <Modal
        open={searchOpen}
        onRequestClose={() => {
          setSearchOpen(false)
          setSearchQuery("")
        }}
        modalHeading="Search Tables"
        passiveModal
        size="sm"
      >
        <div style={{ marginBottom: "1rem" }}>
          <TextInput
            id="table-search-input"
            labelText="Search"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ maxHeight: "20rem", overflowY: "auto" }}>
          {filteredSearchResults.length === 0 ? (
            <p style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
              No results found.
            </p>
          ) : (
            filteredSearchResults.map((item, i) => (
              <button
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.875rem",
                }}
                onClick={() => {
                  onSelectTable(item.snapshotId, item.tableName)
                  setSearchOpen(false)
                  setSearchQuery("")
                }}
              >
                <DataTable size={16} style={{ flexShrink: 0, color: "var(--cds-text-secondary)" }} />
                {item.label}
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
