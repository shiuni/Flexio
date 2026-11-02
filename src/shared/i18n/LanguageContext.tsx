import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { nfs, ensureDir } from '../lib/nodeEnv'
import { getFlexioRoot, getPreferencesPath } from '../lib/paths'
import { dispatchLanguageChanged, getHostLocale, onLanguageChanged } from '../lib/cepInterface'
import { LANGS, STRINGS } from './strings'
import type { Lang, Strings } from './strings'

// ─── Preferences file ─────────────────────────────────────────────────────────

/** Until the user picks one, follow the host app's UI language */
function defaultLang(): Lang {
  const locale = getHostLocale() || navigator.language || ''
  return locale.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

function readPrefs(): Record<string, unknown> {
  try {
    const path = getPreferencesPath()
    if (!nfs || !nfs.existsSync(path)) return {}
    const parsed = JSON.parse(nfs.readFileSync(path, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadLang(): Lang {
  const stored = readPrefs().language
  return LANGS.includes(stored as Lang) ? (stored as Lang) : defaultLang()
}

function saveLang(lang: Lang): void {
  if (!nfs) return
  ensureDir(getFlexioRoot())
  nfs.writeFileSync(getPreferencesPath(), JSON.stringify({ ...readPrefs(), language: lang }, null, 2), 'utf8')
}

function prefsTimestamp(): string {
  try {
    const path = getPreferencesPath()
    return nfs && nfs.existsSync(path) ? String(nfs.statSync(path).mtimeMs) : ''
  } catch {
    return ''
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Strings
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang)
  const lastTimestampRef = useRef(prefsTimestamp())

  const reload = useCallback(() => {
    lastTimestampRef.current = prefsTimestamp()
    setLangState(loadLang())
  }, [])

  // Same host: the event. Other hosts: the file changing on disk.
  useEffect(() => onLanguageChanged(reload), [reload])
  useEffect(() => {
    const interval = setInterval(() => {
      if (prefsTimestamp() !== lastTimestampRef.current) reload()
    }, 1000)
    return () => clearInterval(interval)
  }, [reload])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      saveLang(next)
      lastTimestampRef.current = prefsTimestamp()
      dispatchLanguageChanged()
    } catch { /* still applies to this window */ }
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

/** The UI strings for the current language */
export function useT(): Strings {
  return useLanguage().t
}
