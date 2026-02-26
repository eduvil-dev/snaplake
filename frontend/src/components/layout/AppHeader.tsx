import { useNavigate } from "@tanstack/react-router"
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from "@carbon/react"
import { Logout, Asleep, Light, Laptop } from "@carbon/react/icons"
import { clearAuth, getUsername } from "@/lib/auth"
import { useThemeContext } from "@/lib/theme-context"
import type { Theme } from "@/lib/theme"

export function AppHeader() {
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeContext()
  const username = getUsername()

  function cycleTheme() {
    const next: Theme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(next)
  }

  function handleLogout() {
    clearAuth()
    navigate({ to: "/login" })
  }

  const themeLabel =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"

  return (
    <Header aria-label="Snaplake">
      <HeaderName prefix="">
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <img
            src="/favicon.svg"
            alt=""
            width={20}
            height={20}
            style={{ marginRight: 8 }}
          />
          Snaplake
        </span>
      </HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction
          aria-label={`Theme: ${themeLabel}`}
          tooltipAlignment="end"
          onClick={cycleTheme}
        >
          {theme === "dark" ? (
            <Asleep size={20} />
          ) : theme === "light" ? (
            <Light size={20} />
          ) : (
            <Laptop size={20} />
          )}
        </HeaderGlobalAction>
        <HeaderGlobalAction
          aria-label={`${username} — Logout`}
          tooltipAlignment="end"
          onClick={handleLogout}
        >
          <Logout size={20} />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  )
}
