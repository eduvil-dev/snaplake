import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  Tile,
  TextInput,
  Button,
  InlineLoading,
} from "@carbon/react"
import { Db2Database } from "@carbon/react/icons"
import { api } from "@/lib/api"
import { setAuth } from "@/lib/auth"

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await api.post<{ token: string; expiresAt: string }>(
        "/api/auth/login",
        { username, password },
      )
      setAuth(result.token, result.expiresAt, username)
      navigate({ to: "/" })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <title>Sign In - Snaplake</title>
      <Tile style={{ width: "100%", maxWidth: "24rem", padding: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "3rem",
            height: "3rem",
            borderRadius: "0.75rem",
            backgroundColor: "var(--cds-interactive)",
            color: "var(--cds-text-on-color)",
          }}>
            <Db2Database size={24} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Sign in to Snaplake</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <TextInput
              id="username"
              labelText="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
            />
            <TextInput
              id="password"
              type="password"
              labelText="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p style={{ fontSize: "0.875rem", color: "var(--cds-support-error)" }}>{error}</p>
            )}
            <Button
              type="submit"
              style={{ width: "100%", maxWidth: "100%" }}
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <InlineLoading description="Signing in..." />
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </form>
      </Tile>
    </div>
  )
}
