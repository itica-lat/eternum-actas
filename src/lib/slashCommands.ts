export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  snippet: string;
  icon: string;
  /** Characters from end of snippet where cursor lands */
  cursorOffset?: number;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'h2',
    label: 'Sección',
    description: '## Título de sección',
    snippet: '## ',
    icon: 'heading-2',
  },
  {
    id: 'h3',
    label: 'Etiqueta',
    description: '### LABEL UPPERCASE',
    snippet: '### ',
    icon: 'type',
  },
  {
    id: 'blockquote',
    label: 'Nota / cita',
    description: '> Texto metodológico',
    snippet: '> ',
    icon: 'quote',
  },
  {
    id: 'hr',
    label: 'Separador',
    description: 'Línea divisoria ---',
    snippet: '---',
    icon: 'minus',
  },
  {
    id: 'ul',
    label: 'Lista',
    description: '- Ítem de lista',
    snippet: '- ',
    icon: 'list',
  },
  {
    id: 'ol',
    label: 'Lista numerada',
    description: '1. Ítem ordenado',
    snippet: '1. ',
    icon: 'list-ordered',
  },
  {
    id: 'icon',
    label: 'Ícono Lucide',
    description: ':icon:nombre:',
    snippet: ':icon::',
    icon: 'smile',
    cursorOffset: 1,
  },
  {
    id: 'badge',
    label: 'Badge',
    description: ':badge:texto:',
    snippet: ':badge::',
    icon: 'tag',
    cursorOffset: 1,
  },
  {
    id: 'bold',
    label: 'Negrita',
    description: '**texto en negrita**',
    snippet: '**texto**',
    icon: 'bold',
    cursorOffset: 2,
  },
  {
    id: 'italic',
    label: 'Itálica',
    description: '_texto en itálica_',
    snippet: '_texto_',
    icon: 'italic',
    cursorOffset: 1,
  },
  {
    id: 'code',
    label: 'Código inline',
    description: '`código`',
    snippet: '`código`',
    icon: 'code',
    cursorOffset: 1,
  },
  {
    id: 'refs',
    label: 'Referencias',
    description: 'Bloque de referencias APA',
    snippet: '\n---refs---\n',
    icon: 'book-open',
  },
];

export function filterCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS;
  const q = query.toLowerCase();
  return SLASH_COMMANDS.filter(
    cmd =>
      cmd.id.includes(q) ||
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
  );
}
