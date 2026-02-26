import { useState } from "react"
import { TextInput, Button } from "@carbon/react"

interface AdminAccountStepProps {
  data: { username: string; password: string; confirmPassword: string }
  onChange: (data: { username: string; password: string; confirmPassword: string }) => void
  onNext: () => void
  onBack: () => void
}

export function AdminAccountStep({
  data,
  onChange,
  onNext,
  onBack,
}: AdminAccountStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!data.username.trim()) {
      newErrors.username = "Username is required"
    } else if (data.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }

    if (!data.password) {
      newErrors.password = "Password is required"
    } else if (data.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (validate()) {
      onNext()
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Admin Account</h2>
        <p style={{ marginTop: "0.5rem", color: "var(--cds-text-secondary)" }}>
          Create the admin account for managing Snaplake.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <TextInput
          id="username"
          labelText="Username"
          value={data.username}
          onChange={(e) => onChange({ ...data, username: e.target.value })}
          placeholder="admin"
          invalid={!!errors.username}
          invalidText={errors.username}
        />
        <TextInput
          id="password"
          type="password"
          labelText="Password"
          value={data.password}
          onChange={(e) => onChange({ ...data, password: e.target.value })}
          placeholder="At least 8 characters"
          invalid={!!errors.password}
          invalidText={errors.password}
        />
        <TextInput
          id="confirmPassword"
          type="password"
          labelText="Confirm Password"
          value={data.confirmPassword}
          onChange={(e) => onChange({ ...data, confirmPassword: e.target.value })}
          placeholder="Re-enter your password"
          invalid={!!errors.confirmPassword}
          invalidText={errors.confirmPassword}
        />
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Button kind="secondary" onClick={onBack} style={{ flex: 1 }}>
          Back
        </Button>
        <Button onClick={handleNext} style={{ flex: 1 }}>
          Next
        </Button>
      </div>
    </div>
  )
}
