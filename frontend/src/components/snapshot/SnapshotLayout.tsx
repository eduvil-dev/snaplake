import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { SidePanel } from "@/components/snapshot/SidePanel"

const STORAGE_KEY = "snaplake:sidepanel-width"
const MIN_WIDTH = 200
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 288

function getInitialWidth(): number {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed = Number(stored)
    if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) return parsed
  }
  return DEFAULT_WIDTH
}

interface SnapshotLayoutProps {
  children: ReactNode
  onSelectTable: (snapshotId: string, tableName: string) => void
  onSelectSnapshot?: (snapshotId: string) => void
  selectedSnapshotId?: string
  selectedTable?: string
}

export function SnapshotLayout({
  children,
  onSelectTable,
  onSelectSnapshot,
  selectedSnapshotId,
  selectedTable,
}: SnapshotLayoutProps) {
  const [width, setWidth] = useState(getInitialWidth)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startXRef.current = e.clientX
      startWidthRef.current = width
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [width],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const delta = e.clientX - startXRef.current
      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidthRef.current + delta),
      )
      setWidth(newWidth)
    },
    [isDragging],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width))
  }, [width])

  return (
    <div style={{
      display: "flex",
      height: "calc(100vh - 3rem)",
      margin: "-1.5rem",
    }}>
      <div style={{ position: "relative", flexShrink: 0, width }}>
        <SidePanel
          onSelectTable={onSelectTable}
          onSelectSnapshot={onSelectSnapshot}
          selectedSnapshotId={selectedSnapshotId}
          selectedTable={selectedTable}
        />
        <div
          style={{
            position: "absolute",
            inset: "0 -1px 0 auto",
            zIndex: 10,
            width: "4px",
            cursor: "col-resize",
            backgroundColor: isDragging ? "var(--cds-border-interactive)" : "transparent",
            transition: "background-color 150ms",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onMouseEnter={(e) => {
            if (!isDragging) (e.currentTarget.style.backgroundColor = "var(--cds-border-subtle)")
          }}
          onMouseLeave={(e) => {
            if (!isDragging) (e.currentTarget.style.backgroundColor = "transparent")
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "1.5rem" }}>
        {children}
      </div>
    </div>
  )
}
