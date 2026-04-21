import type { DocSettings, Template } from '../types'

const REFS_MARKER = '---refs---'

/** Extract heading lines (H1 / H2 / H3) from markdown */
export function extractSections(markdown: string): string[] {
  return markdown
    .split('\n')
    .filter(line => /^#{1,3} .+/.test(line.trim()))
}

/** Extract the refs block (from ---refs--- to end of string), or empty string */
export function extractRefs(markdown: string): string {
  const idx = markdown.indexOf(REFS_MARKER)
  return idx === -1 ? '' : markdown.slice(idx).trim()
}

/** Build a markdown skeleton from a template (sections + refs) */
export function buildMarkdownFromTemplate(template: Template): string {
  const body = template.sections.join('\n\n')
  return template.refs ? `${body}\n\n${template.refs}` : body
}

/** Create a new Template value from the current editor state */
export function createTemplate(
  name: string,
  markdown: string,
  docSettings: DocSettings,
): Template {
  return {
    id: `tpl_${Date.now()}`,
    name: name.trim() || 'Sin nombre',
    createdAt: new Date().toISOString(),
    docSettings,
    sections: extractSections(markdown),
    refs: extractRefs(markdown),
  }
}
