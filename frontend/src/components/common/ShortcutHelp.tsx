import { useEffect, useState } from "react"
import { Modal } from "@carbon/react"

interface Shortcut {
  keys: string[]
  description: string
}

const shortcuts: Shortcut[] = [
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Ctrl", "Enter"], description: "Execute query" },
  { keys: ["Esc"], description: "Close dialog" },
]

function isMac(): boolean {
  return navigator.platform.toUpperCase().includes("MAC")
}

function formatKey(key: string): string {
  if (key === "Ctrl") return isMac() ? "\u2318" : "Ctrl"
  if (key === "Alt") return isMac() ? "\u2325" : "Alt"
  if (key === "Shift") return "\u21E7"
  if (key === "Enter") return "\u23CE"
  if (key === "Esc") return "Esc"
  return key
}

export function ShortcutHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable

      if (e.key === "?" && !isInput) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading="Keyboard Shortcuts"
      passiveModal
      size="sm"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.description}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem 0",
            }}
          >
            <span>{shortcut.description}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {shortcut.keys.map((key) => (
                <kbd
                  key={key}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "1.5rem",
                    height: "1.5rem",
                    padding: "0 0.375rem",
                    borderRadius: "0.25rem",
                    border: "1px solid var(--cds-border-subtle)",
                    backgroundColor: "var(--cds-layer-02)",
                    fontSize: "0.75rem",
                    fontFamily: "var(--cds-code-01-font-family, monospace)",
                  }}
                >
                  {formatKey(key)}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
