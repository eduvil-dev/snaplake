import { Button, InlineLoading } from "@carbon/react"
import { CheckmarkFilled } from "@carbon/react/icons"

interface CompleteStepProps {
  isSubmitting: boolean
  error: string | null
  onFinish: () => void
  onBack: () => void
}

export function CompleteStep({
  isSubmitting,
  error,
  onFinish,
  onBack,
}: CompleteStepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "2rem" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "4rem",
        height: "4rem",
        borderRadius: "1rem",
        backgroundColor: "var(--cds-support-success)",
        color: "var(--cds-text-on-color)",
      }}>
        <CheckmarkFilled size={32} />
      </div>
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Ready to Go</h2>
        <p style={{ marginTop: "0.5rem", maxWidth: "65ch", color: "var(--cds-text-secondary)" }}>
          Everything is configured. Click the button below to initialize
          Snaplake and start managing your database snapshots.
        </p>
      </div>
      {error && (
        <p style={{ fontSize: "0.875rem", color: "var(--cds-support-error)" }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
        <Button
          kind="secondary"
          onClick={onBack}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        >
          Back
        </Button>
        <Button
          onClick={onFinish}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        >
          {isSubmitting ? (
            <InlineLoading description="Setting up..." />
          ) : (
            "Complete Setup"
          )}
        </Button>
      </div>
    </div>
  )
}
