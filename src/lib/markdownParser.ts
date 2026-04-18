import { LUCIDE_ICONS } from './lucideIcons';

export interface ParseResult {
  title: string;
  subtitle: string;
  bodyHtml: string;
  warnings: string[];
  hasTitle: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function processInline(text: string, warnings: string[]): string {
  const combined = /(:icon:[^:]+:)|(:badge:[^:]+:)|(\*\*[^*\n]+\*\*)|(`[^`\n]+`)|(_[^_\n]+_)/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));
    const token = match[0];

    if (token.startsWith(':icon:')) {
      const name = token.slice(6, -1);
      if (!LUCIDE_ICONS.has(name)) {
        warnings.push(`Icono "${name}" no encontrado en Lucide. Omitido.`);
      } else {
        result += `<i data-lucide="${name}" class="icon-inline"></i>`;
      }
    } else if (token.startsWith(':badge:')) {
      const badgeText = token.slice(7, -1);
      result += `<span class="badge">${escapeHtml(badgeText)}</span>`;
    } else if (token.startsWith('**')) {
      result += `<strong>${escapeHtml(token.slice(2, -2))}</strong>`;
    } else if (token.startsWith('`')) {
      result += `<code>${escapeHtml(token.slice(1, -1))}</code>`;
    } else if (token.startsWith('_')) {
      result += `<em>${escapeHtml(token.slice(1, -1))}</em>`;
    }

    lastIndex = match.index + token.length;
  }

  result += escapeHtml(text.slice(lastIndex));
  return result;
}

export function parseMarkdown(markdown: string): ParseResult {
  const srcLines = markdown.split('\n');
  const warnings: string[] = [];
  const blocks: string[] = [];

  let title = '';
  let subtitle = '';
  let hasTitle = false;
  let i = 0;
  let afterH1 = false;

  const hasAnyTitle = srcLines.some(l => /^# .+/.test(l.trim()));
  if (!hasAnyTitle) {
    warnings.push('Error: el documento no tiene título principal (# Título).');
  }

  while (i < srcLines.length) {
    const line = srcLines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      afterH1 = false;
      i++;
      continue;
    }

    // H1
    const h1Match = trimmed.match(/^# (.+)/);
    if (h1Match) {
      title = h1Match[1];
      hasTitle = true;
      afterH1 = true;
      i++;
      continue;
    }

    // Subtitle: first _text_ immediately after H1
    if (afterH1 && /^_[^_]+_$/.test(trimmed)) {
      subtitle = trimmed.slice(1, -1);
      afterH1 = false;
      i++;
      continue;
    }
    afterH1 = false;

    // H2
    const h2Match = trimmed.match(/^## (.+)/);
    if (h2Match) {
      blocks.push(`<h2>${processInline(h2Match[1], warnings)}</h2>`);
      i++;
      continue;
    }

    // H3
    const h3Match = trimmed.match(/^### (.+)/);
    if (h3Match) {
      blocks.push(`<h3>${escapeHtml(h3Match[1])}</h3>`);
      i++;
      continue;
    }

    // Blockquote — collect consecutive > lines
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < srcLines.length && srcLines[i].trim().startsWith('> ')) {
        quoteLines.push(srcLines[i].trim().slice(2));
        i++;
      }
      const inner = quoteLines.map(l => processInline(l, warnings)).join('<br>');
      blocks.push(`<blockquote><p>${inner}</p></blockquote>`);
      continue;
    }

    // Refs block
    if (trimmed === '---refs---') {
      i++;
      const refLines: string[] = [];
      while (i < srcLines.length) {
        const rl = srcLines[i].trim();
        if (rl !== '') refLines.push(rl);
        i++;
      }
      if (refLines.length > 0) {
        const refItems = refLines
          .map(l => `<p>${processInline(l, warnings)}</p>`)
          .join('');
        blocks.push(
          `<div class="ref-block"><h3>Referencias</h3>${refItems}</div>`
        );
      }
      continue;
    }

    // HR
    if (trimmed === '---') {
      blocks.push('<hr>');
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(trimmed)) {
      const items: string[] = [];
      while (i < srcLines.length && /^[-*] /.test(srcLines[i].trim())) {
        items.push(`<li>${processInline(srcLines[i].trim().slice(2), warnings)}</li>`);
        i++;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      while (i < srcLines.length && /^\d+\. /.test(srcLines[i].trim())) {
        const text = srcLines[i].trim().replace(/^\d+\. /, '');
        items.push(`<li>${processInline(text, warnings)}</li>`);
        i++;
      }
      blocks.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Paragraph — collect non-special consecutive lines
    const paraLines: string[] = [];
    while (i < srcLines.length) {
      const l = srcLines[i].trim();
      if (
        l === '' ||
        /^#{1,3} /.test(l) ||
        l.startsWith('> ') ||
        /^[-*] /.test(l) ||
        /^\d+\. /.test(l) ||
        l === '---' ||
        l === '---refs---'
      ) break;
      paraLines.push(l);
      i++;
    }
    if (paraLines.length > 0) {
      const content = paraLines.map(l => processInline(l, warnings)).join('<br>');
      blocks.push(`<p>${content}</p>`);
    }
  }

  return {
    title,
    subtitle,
    bodyHtml: blocks.join('\n'),
    warnings,
    hasTitle,
  };
}
