import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { SLASH_COMMANDS, filterCommands } from '../lib/slashCommands'
import type { SlashCommand } from '../lib/slashCommands'

export interface SlashTrigger {
  query: string
  slashStart: number
  selectedIndex: number
  offsetTop: number
}

interface UseSlashCommandsProps {
  markdown: string
  setMarkdown: (value: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onAction?: (action: string) => void
}

const LINE_HEIGHT   = 22  // matches font-size 12.5px * line-height 1.75
const PADDING_TOP   = 16
const MIN_OFFSET    = 8

function computeOffsetTop(value: string, cursor: number, scrollTop: number): number {
  const lines = value.slice(0, cursor).split('\n').length
  return Math.max(MIN_OFFSET, PADDING_TOP + lines * LINE_HEIGHT - scrollTop)
}

export function useSlashCommands({ markdown, setMarkdown, textareaRef, onAction }: UseSlashCommandsProps) {
  const [slashTrigger, setSlashTrigger] = useState<SlashTrigger | null>(null)
  const pendingCursorRef = useRef<number | null>(null)

  // Restore cursor position after markdown state update caused by slash insertion
  useEffect(() => {
    if (pendingCursorRef.current === null || !textareaRef.current) return
    const pos = pendingCursorRef.current
    textareaRef.current.setSelectionRange(pos, pos)
    pendingCursorRef.current = null
  }, [markdown, textareaRef])

  const detectSlash = useCallback((value: string, cursor: number) => {
    const textBefore = value.slice(0, cursor)
    const match = textBefore.match(/(?:^|\n| )\/(\w*)$/)
    if (!match) { setSlashTrigger(null); return }

    const slashPos = textBefore.lastIndexOf('/')
    const query    = match[1].toLowerCase()
    const scrollTop = textareaRef.current?.scrollTop ?? 0

    setSlashTrigger(prev => ({
      query,
      slashStart: slashPos,
      selectedIndex: prev?.slashStart === slashPos ? prev.selectedIndex : 0,
      offsetTop: computeOffsetTop(value, cursor, scrollTop),
    }))
  }, [textareaRef])

  const closeSlash = useCallback(() => setSlashTrigger(null), [])

  const filteredCommands = useMemo(
    () => slashTrigger ? filterCommands(slashTrigger.query) : SLASH_COMMANDS,
    [slashTrigger]
  )

  const insertSlashCommand = useCallback((cmd: SlashCommand) => {
    if (!slashTrigger || !textareaRef.current) return
    const cursor = textareaRef.current.selectionStart
    const before = markdown.slice(0, slashTrigger.slashStart)
    const after  = markdown.slice(cursor)

    if (cmd.action) {
      setMarkdown(before + after)
      setSlashTrigger(null)
      onAction?.(cmd.action)
      return
    }

    const newCursor = slashTrigger.slashStart + cmd.snippet.length - (cmd.cursorOffset ?? 0)
    pendingCursorRef.current = newCursor
    setMarkdown(before + cmd.snippet + after)
    setSlashTrigger(null)
  }, [markdown, slashTrigger, textareaRef, setMarkdown, onAction])

  const handleSlashKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashTrigger) return
    const len = filteredCommands.length
    if (len === 0) return

    const navigate = (delta: number) =>
      setSlashTrigger(p => p ? { ...p, selectedIndex: (p.selectedIndex + delta + len) % len } : null)

    const keyHandlers: Partial<Record<string, () => void>> = {
      ArrowDown: () => navigate(+1),
      ArrowUp:   () => navigate(-1),
      Enter:     () => insertSlashCommand(filteredCommands[slashTrigger.selectedIndex]),
      Tab:       () => insertSlashCommand(filteredCommands[slashTrigger.selectedIndex]),
      Escape:    () => setSlashTrigger(null),
    }

    const handler = keyHandlers[e.key]
    if (handler) { e.preventDefault(); handler() }
  }, [slashTrigger, filteredCommands, insertSlashCommand])

  return { slashTrigger, detectSlash, closeSlash, insertSlashCommand, filteredCommands, handleSlashKeyDown }
}
