'use client'

import React, { createContext, useContext, useEffect, useState } from "react"

import { useLocalStorage } from "@/hooks/useLocalStorage";

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme?: () => void
  switchable: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  switchable?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  /*
   * We use `useLocalStorage` to persist the theme.
   * Note: The `switchable` prop determines if we actually *respect* the stored value
   * or if we just sync to it. The original code was a bit complex with "switchable".
   * For now, I will simplify by just using useLocalStorage if switchable is true.
   */
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>("theme", defaultTheme)
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync with stored theme if switchable
  useEffect(() => {
    if (switchable && mounted) {
      setTheme(storedTheme)
    }
  }, [switchable, mounted, storedTheme])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [theme, mounted])

  const toggleTheme = switchable
    ? () => {
      const newTheme = theme === "light" ? "dark" : "light"
      setTheme(newTheme)
      setStoredTheme(newTheme)
    }
    : undefined

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
