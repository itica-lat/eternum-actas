import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { parseMarkdown } from './lib/markdownParser'
import { generateHTML } from './lib/htmlExporter'
import { buildMarkdownFromTemplate } from './lib/templateUtils'
import { SlashPalette } from './components/SlashPalette'
import { SettingsPanel } from './components/SettingsPanel'
import { TemplatesPanel } from './components/TemplatesPanel'
import { defaultDocSettings } from './types'
import type { DocSettings, Template } from './types'
import { useSlashCommands } from './hooks/useSlashCommands'
import { useExport } from './hooks/useExport'
import { useFileLoad } from './hooks/useFileLoad'
import { useAutoSave, loadAutoSave } from './hooks/useAutoSave'
import { useTemplates } from './hooks/useTemplates'
import { EXAMPLE_MD } from './constants/exampleMarkdown'
import './App.css'

/** Read the single autosave entry once; used to hydrate the initial component state. */
function getInitialState() {
  const saved = loadAutoSave()
  return {
    markdown:    saved?.markdown ?? EXAMPLE_MD,
    filename:    saved?.filename ?? 'documento',
    docSettings: {
      ...defaultDocSettings,
      ...(saved?.docSettings ?? {}),
      // Deep-merge brandColors so fields added after the last save are always defined
      brandColors: {
        ...defaultDocSettings.brandColors,
        ...(saved?.docSettings?.brandColors ?? {}),
      },
    } satisfies DocSettings,
    wasRestored: !!saved,
  }
}

const initialState = getInitialState()

export default function App() {
  const [markdown, setMarkdown]           = useState(initialState.markdown)
  const [filename, setFilename]           = useState(initialState.filename)
  const [docSettings, setDocSettings]     = useState<DocSettings>(initialState.docSettings)
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const wasRestored = useRef(initialState.wasRestored)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const iframeRef   = useRef<HTMLIFrameElement>(null)

  const parseResult = useMemo(() => parseMarkdown(markdown), [markdown])
  const fullHTML    = useMemo(() => generateHTML(parseResult, docSettings), [parseResult, docSettings])

  const { slashTrigger, detectSlash, closeSlash, insertSlashCommand, filteredCommands, handleSlashKeyDown } =
    useSlashCommands({ markdown, setMarkdown, textareaRef })

  const { handleDownloadHTML, handleExportPDF } = useExport({ fullHTML, filename })
  const { fileInputRef, triggerFileLoad, handleFileLoad } = useFileLoad({ setMarkdown, setFilename })
  const { status: saveStatus } = useAutoSave(markdown, filename, docSettings)
  const { templates, saveTemplate, deleteTemplate } = useTemplates()

  // Sync brand colors → CSS custom properties so Tailwind utilities update live
  useEffect(() => {
    const root = document.documentElement
    const { navy, teal, aqua, frost } = docSettings.brandColors
    root.style.setProperty('--color-navy',  navy)
    root.style.setProperty('--color-teal',  teal)
    root.style.setProperty('--color-aqua',  aqua)
    root.style.setProperty('--color-frost', frost)
  }, [docSettings.brandColors])

  const handleEditorChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value)
    detectSlash(e.target.value, e.target.selectionStart)
  }, [detectSlash])

  // Opening one panel closes the other
  const openSettings  = useCallback(() => { setSettingsOpen(true);  setTemplatesOpen(false) }, [])
  const openTemplates = useCallback(() => { setTemplatesOpen(true); setSettingsOpen(false)  }, [])

  const handleApplyTemplate = useCallback((tpl: Template) => {
    setDocSettings(tpl.docSettings)
    setMarkdown(buildMarkdownFromTemplate(tpl))
    setTemplatesOpen(false)
  }, [])

  const errors      = parseResult.warnings.filter(w => w.startsWith('Error:'))
  const notices     = parseResult.warnings.filter(w => !w.startsWith('Error:'))
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
          {/* Restored from autosave badge (shown once) */}
          {wasRestored.current && (
            <span className="px-2 py-0.5 rounded-md text-[10px] border border-amber-400/25
                             text-amber-300/70 bg-amber-400/8 tracking-wide">
              retomado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Autosave indicator */}
          <span className={`text-[10px] transition-opacity duration-300
            ${saveStatus === 'pending' ? 'text-white/30 opacity-100' : ''}
            ${saveStatus === 'saved'   ? 'text-aqua/50 opacity-100' : ''}
            ${saveStatus === 'idle'    ? 'opacity-0'               : ''}`}>
            {saveStatus === 'pending' ? '○ guardando…' : '● guardado'}
          </span>

          <span className="w-px h-4 bg-white/15" />

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
          <button onClick={triggerFileLoad}
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

          {/* Templates toggle */}
          <button
            onClick={templatesOpen ? () => setTemplatesOpen(false) : openTemplates}
            aria-label="Plantillas"
            title="Plantillas"
            className={`p-1.5 rounded-md border transition-colors cursor-pointer
              ${templatesOpen
                ? 'bg-teal/20 border-teal/40 text-teal'
                : 'bg-white/8 border-white/15 text-white/60 hover:text-white hover:bg-white/14'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </button>

          {/* Settings toggle */}
          <button
            onClick={settingsOpen ? () => setSettingsOpen(false) : openSettings}
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
            onKeyDown={handleSlashKeyDown}
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

        {/* Settings panel */}
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

        {/* Templates panel */}
        <div className={`flex shrink-0 overflow-hidden rounded-xl transition-all duration-300 ease-in-out
                         ${templatesOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'}`}>
          {templatesOpen && (
            <TemplatesPanel
              templates={templates}
              currentMarkdown={markdown}
              currentSettings={docSettings}
              onSave={saveTemplate}
              onApply={handleApplyTemplate}
              onDelete={deleteTemplate}
              onClose={() => setTemplatesOpen(false)}
            />
          )}
        </div>

      </div>

      {/* ── Footer watermark ── */}
      <footer className="shrink-0 flex items-center justify-center gap-1.5 h-7
                         bg-navy/60 backdrop-blur-md border-t border-white/8">
        <span className="text-white/25 text-[10px] select-none tracking-wide">
          Creado con
        </span>
        <a
          href="https://github.com/itica-lat/eternum-actas"
          target="_blank"
          rel="noopener noreferrer"
          className="text-aqua/50 hover:text-aqua text-[10px] font-medium tracking-wide
                     transition-colors duration-200 underline-offset-2 hover:underline"
        >
          Eternum Actas
        </a>
        <span className="text-white/20 text-[10px] select-none">·</span>
        <span className="text-white/20 text-[10px] select-none tracking-wide">
          © {new Date().getFullYear()} ITICA
        </span>
      </footer>
    </div>
  )
}
