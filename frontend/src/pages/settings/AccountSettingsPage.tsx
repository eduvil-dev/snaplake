import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button, Tile, TextInput, InlineLoading } from "@carbon/react"
import { CheckmarkFilled } from "@carbon/react/icons"

export function AccountSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const changeMutation = useMutation({
    mutationFn: () =>
      api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setErrors({ submit: err.message })
    },
  })

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      changeMutation.mutate()
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
          Account Settings
        </h1>
        <p style={{ color: "var(--cds-text-secondary)" }}>
          Manage your account security
        </p>
      </div>

      <Tile style={{ maxWidth: "32rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Change Password</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
              Update your admin account password
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <TextInput
              id="currentPassword"
              type="password"
              labelText="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              invalid={!!errors.currentPassword}
              invalidText={errors.currentPassword}
            />
            <TextInput
              id="newPassword"
              type="password"
              labelText="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              invalid={!!errors.newPassword}
              invalidText={errors.newPassword}
            />
            <TextInput
              id="confirmPassword"
              type="password"
              labelText="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              invalid={!!errors.confirmPassword}
              invalidText={errors.confirmPassword}
            />

            {errors.submit && (
              <p style={{ fontSize: "0.875rem", color: "var(--cds-support-error)" }}>
                {errors.submit}
              </p>
            )}
            {success && (
              <p style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.875rem",
                color: "var(--cds-support-success)",
              }}>
                <CheckmarkFilled size={16} />
                Password changed successfully
              </p>
            )}

            <Button
              type="submit"
              disabled={changeMutation.isPending}
              style={{ width: "100%", maxWidth: "100%" }}
            >
              {changeMutation.isPending && (
                <InlineLoading style={{ marginRight: "0.5rem" }} />
              )}
              Change Password
            </Button>
          </form>
        </div>
      </Tile>
    </div>
  )
}
