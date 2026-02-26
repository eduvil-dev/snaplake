const THEME_KEY = "snaplake-theme"

export type Theme = "light" | "dark" | "system"

/** Carbon theme token: "white" for light, "g100" for dark */
export type CarbonTheme = "white" | "g100"

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored
  }
  return "system"
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

export function resolveTheme(theme: Theme): CarbonTheme {
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  return isDark ? "g100" : "white"
}

export function applyTheme(theme: Theme): void {
  const carbonTheme = resolveTheme(theme)
  if (carbonTheme === "white") {
    delete document.documentElement.dataset.carbonTheme
  } else {
    document.documentElement.dataset.carbonTheme = carbonTheme
  }
}

export function initTheme(): void {
  const theme = getStoredTheme()
  applyTheme(theme)

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (getStoredTheme() === "system") {
        applyTheme("system")
      }
    })
}
