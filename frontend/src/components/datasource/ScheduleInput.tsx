import { useState, useEffect } from "react"
import {
  TextInput,
  NumberInput,
  Select,
  SelectItem,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
} from "@carbon/react"
import cronstrue from "cronstrue"

interface ScheduleInputProps {
  value: string | null
  onChange: (value: string | null) => void
}

type SimpleMode = "none" | "daily" | "weekly" | "monthly"

function cronToSimple(cron: string | null): {
  mode: SimpleMode
  hour: string
  minute: string
  dayOfWeek: string
  dayOfMonth: string
} {
  const defaults = {
    mode: "none" as SimpleMode,
    hour: "2",
    minute: "0",
    dayOfWeek: "1",
    dayOfMonth: "1",
  }

  if (!cron) return defaults

  const parts = cron.split(" ")
  if (parts.length !== 5) return { ...defaults, mode: "none" }

  const [min, hr, dom, , dow] = parts

  if (dom === "*" && dow === "*") {
    return { mode: "daily", hour: hr, minute: min, dayOfWeek: "1", dayOfMonth: "1" }
  }
  if (dom === "*" && dow !== "*") {
    return { mode: "weekly", hour: hr, minute: min, dayOfWeek: dow, dayOfMonth: "1" }
  }
  if (dom !== "*" && dow === "*") {
    return { mode: "monthly", hour: hr, minute: min, dayOfWeek: "1", dayOfMonth: dom }
  }

  return defaults
}

function simpleToCron(
  mode: SimpleMode,
  hour: string,
  minute: string,
  dayOfWeek: string,
  dayOfMonth: string,
): string | null {
  if (mode === "none") return null
  if (mode === "daily") return `${minute} ${hour} * * *`
  if (mode === "weekly") return `${minute} ${hour} * * ${dayOfWeek}`
  if (mode === "monthly") return `${minute} ${hour} ${dayOfMonth} * *`
  return null
}

function getCronDescription(cron: string): string {
  try {
    return cronstrue.toString(cron)
  } catch {
    return "Invalid cron expression"
  }
}

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
]

export function ScheduleInput({ value, onChange }: ScheduleInputProps) {
  const initial = cronToSimple(value)
  const [tabIndex, setTabIndex] = useState(0)
  const [simpleMode, setSimpleMode] = useState<SimpleMode>(initial.mode)
  const [hour, setHour] = useState(initial.hour)
  const [minute, setMinute] = useState(initial.minute)
  const [dayOfWeek, setDayOfWeek] = useState(initial.dayOfWeek)
  const [dayOfMonth, setDayOfMonth] = useState(initial.dayOfMonth)
  const [advancedCron, setAdvancedCron] = useState(value ?? "")

  useEffect(() => {
    if (tabIndex === 0) {
      onChange(simpleToCron(simpleMode, hour, minute, dayOfWeek, dayOfMonth))
    }
  }, [simpleMode, hour, minute, dayOfWeek, dayOfMonth, tabIndex, onChange])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Schedule</h3>
      <Tabs selectedIndex={tabIndex} onChange={({ selectedIndex }) => setTabIndex(selectedIndex)}>
        <TabList aria-label="Schedule mode">
          <Tab>Simple</Tab>
          <Tab>Advanced (Cron)</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "1rem" }}>
              <Select
                id="schedule-mode"
                labelText="Frequency"
                value={simpleMode}
                onChange={(e) => setSimpleMode(e.target.value as SimpleMode)}
              >
                <SelectItem value="none" text="No schedule (manual only)" />
                <SelectItem value="daily" text="Daily" />
                <SelectItem value="weekly" text="Weekly" />
                <SelectItem value="monthly" text="Monthly" />
              </Select>

              {simpleMode !== "none" && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem" }}>
                  {simpleMode === "weekly" && (
                    <Select
                      id="schedule-dow"
                      labelText="Day"
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value} text={day.label} />
                      ))}
                    </Select>
                  )}
                  {simpleMode === "monthly" && (
                    <NumberInput
                      id="schedule-dom"
                      label="Day of Month"
                      min={1}
                      max={28}
                      value={Number(dayOfMonth)}
                      onChange={(_e: unknown, { value }: { value: number | string }) =>
                        setDayOfMonth(String(value))
                      }
                    />
                  )}
                  <NumberInput
                    id="schedule-hour"
                    label="Hour"
                    min={0}
                    max={23}
                    value={Number(hour)}
                    onChange={(_e: unknown, { value }: { value: number | string }) =>
                      setHour(String(value))
                    }
                  />
                  <NumberInput
                    id="schedule-minute"
                    label="Minute"
                    min={0}
                    max={59}
                    value={Number(minute)}
                    onChange={(_e: unknown, { value }: { value: number | string }) =>
                      setMinute(String(value))
                    }
                  />
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "1rem" }}>
              <TextInput
                id="cron-input"
                labelText="Cron Expression"
                value={advancedCron}
                onChange={(e) => setAdvancedCron(e.target.value)}
                placeholder="0 2 * * *"
                style={{ fontFamily: "var(--cds-code-01-font-family, monospace)" }}
              />
              {advancedCron && (
                <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
                  {getCronDescription(advancedCron)}
                </p>
              )}
              <div>
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={() => onChange(advancedCron || null)}
                >
                  Apply
                </Button>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {value && (
        <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
          Current: <code style={{
            padding: "0.125rem 0.25rem",
            borderRadius: "0.25rem",
            backgroundColor: "var(--cds-layer-02)",
          }}>{value}</code>
          {" "}&mdash; {getCronDescription(value)}
        </p>
      )}
    </div>
  )
}
