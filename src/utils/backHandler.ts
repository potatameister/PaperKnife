import { useEffect, useRef } from 'react'
import { App as CapApp } from '@capacitor/app'

type BackFn = () => void

// Last-registered layer closes first. Layers unregister on unmount,
// so one press can never close two layers or exit behind a modal.
let stack: { id: symbol, fn: BackFn }[] = []
let listening = false
let fallback: BackFn | null = null

export function setBackFallback(fn: BackFn | null) {
  fallback = fn
}

export function pushBackHandler(fn: BackFn): () => void {
  const id = Symbol()
  stack.push({ id, fn })
  return () => { stack = stack.filter(h => h.id !== id) }
}

export async function ensureBackListening() {
  if (listening) return
  listening = true
  try {
    await CapApp.addListener('backButton', () => {
      const top = stack[stack.length - 1]
      if (top) top.fn()
      else fallback?.()
    })
  } catch {
    listening = false
  }
}

// Register `fn` while `active` is true. Safe under StrictMode remounts.
export function useBackHandler(active: boolean, fn: BackFn) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    if (!active) return
    ensureBackListening()
    return pushBackHandler(() => ref.current())
  }, [active])
}
