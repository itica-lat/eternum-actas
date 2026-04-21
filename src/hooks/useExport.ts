import { useCallback } from 'react'

const REVOKE_DELAY_MS = 15_000

function createObjectURL(html: string): string {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  return URL.createObjectURL(blob)
}

interface UseExportProps {
  fullHTML: string
  filename: string
}

export function useExport({ fullHTML, filename }: UseExportProps) {
  const resolvedFilename = filename || 'documento'

  const handleDownloadHTML = useCallback(() => {
    const url = createObjectURL(fullHTML)
    const a = Object.assign(document.createElement('a'), { href: url, download: `${resolvedFilename}.html` })
    a.click()
    URL.revokeObjectURL(url)
  }, [fullHTML, resolvedFilename])

  const handleExportPDF = useCallback(() => {
    const url = createObjectURL(fullHTML)
    const win = window.open(url, '_blank')
    if (win) {
      win.onload = () => {
        win.print()
        setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
      }
    }
  }, [fullHTML])

  return { handleDownloadHTML, handleExportPDF }
}
