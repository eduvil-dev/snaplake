interface CellDisplayProps {
  value: unknown
  className?: string
}

export function CellDisplay({ value, className }: CellDisplayProps) {
  if (value === null || value === undefined) {
    return (
      <span className={className} style={{ fontStyle: "italic", opacity: 0.5 }}>
        NULL
      </span>
    )
  }

  if (typeof value === "boolean") {
    return (
      <span className={className} style={{ fontFamily: "var(--cds-code-01-font-family, monospace)" }}>
        {value ? "true" : "false"}
      </span>
    )
  }

  if (typeof value === "number") {
    return (
      <span
        className={className}
        style={{
          fontFamily: "var(--cds-code-01-font-family, monospace)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value.toLocaleString()}
      </span>
    )
  }

  const str = String(value)
  const MAX_LENGTH = 200

  if (str.length > MAX_LENGTH) {
    return (
      <span className={className} title={str}>
        {str.slice(0, MAX_LENGTH)}...
      </span>
    )
  }

  return <span className={className}>{str}</span>
}
