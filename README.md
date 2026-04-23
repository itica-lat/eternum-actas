# Eternum Actas

Generador de documentos institucionales para el proyecto SGRSI del ITI CETP. Permite redactar actas y documentos en Markdown con vista previa en tiempo real y exportarlos como HTML o PDF con una tipografía y paleta de colores consistente.

## Caracteristicas

- **Editor Markdown con slash commands** — escribi `/` en el editor para insertar encabezados, listas, bloques de cita, separadores, iconos Lucide y badges sin salir del teclado
- **Vista previa en tiempo real** — renderizada en un iframe aislado con estilos IBM Plex y paleta de colores de marca
- **Exportacion HTML** — genera un archivo `.html` autocontenido listo para archivar o compartir
- **Exportacion PDF** — abre el dialogo de impresion del navegador con estilos de pagina optimizados
- **Plantillas** — guarda el esqueleto del documento (encabezados + referencias) con su configuracion de estilo y reaplicalos en futuros documentos
- **Autoguardado** — persiste el estado del editor en `localStorage`; al reabrir la app se retoma desde donde se dejo
- **Configuracion de documento** — panel lateral para cambiar tipo (acta / documento), referencia, fecha, pie de pagina, marca de agua y colores de marca (con 5 presets incluidos)

## Estructura del proyecto

```
src/
  App.tsx                  — componente raiz, orquesta estado y paneles
  types.ts                 — tipos compartidos (DocSettings, Template, BrandColors)
  components/
    SlashPalette.tsx       — paleta flotante de slash commands
    SettingsPanel.tsx      — panel lateral de configuracion
    TemplatesPanel.tsx     — panel lateral de plantillas
  hooks/
    useSlashCommands.ts    — deteccion e insercion de slash commands
    useExport.ts           — descarga HTML y apertura de PDF
    useFileLoad.ts         — carga de archivos .md desde disco
    useAutoSave.ts         — autoguardado en localStorage
    useTemplates.ts        — CRUD de plantillas en localStorage
  lib/
    markdownParser.ts      — parser Markdown personalizado → HTML
    htmlExporter.ts        — genera el documento HTML final con CSS embebido
    slashCommands.ts       — definicion y filtrado de comandos disponibles
    templateUtils.ts       — extraccion y reconstruccion de plantillas
    lucideIcons.ts         — set de iconos Lucide validos
  constants/
    exampleMarkdown.ts     — documento de ejemplo que carga la app por primera vez
```

## Sintaxis Markdown soportada

| Elemento | Sintaxis |
|---|---|
| Titulo principal | `# Titulo` |
| Subtitulo | `_subtitulo_` (linea inmediata despues del H1) |
| Seccion | `## Seccion` |
| Subseccion | `### Subseccion` |
| Parrafo | texto plano |
| **Negrita** | `**texto**` |
| _Italica_ | `_texto_` |
| `Codigo` | `` `codigo` `` |
| Icono | `:icon:nombre-lucide:` |
| Badge | `:badge:etiqueta:` |
| Cita | `> texto` |
| Lista | `- item` o `* item` |
| Lista numerada | `1. item` |
| Separador | `---` |
| Bloque de referencias | `---refs---` seguido de lineas de texto |

## Desarrollo

```bash
bun install
bun dev
```

```bash
bun run build   # compila TypeScript + empaqueta con Vite
bun run lint    # ESLint
bun run preview # sirve el build de produccion localmente
```

Requiere Node >= 18 o Bun >= 1.0.

## Licencia

© 2026 ITICA. Uso interno del equipo Eternum / proyecto SGRSI, ITI CETP.
