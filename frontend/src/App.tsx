import { useState, useEffect, useCallback } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { GlobalTheme } from "@carbon/react"
import { router } from "@/routes/router"
import {
  type Theme,
  type CarbonTheme,
  getStoredTheme,
  setStoredTheme,
  resolveTheme,
} from "@/lib/theme"
import { ThemeContext } from "@/lib/theme-context"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  const [carbonTheme, setCarbonTheme] = useState<CarbonTheme>(() =>
    resolveTheme(getStoredTheme()),
  )

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    setStoredTheme(newTheme)
    setCarbonTheme(resolveTheme(newTheme))
  }, [])

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (getStoredTheme() === "system") {
        setCarbonTheme(resolveTheme("system"))
      }
    }
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, carbonTheme, setTheme }}>
      <GlobalTheme theme={carbonTheme}>{children}</GlobalTheme>
    </ThemeContext.Provider>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
