import { es } from './es'

/**
 * Minimal i18n: English strings are the keys, so untranslated text simply
 * falls back to English. The language is read once at startup; changing it
 * reloads the app so module-level constants (tool lists, etc.) are rebuilt.
 */
export type Language = 'en' | 'es'

export const LANGUAGES: { id: Language, label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
]

const STORAGE_KEY = 'language'
const dictionaries: Partial<Record<Language, Record<string, string>>> = { es }

function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'es') return saved
  } catch { /* storage unavailable */ }
  try {
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es')) return 'es'
  } catch { /* ignore */ }
  return 'en'
}

export const language: Language = detectLanguage()

export function setLanguage(lang: Language) {
  try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
  window.location.reload()
}

/** Translate `text`; `{0}`, `{1}`… are replaced by `args`. */
export function t(text: string, ...args: unknown[]): string {
  const out = dictionaries[language]?.[text] ?? text
  return args.length ? out.replace(/\{(\d+)\}/g, (m, i) => (Number(i) < args.length ? String(args[Number(i)]) : m)) : out
}
