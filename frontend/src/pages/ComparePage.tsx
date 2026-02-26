import { useState } from "react"
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@carbon/react"
import { CompareSelector } from "@/components/compare/CompareSelector"
import { CompareStats } from "@/components/compare/CompareStats"
import { CompareDiffView } from "@/components/compare/CompareDiffView"
import { CompareSchemaView } from "@/components/compare/CompareSchemaView"
import { Compare } from "@carbon/react/icons"

export function ComparePage() {
  const [datasourceId, setDatasourceId] = useState<string | null>(null)
  const [leftSnapshotId, setLeftSnapshotId] = useState<string | null>(null)
  const [rightSnapshotId, setRightSnapshotId] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string | null>(null)

  const isTableReady = leftSnapshotId && rightSnapshotId && tableName
  const isSchemaReady = leftSnapshotId && rightSnapshotId

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

      {isSchemaReady ? (
        <Tabs>
          <TabList aria-label="Compare tabs">
            <Tab disabled={!isTableReady}>Stats</Tab>
            <Tab disabled={!isTableReady}>Diff</Tab>
            <Tab>Schema</Tab>
          </TabList>
          <TabPanels>
            <TabPanel style={{ padding: "1rem 0" }}>
              {isTableReady ? (
                <CompareStats
                  leftSnapshotId={leftSnapshotId}
                  rightSnapshotId={rightSnapshotId}
                  tableName={tableName}
                />
              ) : (
                <p style={{ padding: "2rem 0", textAlign: "center", color: "var(--cds-text-secondary)" }}>
                  Select a table to view stats comparison.
                </p>
              )}
            </TabPanel>
            <TabPanel style={{ padding: "1rem 0" }}>
              {isTableReady ? (
                <CompareDiffView
                  leftSnapshotId={leftSnapshotId}
                  rightSnapshotId={rightSnapshotId}
                  tableName={tableName}
                />
              ) : (
                <p style={{ padding: "2rem 0", textAlign: "center", color: "var(--cds-text-secondary)" }}>
                  Select a table to view row diff.
                </p>
              )}
            </TabPanel>
            <TabPanel style={{ padding: "1rem 0" }}>
              <CompareSchemaView
                leftSnapshotId={leftSnapshotId}
                rightSnapshotId={rightSnapshotId}
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
            Choose a datasource and two snapshots above
          </p>
        </div>
      )}
    </div>
  )
}
