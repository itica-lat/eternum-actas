import { useEffect, useRef } from 'react'

interface Props {
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ message, confirmLabel, cancelLabel = 'Cancelar', onConfirm, onCancel }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-navy/95 border border-white/15 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <p className="text-white/85 text-sm leading-relaxed mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs bg-white/8 border border-white/15
                       text-white/70 hover:bg-white/14 hover:text-white transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-md text-xs bg-teal text-white font-medium
                       hover:bg-teal/80 transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
