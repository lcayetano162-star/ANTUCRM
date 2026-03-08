import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { translate, Lang } from '@/lib/i18n'

const STORAGE_KEY = 'antu-lang'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (text: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'es',
  setLang: () => {},
  t: (text) => text,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return (stored === 'en' || stored === 'es') ? stored : 'es'
    } catch {
      return 'es'
    }
  })

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
  }, [])

  // Keep html[lang] attribute in sync for accessibility
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (text: string, vars?: Record<string, string | number>) => translate(text, lang, vars),
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
