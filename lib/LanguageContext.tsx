'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, translations } from './translations'

interface LanguageContextProps {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, replacements?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('civic_reporter_lang') as Language
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang)
      localStorage.setItem('civic_reporter_lang', lang)
      // Dispatch a custom event to notify other parts of the app if needed
      window.dispatchEvent(new Event('language-change'))
    }
  }

  // Translation helper
  const t = (key: string, replacements?: Record<string, string | number>) => {
    // If not mounted yet (SSR phase or initial hydration), default to the current state (which defaults to 'en')
    const activeLang = mounted ? language : 'en'
    let val = translations[activeLang]?.[key] || translations['en']?.[key] || key

    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v))
      })
    }
    return val
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
