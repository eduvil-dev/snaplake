import { useState } from "react"
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@carbon/react"
import { CompareSelector } from "@/components/compare/CompareSelector"
import { CompareStats } from "@/components/compare/CompareStats"
import { CompareDiffView } from "@/components/compare/CompareDiffView"
import { Compare } from "@carbon/react/icons"

export function ComparePage() {
  const [datasourceId, setDatasourceId] = useState<string | null>(null)
  const [leftSnapshotId, setLeftSnapshotId] = useState<string | null>(null)
  const [rightSnapshotId, setRightSnapshotId] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string | null>(null)

  const isReady = leftSnapshotId && rightSnapshotId && tableName

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
          Compare Snapshots
        </h1>
        <p style={{ color: "var(--cds-text-secondary)" }}>
          Select two snapshots of the same table to compare differences
        </p>
      </div>

      <CompareSelector
        datasourceId={datasourceId}
        onDatasourceChange={(id) => {
          setDatasourceId(id)
          setLeftSnapshotId(null)
          setRightSnapshotId(null)
          setTableName(null)
        }}
        leftSnapshotId={leftSnapshotId}
        onLeftChange={(id) => {
          setLeftSnapshotId(id)
          setTableName(null)
        }}
        rightSnapshotId={rightSnapshotId}
        onRightChange={(id) => {
          setRightSnapshotId(id)
          setTableName(null)
        }}
        tableName={tableName}
        onTableChange={setTableName}
      />

      {isReady ? (
        <Tabs>
          <TabList aria-label="Compare tabs">
            <Tab>Stats</Tab>
            <Tab>Diff</Tab>
          </TabList>
          <TabPanels>
            <TabPanel style={{ padding: "1rem 0" }}>
              <CompareStats
                leftSnapshotId={leftSnapshotId}
                rightSnapshotId={rightSnapshotId}
                tableName={tableName}
              />
            </TabPanel>
            <TabPanel style={{ padding: "1rem 0" }}>
              <CompareDiffView
                leftSnapshotId={leftSnapshotId}
                rightSnapshotId={rightSnapshotId}
                tableName={tableName}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      ) : (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "4rem 0",
          color: "var(--cds-text-secondary)",
        }}>
          <Compare size={48} style={{ marginBottom: "1rem" }} />
          <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>Select snapshots to compare</p>
          <p style={{ fontSize: "0.875rem" }}>
            Choose a datasource, two snapshots, and a table above
          </p>
        </div>
      )}
    </div>
  )
}
