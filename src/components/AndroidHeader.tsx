import React from 'react'
import { ArrowLeft, Search, X } from 'lucide-react'
import { t } from '../i18n'

interface AndroidHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  action?: React.ReactNode
  children?: React.ReactNode
}

// Single header language for Tool, History, and Settings screens:
// back + title + optional rose caption, trailing action slot, optional
// body (e.g. History search) under the same blur/border/safe-area shell.
export default function AndroidHeader({ title, subtitle, onBack, action, children }: AndroidHeaderProps) {
  return (
    <header className="px-4 pt-safe pb-1 sticky top-0 z-30 bg-[#FAFAFA]/95 dark:bg-black/95 backdrop-blur-xl md:hidden border-b border-gray-100 dark:border-white/5">
      <div className="flex items-center justify-between h-14">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              aria-label={t("Back")}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-900 transition-colors -ml-1 shrink-0"
            >
              <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white truncate">{title}</h1>
            {subtitle && (
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 opacity-80 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {action ?? <div className="w-10" />}
      </div>
      {children && <div className="pb-3">{children}</div>}
    </header>
  )
}

interface TabHeaderProps {
  title: string
  query?: string
  onQuery?: (q: string) => void
  placeholder?: string
  action?: React.ReactNode
}

// Shared top for the three tab pages (Tools, Activity, Settings):
// one title scale, one search style, one sticky shell. No back button
// (tabs are navigation roots) and no caption gimmicks.
export function TabHeader({ title, query, onQuery, placeholder, action }: TabHeaderProps) {
  return (
    <header className="px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4 sticky top-0 z-30 bg-[#FAFAFA]/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">{title}</h1>
        {action}
      </div>
      {onQuery && (
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-rose-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder={placeholder ?? t("Search...")}
            value={query ?? ''}
            onChange={(e) => onQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold placeholder:text-gray-400 focus:border-rose-500 shadow-sm outline-none transition-all dark:text-white"
          />
          {query && (
            <button
              onClick={() => onQuery('')}
              aria-label={t("Clear search")}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 active:scale-90 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
    </header>
  )
}
