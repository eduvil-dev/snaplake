import { createContext, useContext } from "react"
import type { Theme, CarbonTheme } from "@/lib/theme"

export interface ThemeContextValue {
  theme: Theme
  carbonTheme: CarbonTheme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  carbonTheme: "white",
  setTheme: () => {},
})

export function useThemeContext() {
  return useContext(ThemeContext)
}
