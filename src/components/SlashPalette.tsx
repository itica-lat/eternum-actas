import { useEffect, useRef } from 'react'
import type { SlashCommand } from '../lib/slashCommands'

interface Props {
  commands: SlashCommand[]
  selectedIndex: number
  onSelect: (cmd: SlashCommand) => void
  onClose: () => void
  /** Approximate top offset in px within the editor container */
  offsetTop: number
}

const ICON_SVG: Record<string, string> = {
  'heading-2': '<line x1="4" y1="7" x2="4" y2="17"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="4" y1="12" x2="12" y2="12"/><line x1="15" y1="13" x2="18" y2="7"/><line x1="15" y1="13" x2="18" y2="13"/><path d="M15 17c0-2 3-2 3-4"/>',
  'type': '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  'quote': '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
  'minus': '<line x1="5" y1="12" x2="19" y2="12"/>',
  'list': '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  'list-ordered': '<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  'smile': '<circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  'tag': '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  'bold': '<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>',
  'italic': '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>',
  'code': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
}

function CmdIcon({ name }: { name: string }) {
  const d = ICON_SVG[name] ?? ICON_SVG['type']
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: d }}
    />
  )
}

export function SlashPalette({ commands, selectedIndex, onSelect, onClose, offsetTop }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const TOP_CLAMP = 8
  const MAX_HEIGHT = 280
  const top = Math.max(TOP_CLAMP, offsetTop)

  if (commands.length === 0) return null

  return (
    <div
      ref={listRef}
      style={{ top, maxHeight: MAX_HEIGHT }}
      className="absolute left-4 z-50 w-64 overflow-y-auto rounded-xl
                 bg-navy/90 backdrop-blur-2xl border border-white/15 shadow-2xl"
    >
      <div className="px-3 pt-2.5 pb-1.5 border-b border-white/8">
        <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-aqua/50">
          Insertar elemento
        </span>
      </div>
      {commands.map((cmd, i) => (
        <button
          key={cmd.id}
          ref={i === selectedIndex ? selectedRef : null}
          onMouseDown={e => { e.preventDefault(); onSelect(cmd) }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer
            ${i === selectedIndex
              ? 'bg-teal/20 text-white'
              : 'text-white/60 hover:bg-white/8 hover:text-white/90'}`}
        >
          <span className={`shrink-0 ${i === selectedIndex ? 'text-aqua' : 'text-white/35'}`}>
            <CmdIcon name={cmd.icon} />
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-xs font-medium leading-tight">{cmd.label}</span>
            <span className="text-[10px] font-mono text-white/35 truncate leading-tight mt-0.5">
              {cmd.description}
            </span>
          </span>
        </button>
      ))}
      <div className="px-3 py-1.5 border-t border-white/8">
        <span className="text-[9px] text-white/25">↑↓ navegar · Enter insertar · Esc cerrar</span>
      </div>
    </div>
  )
}
