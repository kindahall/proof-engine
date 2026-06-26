"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { applyDomTranslations, startDomTranslator } from "@/lib/i18n/dom-translator"
import type { Language } from "@/lib/i18n/dom-translations"

const STORAGE_KEY = "proof-engine-language"

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // French is the product default. Start from it on the server and first client
  // render (so they match), then hydrate the stored preference after mount.
  const [language, setLanguageState] = useState<Language>("fr")
  const hydrated = useRef(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "fr" || stored === "en") setLanguageState(stored)
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (hydrated.current) window.localStorage.setItem(STORAGE_KEY, language)
    applyDomTranslations(language)
    const stop = startDomTranslator(language)
    return stop
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === "en" ? "fr" : "en"))
  }, [])

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, setLanguage, toggleLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider")
  return context
}
