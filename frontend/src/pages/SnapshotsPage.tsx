import { useNavigate } from "@tanstack/react-router"
import { SnapshotLayout } from "@/components/snapshot/SnapshotLayout"
import { Layers } from "@carbon/react/icons"

export function SnapshotsPage() {
  const navigate = useNavigate()

  function handleSelectSnapshot(snapshotId: string) {
    navigate({
      to: "/snapshots/$snapshotId",
      params: { snapshotId },
    })
  }

  function handleSelectTable(snapshotId: string, tableName: string) {
    const dotIndex = tableName.indexOf(".")
    const schema = tableName.substring(0, dotIndex)
    const table = tableName.substring(dotIndex + 1)
    navigate({
      to: "/snapshots/$snapshotId/$schema/$table",
      params: { snapshotId, schema, table },
    })
  }

  return (
    <SnapshotLayout onSelectTable={handleSelectTable} onSelectSnapshot={handleSelectSnapshot}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--cds-text-secondary)",
      }}>
        <Layers size={48} style={{ marginBottom: "1rem" }} />
        <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>Select a table</p>
        <p style={{ fontSize: "0.875rem" }}>
          Browse the tree on the left or press Cmd+K to search
        </p>
      </div>
    </SnapshotLayout>
  )
}
