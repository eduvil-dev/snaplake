import { Button } from "@carbon/react"
import { Db2Database } from "@carbon/react/icons"

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "2rem" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "4rem",
        height: "4rem",
        borderRadius: "1rem",
        backgroundColor: "var(--cds-interactive)",
        color: "var(--cds-text-on-color)",
      }}>
        <Db2Database size={32} />
      </div>
      <div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Welcome to Snaplake
        </h1>
        <p style={{ marginTop: "0.5rem", maxWidth: "65ch", color: "var(--cds-text-secondary)" }}>
          Your self-hosted database snapshot management platform. Let's get you
          set up in a few quick steps.
        </p>
      </div>
      <Button size="lg" onClick={onNext}>
        Get Started
      </Button>
    </div>
  )
}
