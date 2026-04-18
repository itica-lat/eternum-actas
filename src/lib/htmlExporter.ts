import type { ParseResult } from './markdownParser'
import type { DocSettings } from '../types'

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const SGRSI_CSS = `
  :root {
    --navy:  #001C30;
    --teal:  #176B87;
    --aqua:  #64CCC5;
    --frost: #DAFFFB;
  }

  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    background: #fff;
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 300;
    font-size: 14px;
    line-height: 1.7;
    color: var(--navy);
    -webkit-font-smoothing: antialiased;
  }

  .page {
    max-width: 760px;
    margin: 0 auto;
    padding: 52px 56px;
    position: relative;
    z-index: 1;
  }

  /* Watermark */
  .watermark {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    user-select: none;
    z-index: 0;
    overflow: hidden;
  }
  .watermark span {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 80px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    transform: rotate(-35deg);
    white-space: nowrap;
  }

  /* Header */
  header {
    margin-bottom: 48px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(0, 28, 48, 0.1);
  }

  .eyebrow {
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 500;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(23, 107, 135, 0.6);
    margin: 0 0 16px;
  }

  h1 {
    font-family: 'IBM Plex Serif', serif;
    font-size: 22pt;
    font-weight: 400;
    color: var(--navy);
    margin: 0 0 8px;
    line-height: 1.25;
  }

  .subtitle {
    font-family: 'IBM Plex Serif', serif;
    font-style: italic;
    color: rgba(0, 28, 48, 0.55);
    font-size: 13px;
    margin: 4px 0 0;
    font-weight: 400;
  }

  .doc-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: rgba(0, 28, 48, 0.45);
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 28, 48, 0.08);
    font-family: 'IBM Plex Sans', sans-serif;
  }

  /* Sections */
  h2 {
    font-family: 'IBM Plex Serif', serif;
    font-size: 15pt;
    font-weight: 400;
    color: var(--teal);
    margin: 40px 0 10px;
    padding-bottom: 7px;
    border-bottom: 1px solid rgba(100, 204, 197, 0.35);
    line-height: 1.3;
  }

  h3 {
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 500;
    font-size: 8pt;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(23, 107, 135, 0.65);
    margin: 28px 0 8px;
  }

  p { margin: 0 0 14px; }

  ul, ol { margin: 0 0 16px; padding-left: 22px; }
  li { margin-bottom: 6px; }

  blockquote {
    border-left: 2px solid var(--aqua);
    background: rgba(218, 255, 251, 0.35);
    margin: 24px 0;
    padding: 14px 20px;
    color: var(--navy);
  }
  blockquote p { margin: 0; font-style: italic; }

  hr {
    border: none;
    border-top: 1px solid rgba(0, 28, 48, 0.1);
    margin: 32px 0;
  }

  code {
    background: rgba(100, 204, 197, 0.18);
    color: var(--teal);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
  }

  strong { font-weight: 500; }

  .badge {
    display: inline-block;
    background: rgba(100, 204, 197, 0.2);
    color: var(--teal);
    padding: 1px 8px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: 'IBM Plex Sans', sans-serif;
    vertical-align: middle;
  }

  .ref-block {
    margin-top: 52px;
    padding-top: 24px;
    border-top: 1px solid rgba(0, 28, 48, 0.1);
  }
  .ref-block h3 { margin-bottom: 16px; }
  .ref-block p { font-size: 11px; line-height: 1.65; margin-bottom: 8px; }

  i[data-lucide] {
    display: inline-block;
    vertical-align: middle;
    position: relative;
    top: -1px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .icon-inline { width: 16px; height: 16px; margin-right: 5px; }
  h2 .icon-inline { width: 18px; height: 18px; stroke: var(--teal); top: -2px; }

  /* Footer */
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 64px;
    padding-top: 16px;
    border-top: 1px solid rgba(0, 28, 48, 0.1);
    font-size: 10.5px;
    color: rgba(0, 28, 48, 0.4);
    font-family: 'IBM Plex Sans', sans-serif;
  }
  .footer-left { display: flex; align-items: center; gap: 5px; }
  .footer-left i[data-lucide] { width: 13px; height: 13px; stroke: rgba(23,107,135,0.5); top: 0; }

  @media print {
    body { font-size: 12px; }
    .page { padding: 16mm 20mm; max-width: none; }
    h2 { page-break-after: avoid; }
    blockquote, ul, ol, .ref-block { page-break-inside: avoid; }
    .watermark { position: fixed; }
  }
`

export function generateHTML(result: ParseResult, settings: DocSettings): string {
  const { title, subtitle, bodyHtml } = result

  const eyebrow = settings.type === 'acta'
    ? 'ACTA · SGRSI · ITI CETP · 2026'
    : 'DOCUMENTO · SGRSI · ITI CETP · 2026'

  const docMeta =
    settings.headerEnabled && (settings.headerProjectRef || settings.headerDate)
      ? `<div class="doc-meta">
           <span>${settings.headerProjectRef ? `Ref: ${esc(settings.headerProjectRef)}` : ''}</span>
           <span>${esc(settings.headerDate)}</span>
         </div>`
      : ''

  const watermark =
    settings.watermarkEnabled && settings.watermarkText
      ? `<div class="watermark">
           <span style="color: rgba(0,28,48,${settings.watermarkOpacity})">${esc(settings.watermarkText)}</span>
         </div>`
      : ''

  const footerLeft  = settings.footerLeft  || 'SGRSI · Equipo Eternum · uso interno'
  const footerRight = settings.footerRight || 'ITI CETP · 2026'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title || 'Documento SGRSI')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@300;400;500&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
  <style>${SGRSI_CSS}</style>
</head>
<body>
  ${watermark}
  <div class="page">
    <header>
      <p class="eyebrow">${eyebrow}</p>
      <h1>${esc(title)}</h1>
      ${subtitle ? `<p class="subtitle">${esc(subtitle)}</p>` : ''}
      ${docMeta}
    </header>
    <main>${bodyHtml}</main>
    <footer>
      <span class="footer-left">
        <i data-lucide="shield" class="icon-inline"></i>
        ${esc(footerLeft)}
      </span>
      <span>${esc(footerRight)}</span>
    </footer>
  </div>
  <script>lucide.createIcons();</script>
</body>
</html>`
}
