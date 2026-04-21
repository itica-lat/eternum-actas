import { useRef, useCallback } from 'react'

interface UseFileLoadProps {
  setMarkdown: (value: string) => void
  setFilename: (name: string) => void
}

export function useFileLoad({ setMarkdown, setFilename }: UseFileLoadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileLoad = useCallback(() => fileInputRef.current?.click(), [])

  const handleFileLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFilename(file.name.replace(/\.md$/i, ''))

    const reader = new FileReader()
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') setMarkdown(ev.target.result)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [setMarkdown, setFilename])

  return { fileInputRef, triggerFileLoad, handleFileLoad }
}
