# CLAUDE.md — Eternum Actas

## Que es este proyecto

Generador de documentos institucionales (actas y documentos) para el proyecto SGRSI del ITI CETP. Stack: React 19 + TypeScript + Vite + Tailwind CSS v4. Gestor de paquetes: **Bun**.

## Comandos

```bash
bun dev          # servidor de desarrollo (hot reload)
bun run build    # tsc -b && vite build
bun run lint     # eslint
bun run preview  # sirve dist/
```

## Arquitectura

El estado vive todo en `App.tsx`. No hay router ni estado global (Redux, Zustand, etc.). Los hooks en `src/hooks/` encapsulan efectos secundarios; los modulos en `src/lib/` son funciones puras sin dependencias de React.

### Flujo de datos

```
markdown (string) → parseMarkdown() → ParseResult
ParseResult + DocSettings → generateHTML() → fullHTML (string)
fullHTML → <iframe srcDoc> (preview)
fullHTML → descarga / window.print() (export)
```

### Modulos clave

- **`src/lib/markdownParser.ts`** — parser propio, no usa librerias externas. Produce `ParseResult` con `title`, `subtitle`, `bodyHtml`, y `warnings`.
- **`src/lib/htmlExporter.ts`** — genera el HTML final con CSS embebido (IBM Plex + colores de marca). El CSS estatico esta en `STATIC_CSS` como string literal.
- **`src/lib/slashCommands.ts`** — lista de comandos disponibles con `id`, `label`, `icon` y `insert` (texto a insertar). Para agregar un comando nuevo, agregarlo aqui.
- **`src/types.ts`** — fuente de verdad para `DocSettings`, `Template`, `BrandColors` y sus defaults.

### Persistencia

Todo se guarda en `localStorage`. No hay backend.

- `useAutoSave` — guarda `{ markdown, filename, docSettings }` con debounce.
- `useTemplates` — CRUD de plantillas bajo la key `eternum-templates`.

## Convenciones

- Los componentes estan en `src/components/`, los hooks en `src/hooks/`, las librerias puras en `src/lib/`.
- Tailwind v4 con clases utilitarias directamente en JSX. Los colores de marca (`navy`, `teal`, `aqua`, `frost`) se exponen como CSS custom properties (`--color-navy`, etc.) actualizadas en el `useEffect` de `App.tsx` para que Tailwind las tome en tiempo real.
- Los textos de la UI estan en espanol (castellano rioplatense).
- No hay libreria de componentes UI; todo es HTML + Tailwind.
- La React Compiler esta habilitada via `babel-plugin-react-compiler`. No agregar `useMemo`/`useCallback` innecesarios; el compilador los infiere.

## Agregar un slash command

1. Abrir `src/lib/slashCommands.ts`.
2. Agregar un objeto `{ id, label, icon, insert }` al array `SLASH_COMMANDS`.
3. `insert` puede ser una string literal o una funcion `(markdown, cursor) => string`.

## Agregar un preset de colores

1. Abrir `src/types.ts`.
2. Agregar un objeto `{ name, colors }` al array `BRAND_PRESETS`.

## Modificar el HTML exportado

El template HTML completo esta en `src/lib/htmlExporter.ts` en la funcion `generateHTML`. El CSS estatico esta en la constante `STATIC_CSS` del mismo archivo. Los estilos de impresion/PDF estan en el bloque `@media print` al final de `STATIC_CSS`.

## Lo que NO hay (no agregar sin discutir)

- Router / multiples paginas
- Estado global (Redux, Zustand, Context)
- Backend o base de datos
- Tests automatizados
- Internacionalizacion (i18n)
