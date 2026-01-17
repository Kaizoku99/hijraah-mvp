'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"

// Cookie utility functions
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

export type Language = "ar" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: React.ReactNode
  initialLanguage?: Language
}

// Translation dictionary
import { en } from "@/locales/en";
import { ar } from "@/locales/ar";

// Translation dictionary
const translations: Record<Language, any> = {
  en,
  ar,
};

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  // Initialize from cookie (works on both server and client)
  // This prevents the RTL/LTR flicker by reading the preference immediately
  const [language, setLanguageState] = useState<Language>(() => {
    if (initialLanguage) {
      return initialLanguage
    }
    // Try to read from cookie first (available during SSR via middleware or initial render)
    const cookieValue = getCookie("hijraah-language")
    if (cookieValue === "ar" || cookieValue === "en") {
      return cookieValue
    }
    // Default to Arabic for new users
    return "ar"
  })
  const [isHydrated, setIsHydrated] = useState(false)

  // On first client render, sync cookie with any existing localStorage preference
  // and update DOM attributes
  useEffect(() => {
    // Check if there's a localStorage value that should be migrated to cookie
    const storedInLocalStorage = localStorage.getItem("hijraah-language")
    const storedInCookie = getCookie("hijraah-language")

    if (storedInLocalStorage && !storedInCookie) {
      // Migrate localStorage preference to cookie
      if (storedInLocalStorage === "ar" || storedInLocalStorage === "en") {
        setCookie("hijraah-language", storedInLocalStorage)
        if (storedInLocalStorage !== language) {
          setLanguageState(storedInLocalStorage)
        }
      }
    }

    // Update DOM attributes immediately
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = language

    setIsHydrated(true)
  }, []) // Only run once on mount

  // Memoize setLanguage to prevent unnecessary re-renders
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    // Store in both cookie (for SSR) and localStorage (for backward compatibility)
    setCookie("hijraah-language", lang)
    // Update HTML dir and lang attributes immediately for user feedback
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }, [])

  // Memoize the translation function - only recreate when language changes
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }, [language])

  // Derive direction from language
  const dir = useMemo(() => (language === "ar" ? "rtl" : "ltr") as "ltr" | "rtl", [language])

  // Update document attributes when language changes (after initial hydration)
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.dir = dir
      document.documentElement.lang = language
    }
  }, [dir, language, isHydrated])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    dir
  }), [language, setLanguage, t, dir])

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
