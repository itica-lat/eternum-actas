import { useState, useEffect, useRef } from 'react'
import type { DocSettings } from '../types'

const STORAGE_KEY  = 'eternum:autosave'
const DEBOUNCE_MS  = 600

export interface AutoSaveState {
  markdown: string
  filename: string
  docSettings: DocSettings
}

/** Load the last autosaved state from localStorage, or null if none exists. */
export function loadAutoSave(): AutoSaveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AutoSaveState) : null
  } catch {
    return null
  }
}

type SaveStatus = 'idle' | 'pending' | 'saved'

/**
 * Debounce-saves editor state to localStorage.
 * Skips the very first render so loading from autosave doesn't immediately re-write.
 */
export function useAutoSave(
  markdown: string,
  filename: string,
  docSettings: DocSettings,
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountRef    = useRef(true)

  useEffect(() => {
    // Skip the initial mount — state was just loaded from storage
    if (isMountRef.current) { isMountRef.current = false; return }

    setStatus('pending')
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ markdown, filename, docSettings }))
        setStatus('saved')
      } catch {
        // Silently ignore storage quota or private-mode errors
        setStatus('idle')
      }
    }, DEBOUNCE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [markdown, filename, docSettings])

  return { status } as const
}
