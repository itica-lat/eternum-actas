import { useState } from 'react'
import type { Template, DocSettings } from '../types'
import { createTemplate } from '../lib/templateUtils'

interface Props {
  templates: Template[]
  currentMarkdown: string
  currentSettings: DocSettings
  onSave: (tpl: Template) => void
  onApply: (tpl: Template) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SettingChip({ label, active }: { label: string; active: boolean }) {
  if (!active) return null
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] border border-teal/30 text-teal/70 bg-teal/8">
      {label}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
           className="text-white/20">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
      <p className="text-[11px] text-white/30 leading-relaxed">
        Aún no hay plantillas guardadas.<br />
        Guardá la estructura actual para reutilizarla.
      </p>
    </div>
  )
}

function TemplateCard({
  template,
  onApply,
  onDelete,
}: {
  template: Template
  onApply: () => void
  onDelete: () => void
}) {
  const { name, createdAt, docSettings, sections, refs } = template
  const headingSections = sections.filter(s => /^## /.test(s))

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl border border-white/10 bg-white/4
                    hover:border-white/20 transition-colors">
      {/* Name + date */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-white/80 leading-tight wrap-break-word">
          {name}
        </span>
        <span className="shrink-0 text-[9px] text-white/30 mt-0.5">{formatDate(createdAt)}</span>
      </div>

      {/* Settings chips */}
      <div className="flex flex-wrap gap-1">
        <span className="px-1.5 py-0.5 rounded text-[9px] border border-aqua/25 text-aqua/60 bg-aqua/8">
          {docSettings.type === 'acta' ? 'Acta' : 'Documento'}
        </span>
        <SettingChip label="Encabezado" active={docSettings.headerEnabled} />
        <SettingChip label="Pie"        active={!!(docSettings.footerLeft || docSettings.footerRight)} />
        <SettingChip label="Marca agua" active={docSettings.watermarkEnabled} />
        <SettingChip label="Refs"       active={!!refs} />
      </div>

      {/* Sections preview */}
      {headingSections.length > 0 && (
        <ul className="flex flex-col gap-0.5 border-l-2 border-white/10 pl-2.5">
          {headingSections.slice(0, 5).map((s, i) => (
            <li key={i} className="text-[10px] text-white/40 truncate">
              {s.replace(/^## /, '')}
            </li>
          ))}
          {headingSections.length > 5 && (
            <li className="text-[10px] text-white/25">
              +{headingSections.length - 5} más…
            </li>
          )}
        </ul>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={onApply}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-medium
                     bg-teal/15 border border-teal/30 text-teal/80
                     hover:bg-teal/25 hover:text-teal transition-colors cursor-pointer"
        >
          Aplicar
        </button>
        <button
          onClick={onDelete}
          aria-label="Eliminar plantilla"
          className="px-2.5 py-1.5 rounded-lg text-[11px]
                     bg-white/5 border border-white/10 text-white/35
                     hover:bg-red-500/15 hover:border-red-400/30 hover:text-red-300
                     transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export function TemplatesPanel({
  templates,
  currentMarkdown,
  currentSettings,
  onSave,
  onApply,
  onDelete,
  onClose,
}: Props) {
  const [name, setName]           = useState('')
  const [justSaved, setJustSaved] = useState(false)

  function handleSave() {
    if (!name.trim()) return
    onSave(createTemplate(name, currentMarkdown, currentSettings))
    setName('')
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div className="flex flex-col w-72 shrink-0 h-full
                    bg-navy/85 backdrop-blur-2xl border-l border-white/10
                    shadow-2xl overflow-hidden">

      {/* ── Panel header ── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0
                      border-b border-white/10 bg-white/3">
        <span className="text-xs font-medium text-white/70 tracking-wide">Plantillas</span>
        <button
          onClick={onClose}
          aria-label="Cerrar plantillas"
          className="text-white/35 hover:text-white/80 transition-colors p-0.5 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-5 p-4 overflow-y-auto flex-1">

        {/* ── Save current ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-aqua/60">
              Guardar plantilla actual
            </span>
            {justSaved && (
              <span className="text-[9px] text-teal/70">✓ guardada</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nombre de la plantilla…"
              aria-label="Nombre de la nueva plantilla"
              className="bg-white/8 border border-white/12 rounded-lg px-2.5 py-1.5
                         text-white text-xs outline-none focus:border-aqua/50
                         transition-colors placeholder:text-white/20"
            />
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full py-1.5 rounded-lg text-xs font-medium
                         bg-teal/20 border border-teal/35 text-teal
                         hover:bg-teal/30 disabled:opacity-35 disabled:cursor-not-allowed
                         transition-colors cursor-pointer"
            >
              Guardar plantilla
            </button>
          </div>
          <p className="mt-2 text-[9px] text-white/25 leading-relaxed">
            Captura encabezado, pie, marca de agua, referencias y secciones del documento actual.
          </p>
        </section>

        <div className="h-px bg-white/8" />

        {/* ── Template list ── */}
        <section>
          <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-aqua/60 block mb-3">
            Plantillas guardadas
            {templates.length > 0 && (
              <span className="ml-2 text-white/30 normal-case tracking-normal">
                ({templates.length})
              </span>
            )}
          </span>

          {templates.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-2.5">
              {[...templates].reverse().map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  onApply={() => onApply(tpl)}
                  onDelete={() => onDelete(tpl.id)}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
