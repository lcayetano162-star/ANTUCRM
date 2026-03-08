import { useState, useEffect } from 'react'

const STORAGE_KEY = 'antu-dark-mode'

function applyTheme(dark: boolean) {
  const root = document.documentElement
  if (dark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) return stored === 'true'
      // System preference fallback
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  // Apply on mount and whenever isDark changes
  useEffect(() => {
    applyTheme(isDark)
    try {
      localStorage.setItem(STORAGE_KEY, String(isDark))
    } catch { /* storage not available */ }
  }, [isDark])

  // Apply immediately on first render (avoids flash)
  useEffect(() => {
    applyTheme(isDark)
  }, [])

  const toggleDark = () => setIsDark(prev => !prev)

  return { isDark, toggleDark, setIsDark }
}
