import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
  FilterableMultiSelect,
  InlineLoading,
  Button,
} from "@carbon/react"
import { Renew } from "@carbon/react/icons"

interface TableSelectorProps {
  datasourceId: string
  schemas: string[]
  includedTables: Record<string, string[]>
  onTablesChange: (tables: Record<string, string[]>) => void
}

export function TableSelector({
  datasourceId,
  schemas,
  includedTables,
  onTablesChange,
}: TableSelectorProps) {
  const {
    data: allTables,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["datasource-tables", datasourceId],
    queryFn: () =>
      api.get<Record<string, string[]>>(
        `/api/datasources/${datasourceId}/tables`,
      ),
    enabled: !!datasourceId,
  })

  if (isLoading || isRefetching) {
    return <InlineLoading description="Fetching tables..." />
  }

  if (!allTables) {
    return null
  }

  const schemaList = schemas.filter((s) => s in allTables)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Included Tables
        </h3>
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Renew}
          iconDescription="Refresh tables"
          hasIconOnly
          onClick={() => refetch()}
        />
      </div>
      <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
        Select specific tables to snapshot. Leave empty to include all tables.
      </p>
      {schemaList.map((schema) => {
        const tables = allTables[schema] ?? []
        const items = tables.map((t) => ({ id: t, text: t }))
        const selectedIds = includedTables[schema] ?? []
        const initialSelectedItems = items.filter((item) =>
          selectedIds.includes(item.id),
        )

        return (
          <FilterableMultiSelect
            key={schema}
            id={`table-selector-${schema}`}
            titleText={`${schema} (${tables.length} tables)`}
            items={items}
            itemToString={(item: { id: string; text: string }) => item.text}
            initialSelectedItems={initialSelectedItems}
            placeholder={selectedIds.length === 0 ? "All tables" : `${selectedIds.length} selected`}
            onChange={({
              selectedItems,
            }: {
              selectedItems: { id: string; text: string }[]
            }) => {
              const newTables = { ...includedTables }
              const selected = selectedItems.map((item) => item.id)
              if (selected.length === 0) {
                delete newTables[schema]
              } else {
                newTables[schema] = selected
              }
              onTablesChange(newTables)
            }}
          />
        )
      })}
    </div>
  )
}
