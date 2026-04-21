import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { parseMarkdown } from './lib/markdownParser'
import { generateHTML } from './lib/htmlExporter'
import { SLASH_COMMANDS, filterCommands } from './lib/slashCommands'
import type { SlashCommand } from './lib/slashCommands'
import { SlashPalette } from './components/SlashPalette'
import { SettingsPanel } from './components/SettingsPanel'
import { defaultDocSettings } from './types'
import type { DocSettings } from './types'
import './App.css'

const EXAMPLE_MD = `# Guía de preguntas para el relevamiento
_Uso interno del equipo · no distribuir sin revisión_

## :icon:user: Contexto y rol del entrevistado

### Duración estimada · 5 min

_«¿Cuál es tu rol en la coordinación de informática?»_

_«¿Cuánto tiempo llevás en ese rol?»_

---

## :icon:flame: Puntos de dolor

> La frecuencia e impacto de cada dolor definen la priorización de módulos.

- ¿Con qué frecuencia pasa eso?
- ¿Cuánto tiempo llevó resolverlo?
- ¿Qué impacto tuvo en la clase?

---

## :icon:git-branch: Estado actual del sistema

1. ¿Qué herramientas usás hoy para registrar incidentes?
2. ¿Cómo se comunica el estado de un equipo a dirección?
3. ¿Existe algún registro histórico accesible?

### Nota sobre el módulo de reportes

El sistema actual **no exporta** datos estructurados. Verificar si hay registros en \`hojas de cálculo\` o correos.

Módulo priorizado: :badge:alta prioridad:

---refs---
ITI CETP. (2026). *Documento del proyecto SGRSI*. Interno.
Equipo Eternum. (2026). *Guía de relevamiento v1*. Uso interno.
`

interface SlashTrigger {
  query: string
  slashStart: number
  selectedIndex: number
  offsetTop: number
}

export default function App() {
  const [markdown, setMarkdown]         = useState(EXAMPLE_MD)
  const [filename, setFilename]         = useState('documento')
  const [docSettings, setDocSettings]   = useState<DocSettings>(defaultDocSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [slashTrigger, setSlashTrigger] = useState<SlashTrigger | null>(null)

  const textareaRef       = useRef<HTMLTextAreaElement>(null)
  const editorPaneRef     = useRef<HTMLDivElement>(null)
  const iframeRef         = useRef<HTMLIFrameElement>(null)
  const fileInputRef      = useRef<HTMLInputElement>(null)
  const pendingCursorRef  = useRef<number | null>(null)

  const parseResult = useMemo(() => parseMarkdown(markdown), [markdown])
  const fullHTML    = useMemo(() => generateHTML(parseResult, docSettings), [parseResult, docSettings])

  // Render preview into the iframe without triggering a navigation.
  // First paint: full document write (necessary to set up <head>, fonts, CSS).
  // Subsequent updates: swap only <body> innerHTML — the document stays alive,
  // scroll position is never reset, and fonts/styles are already loaded.
  const previewMounted = useRef(false)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const writeInitial = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (!doc) return
      doc.open()
      doc.write(fullHTML)
      doc.close()
      previewMounted.current = true
    }

    const updateBody = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      const win = iframe.contentWindow as (Window & { lucide?: { createIcons: () => void } }) | null
      if (!doc || !win) return

      // Parse the new HTML and replace only <body> so <head> (fonts, CSS) is untouched
      // and the document is never navigated — scroll position stays intact.
      const newDoc = new DOMParser().parseFromString(fullHTML, 'text/html')
      doc.body.innerHTML = newDoc.body.innerHTML

      // Scripts injected via innerHTML don't auto-execute; re-init Lucide manually.
      win.lucide?.createIcons()
    }

    if (!previewMounted.current) {
      writeInitial()
      return
    }

    const timer = setTimeout(updateBody, 400)
    return () => clearTimeout(timer)
  }, [fullHTML])

  // Set cursor after markdown state update
  useEffect(() => {
    if (pendingCursorRef.current !== null && textareaRef.current) {
      const pos = pendingCursorRef.current
      textareaRef.current.setSelectionRange(pos, pos)
      pendingCursorRef.current = null
    }
  }, [markdown])

  // ── Slash command detection ──────────────────────────────────────────────
  const detectSlash = useCallback((value: string, cursor: number) => {
    const textBefore = value.slice(0, cursor)
    const match = textBefore.match(/(?:^|\n| )\/(\w*)$/)
    if (!match) { setSlashTrigger(null); return }

    const slashPos = textBefore.lastIndexOf('/')
    const query = match[1].toLowerCase()

    // Approximate cursor Y within editor pane
    const linesBeforeCursor = value.slice(0, cursor).split('\n').length
    const lineHeight = 22 // 12.5px * 1.75
    const paddingTop = 16
    const scrollTop  = textareaRef.current?.scrollTop ?? 0
    const approxTop  = paddingTop + linesBeforeCursor * lineHeight - scrollTop

    setSlashTrigger(prev => ({
      query,
      slashStart: slashPos,
      selectedIndex: prev?.slashStart === slashPos ? prev.selectedIndex : 0,
      offsetTop: Math.max(8, approxTop),
    }))
  }, [])

  const closeSlash = useCallback(() => setSlashTrigger(null), [])

  // ── Insert slash command ─────────────────────────────────────────────────
  const insertSlashCommand = useCallback((cmd: SlashCommand) => {
    if (!slashTrigger || !textareaRef.current) return
    const cursor = textareaRef.current.selectionStart
    const before = markdown.slice(0, slashTrigger.slashStart)
    const after  = markdown.slice(cursor)
    const newText = before + cmd.snippet + after
    const newCursor = slashTrigger.slashStart + cmd.snippet.length - (cmd.cursorOffset ?? 0)
    pendingCursorRef.current = newCursor
    setMarkdown(newText)
    setSlashTrigger(null)
  }, [markdown, slashTrigger])

  // ── Editor handlers ──────────────────────────────────────────────────────
  const handleEditorChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMarkdown(value)
    detectSlash(value, e.target.selectionStart)
  }, [detectSlash])

  const filteredCommands = useMemo(
    () => slashTrigger ? filterCommands(slashTrigger.query) : SLASH_COMMANDS,
    [slashTrigger]
  )

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashTrigger) return
    const len = filteredCommands.length
    if (len === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSlashTrigger(p => p ? { ...p, selectedIndex: (p.selectedIndex + 1) % len } : null)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSlashTrigger(p => p ? { ...p, selectedIndex: (p.selectedIndex - 1 + len) % len } : null)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertSlashCommand(filteredCommands[slashTrigger.selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSlashTrigger(null)
    }
  }, [slashTrigger, filteredCommands, insertSlashCommand])

  // ── File load ────────────────────────────────────────────────────────────
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
  }, [])

  // ── Export HTML ──────────────────────────────────────────────────────────
  const handleDownloadHTML = useCallback(() => {
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename || 'documento'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [fullHTML, filename])

  // ── Export PDF ───────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(() => {
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) {
      win.onload = () => {
        win.print()
        setTimeout(() => URL.revokeObjectURL(url), 15000)
      }
    }
  }, [fullHTML])

  const errors  = parseResult.warnings.filter(w => w.startsWith('Error:'))
  const notices = parseResult.warnings.filter(w => !w.startsWith('Error:'))
  const hasWarnings = errors.length > 0 || notices.length > 0

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-navy via-[#0a2e4a] to-teal overflow-hidden font-sans">

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between px-5 h-12 shrink-0
                         bg-navy/70 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-aqua font-semibold text-sm tracking-widest uppercase">Eternum</span>
          <span className="w-px h-4 bg-white/15" />
          <span className="text-white/50 text-xs font-light">Generador de documentos</span>
          {/* Doc type chip */}
          <span className="px-2 py-0.5 rounded-md text-[10px] border border-aqua/25
                           text-aqua/70 bg-aqua/8 tracking-wide uppercase font-medium">
            {docSettings.type === 'acta' ? 'Acta' : 'Documento'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filename */}
          <div className="flex items-center bg-white/8 border border-white/15 rounded-md overflow-hidden">
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="nombre-archivo"
              aria-label="Nombre del archivo"
              className="bg-transparent text-white font-mono text-xs px-2.5 py-1.5 w-36
                         outline-none placeholder:text-white/25 focus:ring-1 focus:ring-aqua/50"
            />
            <span className="text-white/30 font-mono text-xs pr-2.5 select-none">.html</span>
          </div>

          {/* Load */}
          <button onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-md text-xs bg-white/8 border border-white/15
                       text-white/70 hover:bg-white/14 hover:text-white transition-colors cursor-pointer">
            Cargar .md
          </button>
          <input ref={fileInputRef} type="file" accept=".md,text/markdown"
                 onChange={handleFileLoad} className="hidden" />

          {/* Separator */}
          <span className="w-px h-4 bg-white/15" />

          {/* Export PDF */}
          <button onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs
                       bg-white/8 border border-white/15 text-white/70
                       hover:bg-white/14 hover:text-white transition-colors cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            PDF
          </button>

          {/* Export HTML */}
          <button onClick={handleDownloadHTML} disabled={errors.length > 0}
            className="px-3 py-1.5 rounded-md text-xs bg-teal text-white font-medium
                       hover:bg-teal/80 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors cursor-pointer">
            Exportar HTML
          </button>

          {/* Settings toggle */}
          <button
            onClick={() => setSettingsOpen(o => !o)}
            aria-label="Configuración"
            className={`p-1.5 rounded-md border transition-colors cursor-pointer
              ${settingsOpen
                ? 'bg-teal/20 border-teal/40 text-teal'
                : 'bg-white/8 border-white/15 text-white/60 hover:text-white hover:bg-white/14'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Warnings ── */}
      {hasWarnings && (
        <div className="flex flex-wrap gap-1.5 px-5 py-2 shrink-0
                        bg-amber-400/15 backdrop-blur-sm border-b border-amber-300/20">
          {errors.map((w, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-red-400/20
                                     text-red-200 border border-red-400/20">{w}</span>
          ))}
          {notices.map((w, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-amber-300/20
                                     text-amber-200 border border-amber-300/20">{w}</span>
          ))}
        </div>
      )}

      {/* ── Workspace ── */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">

        {/* Editor pane */}
        <div
          ref={editorPaneRef}
          className="flex flex-col flex-1 min-w-0 rounded-xl overflow-hidden relative
                     bg-white/8 backdrop-blur-xl border border-white/12 shadow-2xl"
        >
          <div className="px-4 py-2 shrink-0 border-b border-white/10 bg-white/5">
            <span className="text-[10px] font-medium tracking-widest uppercase text-aqua/70">
              Markdown
            </span>
            <span className="ml-3 text-[9px] text-white/25">
              Escribí <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-white/40">/</kbd> para insertar elementos
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={handleEditorChange}
            onKeyDown={handleEditorKeyDown}
            spellCheck={false}
            aria-label="Editor de markdown"
            className="flex-1 w-full resize-none bg-transparent outline-none
                       px-5 py-4 font-mono text-[12.5px] leading-[1.75]
                       text-frost/90 caret-aqua placeholder:text-white/20"
          />

          {/* Slash command palette */}
          {slashTrigger && filteredCommands.length > 0 && (
            <SlashPalette
              commands={filteredCommands}
              selectedIndex={slashTrigger.selectedIndex}
              onSelect={insertSlashCommand}
              onClose={closeSlash}
              offsetTop={slashTrigger.offsetTop}
            />
          )}
        </div>

        {/* Preview pane */}
        <div className="flex flex-col flex-1 min-w-0 rounded-xl overflow-hidden
                        bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl">
          <div className="px-4 py-2 shrink-0 border-b border-white/10 bg-white/5">
            <span className="text-[10px] font-medium tracking-widest uppercase text-aqua/70">
              Vista previa
            </span>
          </div>
          <iframe
            ref={iframeRef}
            title="Vista previa del documento"
            sandbox="allow-scripts allow-same-origin"
            className="flex-1 w-full border-none bg-white"
          />
        </div>

        {/* Settings panel — slides in over preview area */}
        <div className={`flex shrink-0 overflow-hidden rounded-xl transition-all duration-300 ease-in-out
                         ${settingsOpen ? 'w-68 opacity-100' : 'w-0 opacity-0'}`}>
          {settingsOpen && (
            <SettingsPanel
              settings={docSettings}
              onChange={setDocSettings}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>

      </div>
    </div>
  )
}
