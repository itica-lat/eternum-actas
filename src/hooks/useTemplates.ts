import { useState, useCallback } from 'react'
import type { Template } from '../types'

const STORAGE_KEY = 'eternum:templates'

function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Template[]) : []
  } catch {
    return []
  }
}

function persistTemplates(templates: Template[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // Silently ignore storage errors
  }
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(loadTemplates)

  const saveTemplate = useCallback((template: Template) => {
    setTemplates(prev => {
      const next = [...prev, template]
      persistTemplates(next)
      return next
    })
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id)
      persistTemplates(next)
      return next
    })
  }, [])

  return { templates, saveTemplate, deleteTemplate }
}
