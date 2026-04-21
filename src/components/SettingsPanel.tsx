import type { DocSettings } from '../types'

interface Props {
  settings: DocSettings
  onChange: (s: DocSettings) => void
  onClose: () => void
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 w-8 h-5 rounded-full transition-colors cursor-pointer outline-none overflow-hidden"
      style={{ backgroundColor: checked ? '#176B87' : 'rgba(255,255,255,0.2)' }}
    >
      <span
        className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(14px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

function SectionHeader({
  label,
  toggle,
}: {
  label: string
  toggle?: { checked: boolean; onChange: (v: boolean) => void }
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-aqua/60">
        {label}
      </span>
      {toggle && <Toggle checked={toggle.checked} onChange={toggle.onChange} />}
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 mb-2.5">
      <span className="text-[10px] text-white/40">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-white/8 border border-white/12 rounded-lg px-2.5 py-1.5 text-white text-xs
                   outline-none focus:border-aqua/50 transition-colors placeholder:text-white/20
                   ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  const set = <K extends keyof DocSettings>(key: K, value: DocSettings[K]) =>
    onChange({ ...settings, [key]: value })

  return (
    <div className="flex flex-col w-68 shrink-0 h-full
                    bg-navy/85 backdrop-blur-2xl border-l border-white/10
                    shadow-2xl overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0
                      border-b border-white/10 bg-white/3">
        <span className="text-xs font-medium text-white/70 tracking-wide">Configuración</span>
        <button
          onClick={onClose}
          className="text-white/35 hover:text-white/80 transition-colors p-0.5 cursor-pointer"
          aria-label="Cerrar configuración"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-5 p-4 overflow-y-auto">

        {/* ── Tipo de documento ── */}
        <section>
          <SectionHeader label="Tipo de documento" />
          <div className="flex gap-2">
            {(['acta', 'document'] as const).map(t => (
              <button
                key={t}
                onClick={() => set('type', t)}
                className={`flex-1 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer
                  ${settings.type === t
                    ? 'bg-teal/20 border-teal/40 text-teal font-medium'
                    : 'bg-white/5 border-white/10 text-white/45 hover:bg-white/10 hover:text-white/70'}`}
              >
                {t === 'acta' ? 'Acta' : 'Documento'}
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-white/8" />

        {/* ── Encabezado ── */}
        <section>
          <SectionHeader
            label="Encabezado"
            toggle={{ checked: settings.headerEnabled, onChange: v => set('headerEnabled', v) }}
          />
          {settings.headerEnabled && (
            <div className="mt-1">
              <FieldInput
                label="Referencia del documento"
                value={settings.headerProjectRef}
                onChange={v => set('headerProjectRef', v)}
                placeholder="SGRSI-2026-001"
                mono
              />
              <FieldInput
                label="Fecha"
                value={settings.headerDate}
                onChange={v => set('headerDate', v)}
                placeholder="17 de abril de 2026"
              />
            </div>
          )}
        </section>

        <div className="h-px bg-white/8" />

        {/* ── Pie de página ── */}
        <section>
          <SectionHeader label="Pie de página" />
          <FieldInput
            label="Texto izquierdo"
            value={settings.footerLeft}
            onChange={v => set('footerLeft', v)}
            placeholder="SGRSI · Equipo Eternum · uso interno"
          />
          <FieldInput
            label="Texto derecho"
            value={settings.footerRight}
            onChange={v => set('footerRight', v)}
            placeholder="ITI CETP · 2026"
          />
        </section>

        <div className="h-px bg-white/8" />

        {/* ── Marca de agua ── */}
        <section>
          <SectionHeader
            label="Marca de agua"
            toggle={{ checked: settings.watermarkEnabled, onChange: v => set('watermarkEnabled', v) }}
          />
          {settings.watermarkEnabled && (
            <div className="mt-1">
              <FieldInput
                label="Texto"
                value={settings.watermarkText}
                onChange={v => set('watermarkText', v)}
                placeholder="BORRADOR"
                mono
              />
              <div className="flex flex-col gap-1 mb-2.5">
                <span className="text-[10px] text-white/40">
                  Opacidad — {Math.round(settings.watermarkOpacity * 100)}%
                </span>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={Math.round(settings.watermarkOpacity * 100)}
                  onChange={e => set('watermarkOpacity', Number(e.target.value) / 100)}
                  className="w-full accent-teal h-1 cursor-pointer"
                />
              </div>
              {/* Live preview chip */}
              <div className="mt-2 flex items-center justify-center h-10 rounded-lg
                              bg-white/5 border border-white/10 overflow-hidden">
                <span
                  className="font-sans font-bold tracking-[0.2em] uppercase text-sm select-none"
                  style={{ color: `rgba(255,255,255,${settings.watermarkOpacity * 4})` }}
                >
                  {settings.watermarkText || 'BORRADOR'}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
