# Plan técnico: visual-redesign-technical-brutalist

Rediseño visual completo "Technical Brutalist" sobre `portfolio-v1-landing` ya implementado.
Sin cambios de routing, i18n, lógica de animación ni contenido real (proyectos/experiencia/educación).

Fuentes leídas: `proposal.md`, `design.md` (decisiones 1-10), specs de
`hero-section`, `projects-section`, `tech-stack-section`, `experience-section`,
`education-section`, `contact-section`, `site-layout`, `tasks.md` (50 tareas),
código actual completo, `web_design/DESIGN.md` + `web_design/code.html` (export Stitch,
usado como referencia visual NO versionable — no se copia tal cual).

---

## 0. Prerrequisitos confirmados

- **`Space_Grotesk`**, **`Inter`**, **`JetBrains_Mono`** son exports válidos de
  `next/font/google` en esta versión de Next 16
  (`node_modules/next/dist/compiled/@next/font/dist/google/index.d.ts`):
  - `Space_Grotesk`: `weight?: '300'|'400'|'500'|'600'|'700'|'variable'|Array<...>` — **NO existe '800'**.
    El design.md pide "600/700/800" para display — usar **700** como peso máximo
    (Tailwind `font-bold`). No hay 800 disponible, así que NO se debe pedir
    `weight: ['600','700','800']` o `next/font` lanzará error de validación en build.
  - `Inter`: `weight?: '100'..'900'|'variable'`, soporta `axes: ['opsz']`. Usaremos `400`/`500`.
  - `JetBrains_Mono`: `weight?: '100'..'800'|'variable'`. Usaremos `400`/`500` (y `600` si se
    necesita un mono "bold" en algún label, pero por defecto con 400/500 basta).
- **`lucide-react`**: NO está instalado (`package.json` no lo lista, `node_modules/lucide-react`
  no existe). Es el prerrequisito de la tarea 0.3 — `npm install lucide-react` ANTES de tocar
  `SkillChip.tsx`/`TechStack.tsx`. El plan asume que ya está instalado al llegar a la sección 5.
- `params` en `app/[locale]/page.tsx` sigue siendo `Promise<{ locale: string }>` — no cambia.

---

## 1. `app/globals.css` — reescritura completa de tokens

Sustituir TODO el archivo. Mantener `@import "tailwindcss";` y la estructura
`@theme` + `.dark` + `@layer utilities` + base, pero con los nuevos valores.

```css
@import "tailwindcss";

/* ── Design tokens — Technical Brutalist ── */
@theme {
  /* Typography */
  --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'Geist Mono', monospace;

  /* Colors — light mode (default), adaptado de v1 */
  --color-background:    #f6f9fc;
  --color-surface:       #ffffff;
  --color-surface-hover: #eef3f8;
  --color-border:        #dde6ef;
  --color-text:          #0d1b2a;
  --color-muted:         #4a6580;
  --color-accent:        #0284c7;
  --color-accent-hover:  #0369a1;
  --color-accent-dim:    #e0f2fe;
}

/* Dark mode (canónico) — overrides cuando .dark está en <html> */
.dark {
  --color-background:    #131314;
  --color-surface:       #1c1b1c;
  --color-surface-hover: #242324;
  --color-border:        #2a3438;
  --color-text:          #e5e2e3;
  --color-muted:         #9aacae;
  --color-accent:        #00dce5;
  --color-accent-hover:  #63f7ff;
  --color-accent-dim:    #0d2e30;
}

/* ── Semantic color utilities ── */
@layer utilities {
  .bg-background    { background-color: var(--color-background); }
  .bg-surface       { background-color: var(--color-surface); }
  .bg-surface-hover { background-color: var(--color-surface-hover); }
  .bg-accent-dim    { background-color: var(--color-accent-dim); }
  .text-primary     { color: var(--color-text); }
  .text-muted       { color: var(--color-muted); }
  .text-accent      { color: var(--color-accent); }
  .border-default   { border-color: var(--color-border); }

  .font-display     { font-family: var(--font-display); }
  .font-sans        { font-family: var(--font-sans); }
  .font-mono        { font-family: var(--font-mono); }
}

/* ── Base ── */
html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Notas importantes:**
- `--color-surface-hover` es NUEVO (Decisión 2 del design.md) — usado en el hover de filas de
  proyecto (`ProjectCard`).
- `rounded-none` y `rounded` (= `0.25rem`) son utilidades NATIVAS de Tailwind v4 — no hace
  falta declarar tokens de radius en `@theme`. **Decisión de implementación: usar `rounded`
  (clase Tailwind nativa) para chips y code-blocks, y `rounded-none` explícito en filas,
  bloques de contacto, header, botones, etc.**
- `--font-sans` ahora apunta a Inter (antes Plus Jakarta Sans) — body text.
- `--font-mono` ahora apunta a JetBrains Mono (antes Geist Mono).
- `--font-display` es NUEVO — Space Grotesk, para el nombre del Hero y títulos `Space Grotesk`
  (`h1` del Hero, `h3` de ProjectCard/TimelineItem). Se usa con la clase `font-display`.
- Verificar contraste AA (tarea 1.4): `--color-muted` (`#4a6580` light / `#9aacae` dark) sobre
  `--color-background` y `--color-text` sobre `--color-background` — el agente debe comprobarlo
  con DevTools/axe en el paso E2E (sección 8 del tasks.md). Los valores ya vienen verificados
  en `design.md` (`#4a6580` ~5.1:1 sobre `#f6f9fc`; cian `#00dce5` sobre `#131314` tiene
  contraste muy alto). Dark `--color-muted: #9aacae` sobre `#131314` ≈ 7.8:1 — OK.

---

## 2. `app/layout.tsx` — nuevas fuentes

Sustituir `Plus_Jakarta_Sans` + `Geist_Mono` por `Space_Grotesk` + `Inter` + `JetBrains_Mono`.

```tsx
import type { Metadata } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Miguel Á. Benítez Alguacil — AI Engineer',
  description:
    'Portfolio de Miguel Á. Benítez Alguacil, AI Engineer especializado en GenAI, agentes LLM y desarrollo de producto.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background text-primary min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Notas:**
- `weight: ['500','600','700']` para Space Grotesk — 500 se usa en `headline-md` (título de
  fila de ProjectCard / TimelineItem), 700 para el nombre del Hero (clase `font-bold`; NO usar
  `font-extrabold`/800 porque ese peso no existe en Space Grotesk vía `next/font/google`).
- El `<body>` se mantiene igual que v1 (`bg-background text-primary min-h-screen`, sin clase
  `font-sans` adicional) — `globals.css` ya aplica `font-family: var(--font-sans)` (ahora
  Inter) directamente sobre `body`. Las 3 variables CSS de fuente (`--font-display`,
  `--font-sans`, `--font-mono`) quedan disponibles globalmente vía `className` en `<html>`,
  y los componentes usan las utilidades `.font-display` / `.font-mono` de `globals.css` donde
  corresponda (títulos, labels mono).

---

## 3. `lib/types.ts` — nuevo tipo `SkillCategory`

Añadir al final del archivo (no tocar tipos existentes):

```typescript
export interface Skill {
  name: string
  icon: string
}

export interface SkillCategory {
  id: string
  category: string
  skills: Skill[]
}
```

---

## 4. `content/{es,en}/skills.ts` — contenido nuevo

Tres categorías derivadas del CV/proyectos. Nombres de tecnología NO se traducen (mismo string
en ES/EN); `category` SÍ se traduce. Iconos elegidos de `lucide-react` (nombres PascalCase
estables):

| Tecnología   | Icono lucide-react |
|---|---|
| LangChain    | `Workflow` |
| LangGraph    | `GitGraph` (fallback `Workflow` o `Network` si no existe en la versión instalada) |
| RAG          | `Database` |
| PyTorch      | `Flame` |
| TensorFlow   | `Hexagon` |
| Milvus       | `Boxes` |
| Qdrant       | `Layers` |
| Python       | `Code2` |
| FastAPI      | `Zap` |
| React        | `Atom` |
| TypeScript   | `FileCode2` |
| Next.js      | `Triangle` |
| Docker       | `Container` |
| Git          | `GitBranch` |
| GCP          | `Cloud` |
| Azure        | `CloudCog` (fallback `Cloud` si no existe) |

> Nota: si al instalar `lucide-react` el agente `apply` comprueba (inspeccionando
> `node_modules/lucide-react/dist/lucide-react.d.ts` o haciendo
> `Object.keys(LucideIcons)`) que alguno de estos nombres NO existe en la versión instalada,
> debe sustituirlo por una alternativa razonable. Esto es justo lo que el requirement
> "tecnología sin icono válido" de `tech-stack-section` cubre — el `SkillChip` debe degradar
> con gracia (label sin icono) si el nombre no resuelve, así que un nombre erróneo NO rompe el
> build, solo pierde el icono. Aun así, conviene verificarlo antes de fijar el contenido para
> que la sección se vea completa.

### `content/es/skills.ts`

```typescript
import type { SkillCategory } from '@/lib/types'

export const skills: SkillCategory[] = [
  {
    id: 'ai-data',
    category: 'IA & Datos',
    skills: [
      { name: 'LangChain', icon: 'Workflow' },
      { name: 'LangGraph', icon: 'GitGraph' },
      { name: 'RAG', icon: 'Database' },
      { name: 'PyTorch', icon: 'Flame' },
      { name: 'TensorFlow', icon: 'Hexagon' },
      { name: 'Milvus', icon: 'Boxes' },
      { name: 'Qdrant', icon: 'Layers' },
    ],
  },
  {
    id: 'development',
    category: 'Desarrollo',
    skills: [
      { name: 'Python', icon: 'Code2' },
      { name: 'FastAPI', icon: 'Zap' },
      { name: 'React', icon: 'Atom' },
      { name: 'TypeScript', icon: 'FileCode2' },
      { name: 'Next.js', icon: 'Triangle' },
    ],
  },
  {
    id: 'tools',
    category: 'Herramientas',
    skills: [
      { name: 'Docker', icon: 'Container' },
      { name: 'Git', icon: 'GitBranch' },
      { name: 'GCP', icon: 'Cloud' },
      { name: 'Azure', icon: 'CloudCog' },
    ],
  },
]
```

### `content/en/skills.ts`

Idéntico salvo `category` traducido:

```typescript
import type { SkillCategory } from '@/lib/types'

export const skills: SkillCategory[] = [
  {
    id: 'ai-data',
    category: 'AI & Data',
    skills: [
      { name: 'LangChain', icon: 'Workflow' },
      { name: 'LangGraph', icon: 'GitGraph' },
      { name: 'RAG', icon: 'Database' },
      { name: 'PyTorch', icon: 'Flame' },
      { name: 'TensorFlow', icon: 'Hexagon' },
      { name: 'Milvus', icon: 'Boxes' },
      { name: 'Qdrant', icon: 'Layers' },
    ],
  },
  {
    id: 'development',
    category: 'Development',
    skills: [
      { name: 'Python', icon: 'Code2' },
      { name: 'FastAPI', icon: 'Zap' },
      { name: 'React', icon: 'Atom' },
      { name: 'TypeScript', icon: 'FileCode2' },
      { name: 'Next.js', icon: 'Triangle' },
    ],
  },
  {
    id: 'tools',
    category: 'Tools',
    skills: [
      { name: 'Docker', icon: 'Container' },
      { name: 'Git', icon: 'GitBranch' },
      { name: 'GCP', icon: 'Cloud' },
      { name: 'Azure', icon: 'CloudCog' },
    ],
  },
]
```

---

## 5. `lib/content.ts` — `getSkills(locale)`

Añadir siguiendo el mismo patrón de `getProjects`/`getExperience` (import dinámico):

```typescript
import type { PersonalInfo, Project, ExperienceItem, EducationData, SkillCategory } from './types'

// ... (funciones existentes sin cambios)

export async function getSkills(locale: string): Promise<SkillCategory[]> {
  const mod = await import(`@/content/${locale}/skills`)
  return mod.skills
}
```

Solo dos cambios en `lib/content.ts`: el import de tipos (añadir `SkillCategory`) y la
nueva función al final del archivo.

---

## 6. `messages/{es,en}.json` — diffs exactos

**Decisión de implementación clave**: los títulos de sección en `messages/*.json`
(`sections.projects`, `sections.experience`, etc.) **NO cambian su valor** (siguen siendo
"Proyectos"/"Projects", capitalizados, no uppercase). El `[0X]` y el estilo `uppercase
tracking-widest` se aplican en `SectionHeading.tsx` vía:

- prop `number: string` (literal, p. ej. `"01"`) pasada **hardcodeada desde cada sección**
  (`<SectionHeading number="01" title={t('projects')} />`) — el número de sección es un
  identificador estructural idéntico en ambos idiomas, no un texto traducible (es como un
  `id`/`key`, no contenido).
- clase Tailwind `uppercase tracking-widest` en el `<h2>` interno de `SectionHeading` — así
  `"Proyectos"` se renderiza visualmente como `PROYECTOS` sin tener que cambiar el string
  fuente en `messages/`.

Esto cumple el spec ("la sección SHALL mostrar el identificador `[01]` ... y el título cargado
desde messages") con el mínimo diff posible y sin reinterpretar contenido existente.

### Strings NUEVOS a añadir (4 por idioma)

1. `nav.stack` — label del nuevo enlace de navegación:
   - ES: `"stack": "Stack"`
   - EN: `"stack": "Stack"`

2. `hero.bio_label` — label "BIO" del blockquote del Hero:
   - ES: `"bio_label": "BIO"`
   - EN: `"bio_label": "BIO"`

3. `education.verify` — sustituye el string hardcodeado `"Verificar →"` actualmente
   incrustado en `Education.tsx` línea 64 (bug de v1: aparece "Verificar" incluso en `/en`).
   El rediseño usa `te('verify')` + icono SVG arrow-up-right (en vez de `→` literal):
   - ES: `"verify": "Verificar"`
   - EN: `"verify": "Verify"`

4. `sections.stack` — título de la nueva sección `[02]`:
   - ES: `"stack": "Stack"`
   - EN: `"stack": "Stack"`

### `messages/es.json` — archivo completo resultante

```json
{
  "nav": {
    "hero": "Inicio",
    "projects": "Proyectos",
    "stack": "Stack",
    "experience": "Experiencia",
    "education": "Educación",
    "contact": "Contacto"
  },
  "hero": {
    "cta_projects": "Ver proyectos",
    "cta_contact": "Contacto",
    "bio_label": "BIO"
  },
  "sections": {
    "projects": "Proyectos",
    "projects_subtitle": "Algunos de los proyectos en los que he trabajado",
    "stack": "Stack",
    "experience": "Experiencia",
    "education": "Educación",
    "certifications": "Certificaciones",
    "contact": "Contacto",
    "contact_invite": "¿Tienes un proyecto en mente o quieres hablar sobre IA? Escríbeme."
  },
  "contact": {
    "email_label": "Enviar email",
    "linkedin_label": "LinkedIn",
    "github_label": "GitHub"
  },
  "timeline": {
    "present": "Presente"
  },
  "education": {
    "exchange": "Erasmus",
    "verify": "Verificar"
  },
  "footer": {
    "copyright": "Miguel Á. Benítez Alguacil"
  },
  "theme": {
    "toggle_light": "Cambiar a modo claro",
    "toggle_dark": "Cambiar a modo oscuro"
  },
  "locale": {
    "switch_to_en": "Switch to English",
    "switch_to_es": "Cambiar a Español"
  },
  "project": {
    "view_repo": "Ver repositorio",
    "view_demo": "Ver demo",
    "view_backend": "Backend",
    "view_mod": "Mod"
  }
}
```

### `messages/en.json` — archivo completo resultante

```json
{
  "nav": {
    "hero": "Home",
    "projects": "Projects",
    "stack": "Stack",
    "experience": "Experience",
    "education": "Education",
    "contact": "Contact"
  },
  "hero": {
    "cta_projects": "View projects",
    "cta_contact": "Contact",
    "bio_label": "BIO"
  },
  "sections": {
    "projects": "Projects",
    "projects_subtitle": "Some of the projects I've worked on",
    "stack": "Stack",
    "experience": "Experience",
    "education": "Education",
    "certifications": "Certifications",
    "contact": "Contact",
    "contact_invite": "Have a project in mind or want to talk about AI? Drop me a line."
  },
  "contact": {
    "email_label": "Send email",
    "linkedin_label": "LinkedIn",
    "github_label": "GitHub"
  },
  "timeline": {
    "present": "Present"
  },
  "education": {
    "exchange": "Erasmus",
    "verify": "Verify"
  },
  "footer": {
    "copyright": "Miguel Á. Benítez Alguacil"
  },
  "theme": {
    "toggle_light": "Switch to light mode",
    "toggle_dark": "Switch to dark mode"
  },
  "locale": {
    "switch_to_en": "Switch to English",
    "switch_to_es": "Cambiar a Español"
  },
  "project": {
    "view_repo": "View repository",
    "view_demo": "View demo",
    "view_backend": "Backend",
    "view_mod": "Mod"
  }
}
```

**Resumen del diff real**: en cada archivo se añaden 4 strings nuevos
(`nav.stack`, `hero.bio_label`, `education.verify`, `sections.stack`) y NO se modifica ningún
valor existente.

---

## 7. Componentes UI nuevos

### 7.1 `components/ui/SectionHeading.tsx`

Server Component puro (sin `"use client"`, sin estado). Recibe `number` y `title`, renderiza
`[0X]` en JetBrains Mono + accent, seguido del título en uppercase tracking-widest.

```tsx
interface SectionHeadingProps {
  number: string
  title: string
  className?: string
}

export function SectionHeading({ number, title, className }: SectionHeadingProps) {
  return (
    <div className={`flex items-baseline gap-3 mb-12 ${className ?? ''}`}>
      <span className="font-mono text-accent text-sm md:text-base shrink-0">
        [{number}]
      </span>
      <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base">
        {title}
      </h2>
    </div>
  )
}
```

**Notas:**
- `number` se pasa como literal string (`"01"`..`"05"`) desde cada sección — NO viene de
  `messages/`.
- `title` viene de `t('projects')` etc. (string existente, sin cambios).
- Mantiene la jerarquía semántica `<h2>` para accesibilidad/outline del documento — el spec
  de cada sección espera `getByRole('heading', { level: 2 })` en los tests existentes
  (ver `ProjectsGrid.test.tsx` línea 30). **IMPORTANTE**: como `SectionHeading` es quien
  renderiza el `<h2>` ahora (antes lo hacía cada sección directamente), las secciones que lo
  usen YA NO deben tener su propio `<h2>` — deben delegar en `<SectionHeading number="0X"
  title={t('...')} />`. Esto preserva `getByRole('heading', { level: 2 })` en los tests.
- Tamaño de fuente: `web_design/code.html` usa `text-label-mono` (14px) para el header de
  sección completo (número + título), uppercase, `tracking-widest`. Usamos `text-sm md:text-base`
  como aproximación con Tailwind nativo.

### 7.2 Test Vitest: `components/ui/__tests__/SectionHeading.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SectionHeading } from '../SectionHeading'

describe('SectionHeading', () => {
  it('renders the section number in brackets', () => {
    render(<SectionHeading number="01" title="Proyectos" />)
    expect(screen.getByText('[01]')).toBeInTheDocument()
  })

  it('renders the section title as a level-2 heading', () => {
    render(<SectionHeading number="01" title="Proyectos" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Proyectos')
  })
})
```

---

### 7.3 `components/ui/WireframeBackground.tsx`

Server Component (sin `"use client"`, sin `useEffect` — puramente decorativo, SSR-safe).
SVG inline con líneas/nodos geométricos simples, `stroke="currentColor"` (hereda
`text-accent`), `opacity-10`, `pointer-events-none`, `absolute inset-0`, oculto en modo claro
vía `hidden dark:block` (Tailwind, NO JS condicional → evita mismatch de hidratación, ya que
`.dark` se aplica a `<html>` desde el primer render gracias a `next-themes` + `suppressHydrationWarning`).

```tsx
export function WireframeBackground() {
  return (
    <div
      aria-hidden="true"
      className="hidden dark:block pointer-events-none absolute inset-0 overflow-hidden text-accent"
    >
      <svg
        className="absolute -right-24 -top-24 h-[640px] w-[640px] opacity-10 md:h-[820px] md:w-[820px]"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="1">
          {/* Polígono principal (icosaedro simplificado) */}
          <polygon points="400,80 680,260 580,580 220,580 120,260" />
          <polygon points="400,80 580,580 220,580" />
          <line x1="400" y1="80" x2="400" y2="400" />
          <line x1="120" y1="260" x2="400" y2="400" />
          <line x1="680" y1="260" x2="400" y2="400" />
          <line x1="220" y1="580" x2="400" y2="400" />
          <line x1="580" y1="580" x2="400" y2="400" />

          {/* Líneas de "blueprint" adicionales */}
          <line x1="0" y1="400" x2="800" y2="400" strokeDasharray="4 8" />
          <line x1="400" y1="0" x2="400" y2="800" strokeDasharray="4 8" />
          <circle cx="400" cy="80" r="3" fill="currentColor" stroke="none" />
          <circle cx="680" cy="260" r="3" fill="currentColor" stroke="none" />
          <circle cx="580" cy="580" r="3" fill="currentColor" stroke="none" />
          <circle cx="220" cy="580" r="3" fill="currentColor" stroke="none" />
          <circle cx="120" cy="260" r="3" fill="currentColor" stroke="none" />
          <circle cx="400" cy="400" r="3" fill="currentColor" stroke="none" />
        </g>
      </svg>
    </div>
  )
}
```

**Notas:**
- `text-accent` (utilidad de `globals.css`) aplica `color: var(--color-accent)` al `<div>`
  contenedor; el SVG usa `stroke="currentColor"` y `fill="currentColor"` para heredar ese
  color — así el wireframe usa automáticamente el cian (`#00dce5`) en dark sin hardcodear el
  hex.
- `opacity-10` (Tailwind, ~10%) en el `<svg>` — cumple "opacidad ~0.10" del spec.
- `hidden dark:block` — el contenedor entero no se renderiza (`display:none`) en modo claro;
  en SSR esto es determinista (la clase `dark` en `<html>` se decide por `next-themes` con
  script inline antes de hidratar, y `suppressHydrationWarning` ya está en `<html>` desde v1)
  → no hay mismatch de hidratación porque Tailwind `dark:` se basa en la clase del `<html>`,
  presente en el HTML servido si `next-themes` la añade vía script de bloqueo (patrón
  estándar, ya usado en v1 para el propio ThemeToggle).
- `pointer-events-none` en el contenedor raíz cubre TODO el SVG — cumple el requirement de
  "sin interferencia con interacción".
- Posicionamiento: `absolute inset-0` dentro de un `<section id="hero" className="relative ...">`
  (el Hero debe añadir `relative` y `overflow-hidden` para que el SVG no desborde el viewport).

---

### 7.4 `components/ui/SkillChip.tsx`

Server Component. Recibe `{ name: string; icon: string }`. Resuelve dinámicamente el icono de
`lucide-react` por nombre con fallback si no existe.

**Patrón de lookup dinámico** — `lucide-react` exporta cada icono como named export PascalCase
(p. ej. `import { Workflow, Database } from 'lucide-react'`). Para resolver por nombre de
string en runtime, se importa el namespace completo y se indexa:

```tsx
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SkillChipProps {
  name: string
  icon: string
}

export function SkillChip({ name, icon }: SkillChipProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[icon]

  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-default bg-surface rounded hover:border-accent transition-colors">
      {IconComponent && <IconComponent className="text-accent shrink-0" size={16} aria-hidden />}
      <span className="font-mono text-sm text-primary uppercase">{name}</span>
    </div>
  )
}
```

**Notas:**
- `import * as LucideIcons from 'lucide-react'` importa TODO el paquete como namespace. Esto
  rompe el tree-shaking ideal mencionado en design.md ("imports nombrados por icono"), PERO es
  la única forma de hacer lookup dinámico por string sin un mapa exhaustivo manual. Dado que
  `lucide-react` v0.x exporta funciones de componente livianas (cada una un wrapper SVG
  pequeño) y que Next.js + bundlers modernos (Turbopack/webpack con `optimizePackageImports`)
  pueden seguir aplicando tree-shaking parcial sobre namespace imports cuando el resto del
  módulo no usa el namespace completo en runtime más que para el lookup, el impacto es
  aceptable para una sección "Stack" con ~16 iconos. Riesgo aceptado y documentado en
  design.md (tabla de riesgos: "lucide-react añade peso al bundle de TechStack — Server
  Component, iconos se renderizan a SVG estático sin JS adicional en cliente").
- **Alternativa más explícita (recomendada si el bundle preocupa)**: definir un mapa explícito
  `ICON_MAP: Record<string, LucideIcon>` con SOLO los ~16 iconos usados en
  `content/{es,en}/skills.ts`, importados de forma nombrada:
  ```tsx
  import {
    Workflow, GitGraph, Database, Flame, Hexagon, Boxes, Layers,
    Code2, Zap, Atom, FileCode2, Triangle,
    Container, GitBranch, Cloud, CloudCog,
    type LucideIcon,
  } from 'lucide-react'

  const ICON_MAP: Record<string, LucideIcon> = {
    Workflow, GitGraph, Database, Flame, Hexagon, Boxes, Layers,
    Code2, Zap, Atom, FileCode2, Triangle,
    Container, GitBranch, Cloud, CloudCog,
  }

  export function SkillChip({ name, icon }: SkillChipProps) {
    const IconComponent = ICON_MAP[icon]
    // ... resto igual
  }
  ```
  Esto es 100% tree-shakeable (named imports) y SIGUE cumpliendo "fallback si no existe el
  icono" (si `icon` no es una key de `ICON_MAP`, `IconComponent` es `undefined` y el chip
  renderiza solo el label). **Es el patrón recomendado por este plan** — más explícito,
  type-safe, y evita importar el paquete completo. El desarrollador debe mantener `ICON_MAP`
  sincronizado con los iconos usados en `content/{es,en}/skills.ts` (mismo conjunto en ambos
  locales, así que un solo `ICON_MAP` cubre ambos).
- `aria-hidden` en el icono — el nombre de la tecnología (`name`) ya es el contenido
  accesible/textual del chip.
- `uppercase` en el label de texto replica `web_design/code.html` (labels mono uppercase) y
  el patrón de Badge.

### 7.5 Test Vitest: `components/ui/__tests__/SkillChip.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SkillChip } from '../SkillChip'

describe('SkillChip', () => {
  it('renders the skill name', () => {
    render(<SkillChip name="Python" icon="Code2" />)
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('renders an icon when a valid lucide icon name is given', () => {
    const { container } = render(<SkillChip name="Python" icon="Code2" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders only the label when the icon name is invalid, without crashing', () => {
    const { container } = render(<SkillChip name="Mystery Tech" icon="NotARealIcon" />)
    expect(screen.getByText('Mystery Tech')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })
})
```

---

## 8. Reescritura de componentes UI existentes

### 8.1 `components/ui/Badge.tsx`

Cambios: `rounded` (mantiene, ya era `rounded`), tipografía a `font-mono` explícito (antes
heredaba de `--font-mono` = Geist Mono; ahora `--font-mono` = JetBrains Mono, así que en
realidad NO requiere cambio de clase, pero se añade `uppercase tracking-wide` para reforzar
el lenguaje "label mono uppercase"). Tokens `accent-dim`/`accent` se mantienen (ya existían y
siguen existiendo en los nuevos tokens).

```tsx
interface BadgeProps {
  label: string
  className?: string
}

export function Badge({ label, className }: BadgeProps) {
  return (
    <span
      className={`bg-accent-dim text-accent font-mono text-[0.8125rem] uppercase tracking-wide px-2 py-0.5 rounded ${className ?? ''}`}
    >
      {label}
    </span>
  )
}
```

**Nota**: `Badge` ya NO se usa en `ProjectCard` (la nueva fila de proyecto usa chips de stack
con un estilo ligeramente distinto — ver 8.2). Verificar si `Badge` queda sin consumidores
tras el rediseño de `ProjectCard`; si es así, **NO eliminar el componente** (puede usarse en
futuro o en otra sección), simplemente actualizarlo según arriba para consistencia de tokens.
Revisar también si tiene test propio (`components/ui/__tests__/Badge.test.tsx`) — actualmente
NO existe (confirmado: `components/ui/` solo tiene `AnimatedProjectCard.tsx`, `Badge.tsx`,
`ProjectCard.tsx`, `TimelineItem.tsx`, sin carpeta `__tests__`). No es obligatorio crear un
test nuevo para `Badge` salvo que se quiera cubrir (opcional, no listado en tasks.md).

---

### 8.2 `components/ui/ProjectCard.tsx` — de card a fila horizontal numerada

**Cambio de contrato de props**: se añade `index: number` (o `index: string` ya formateado
"01"/"02") para mostrar el índice numérico de la fila. `AnimatedProjectCard` debe pasarlo.

Estructura objetivo (basada en spec `projects-section` + `web_design/code.html`):
- Contenedor: `<article>` con `border-t border-default` (o `border-b`, ver nota de bordes
  más abajo), grid responsivo: en desktop `md:grid-cols-12 gap-6`, en mobile `flex flex-col`.
- Columna 1 (índice): `01`/`02` en `font-mono text-accent`.
- Columna 2 (título + stack): `<h3>` en `font-display font-medium` (Space Grotesk 500),
  hover → `text-accent` (vía `group-hover:text-accent` en el `<article>` con clase `group`);
  debajo, chips de stack (`SkillChip`-like, pero como NO tienen icono usamos un chip simple
  inline, ver nota).
- Columna 3 (descripción "code-block"): `bg-background` (o `bg-surface` invertido) +
  `shadow-inner` + `rounded` + `p-4` + `font-mono text-sm text-muted`.
- Columna 4 (enlaces ↗): icono SVG `arrow-up-right` por cada enlace (`repoUrl`, `repoUrls[]`,
  `demoUrl`), `text-accent`, `aria-label` con el label correspondiente.
- Hover en `<article>` (clase `group`): `hover:bg-surface-hover` en todo el contenedor, y
  `group-hover:text-accent` en el `<h3>`.

```tsx
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  index: string
  labels: {
    viewRepo: string
    viewBackend: string
    viewMod: string
    viewDemo: string
  }
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  )
}

export function ProjectCard({ project, index, labels }: ProjectCardProps) {
  const links: { label: string; url: string }[] = []
  if (project.repoUrl) links.push({ label: labels.viewRepo, url: project.repoUrl })
  if (project.repoUrls) {
    for (const repo of project.repoUrls) {
      links.push({
        label: repo.label === 'Backend' ? labels.viewBackend : labels.viewMod,
        url: repo.url,
      })
    }
  }
  if (project.demoUrl) links.push({ label: labels.viewDemo, url: project.demoUrl })

  return (
    <article className="group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-8 border-t border-default hover:bg-surface-hover transition-colors px-2 -mx-2">
      <div className="md:col-span-1 font-mono text-accent text-sm">{index}</div>

      <div className="md:col-span-5 flex flex-col gap-3">
        <h3 className="font-display font-medium text-xl text-primary group-hover:text-accent transition-colors">
          {project.name}
        </h3>
        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="font-mono text-xs uppercase tracking-wide text-muted bg-surface border border-default px-2 py-1 rounded"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="md:col-span-5 bg-background shadow-inner rounded p-4 font-mono text-sm text-muted leading-relaxed">
        {project.description}
      </div>

      <div className="md:col-span-1 flex md:flex-col flex-row flex-wrap gap-3 md:items-end items-start">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {link.label}
            <ArrowUpRight />
          </a>
        ))}
      </div>
    </article>
  )
}
```

**Notas:**
- `index` se pasa como string ya formateado (`"01"`, `"02"`, ...) — calculado en
  `AnimatedProjectCard`/`ProjectsGrid` con `String(i + 1).padStart(2, '0')`.
- **Bordes**: el spec pide "borde superior/inferior de 1px entre filas". Usando `border-t` en
  cada `<article>` y dejando que `ProjectsGrid` añada un `border-b` al contenedor general
  (o al último elemento), se consigue el efecto "líneas entre filas + borde de cierre" sin
  doble-borde entre filas consecutivas. Ver sección 10.1 (`ProjectsGrid`) para el wrapper.
- `px-2 -mx-2` permite que el `hover:bg-surface-hover` "sangre" ligeramente fuera del
  contenido para que el fondo invertido cubra el ancho completo de la fila visualmente sin
  desalinear el contenido respecto al resto de la página (truco común para hover full-bleed
  dentro de un contenedor con padding).
- `ArrowUpRight` es un pequeño helper SVG local al archivo (no requiere `lucide-react` —
  mantiene `ProjectCard` independiente de la nueva dependencia, que solo se usa en
  `TechStack`/`SkillChip`). Alternativamente se podría usar `lucide-react`'s `ArrowUpRight`
  ya que la dependencia existirá en el proyecto — **cualquiera de las dos opciones es válida**;
  se documenta el SVG inline para no acoplar `ProjectCard` a `lucide-react` si se prefiere
  mantenerlo aislado, pero usar `import { ArrowUpRight } from 'lucide-react'` es igualmente
  correcto y más simple (recomendado si se quiere reducir código duplicado, dado que
  `lucide-react` ya es dependencia del proyecto tras la tarea 0.3).
- Soporta `repoUrl` Y `repoUrls[]` (Minecraft Butler AI tiene Backend+Mod) — la lógica de
  `links[]` ya cubre ambos casos, igual que el `ProjectCard` original pero unificado en un
  array para renderizar de forma uniforme con icono ↗.
- Responsive (`< 768px`): `grid-cols-1` colapsa todo a columna única en orden: índice → título
  + stack → descripción → enlaces, cumpliendo el spec "manteniendo índice, título, stack,
  descripción y enlace en orden vertical".

---

### 8.3 `components/ui/AnimatedProjectCard.tsx`

Ajuste mínimo: añadir prop `index` y pasarlo a `ProjectCard`. Mantiene
`motion.div variants={staggerItem}`.

```tsx
'use client'
import { motion } from 'framer-motion'
import { staggerItem } from '@/components/animations/StaggerChildren'
import { ProjectCard } from './ProjectCard'
import type { Project } from '@/lib/types'

interface AnimatedProjectCardProps {
  project: Project
  index: string
  labels: {
    viewRepo: string
    viewBackend: string
    viewMod: string
    viewDemo: string
  }
}

export function AnimatedProjectCard({ project, index, labels }: AnimatedProjectCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <ProjectCard project={project} index={index} labels={labels} />
    </motion.div>
  )
}
```

**Nota**: se elimina `className="h-full"` del `motion.div` (era necesario para que las cards
del grid 2-col tuvieran igual altura; en el layout de filas no aplica). El `motion.div` ya no
necesita altura forzada porque cada fila ocupa el ancho completo.

---

### 8.4 `components/ui/TimelineItem.tsx`

Cambios de tokens/tipografía (mismo layout línea+punto, según spec `experience-section`):
- Línea vertical: `border-default` (ya lo era, ahora con el nuevo valor de `--color-border`).
- Punto de hito: `bg-accent` (ya lo era, ahora cian/sky según modo).
- Rol (`item.role`): `font-display` (Space Grotesk) en vez de fuente por defecto.
- Empresa (`item.company`): `text-accent` (ya lo era).
- Fechas: `font-mono` (JetBrains Mono) — antes heredaba `text-sm text-muted` sin mono
  explícito.
- Bullets: `Inter` (ya es el default vía `--font-sans`, sin cambio de clase necesario).

```tsx
import type { ExperienceItem } from '@/lib/types'

interface TimelineItemProps {
  item: ExperienceItem
  presentLabel: string
}

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
}

export function TimelineItem({ item, presentLabel }: TimelineItemProps) {
  const startFormatted = formatDate(item.startDate)
  const endFormatted = item.endDate ? formatDate(item.endDate) : presentLabel

  return (
    <div className="relative pl-6 border-l-2 border-default">
      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[var(--color-accent)]" />
      <div className="mb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h3 className="font-display font-medium text-primary text-[1.0625rem]">{item.role}</h3>
        <span className="font-mono text-xs text-muted shrink-0 uppercase tracking-wide">
          {startFormatted} — {endFormatted}
        </span>
      </div>
      <p className="text-sm font-medium text-accent mb-3">{item.company}</p>
      <ul className="space-y-1.5">
        {item.bullets.map((bullet, i) => (
          <li key={i} className="text-sm text-muted leading-relaxed flex gap-2">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-muted)] shrink-0" />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Nota**: `rounded-full` en el punto de hito y en los bullets se MANTIENE (son círculos
decorativos pequeños, no entran en el lenguaje "rounded-none" de contenedores estructurales —
`design.md` Decisión 3 solo menciona excepciones para chips/code-blocks pero un punto/círculo
de 8px no es un "contenedor" en el sentido brutalist; mantenerlo como círculo es coherente con
`web_design/code.html` que también usa `rounded-full` para los puntos de timeline). El borde
`border-l-2 border-default` también se mantiene sin cambios estructurales.

---

## 9. Componentes de layout restyled

### 9.1 `components/layout/Nav.tsx`

Añadir enlace "STACK" (`#stack`) entre "PROYECTOS" y "EXPERIENCIA". Tipografía
`font-mono uppercase tracking-wide`. Estado activo (`border-b-2 border-accent`) — **el código
actual NO implementa estado activo por scroll** (es un Server Component sin JS de scroll
tracking). El spec `site-layout` pide "Enlace activo según posición de scroll" como
**MODIFIED** requirement, pero la implementación de scroll-spy real (con `IntersectionObserver`
o similar) NO está en el alcance de v1 ni se menciona en `tasks.md` como tarea explícita de
JS nuevo. **Decisión de implementación**: mantener `Nav` como Server Component SIN
scroll-spy (fuera de alcance de este rediseño visual — sería un cambio de comportamiento/JS,
no solo visual, y `tasks.md` no lo incluye como tarea). Documentar esto como limitación
conocida; el spec scenario "enlace activo según scroll" se considera NO implementado en este
cambio (ya era así en v1) y puede ser un cambio futuro. Si en el futuro se quiere implementar,
requeriría convertir `Nav` a Client Component con `useInView`/`IntersectionObserver` por
sección — fuera del alcance de "solo presentación".

```tsx
import { getTranslations } from 'next-intl/server'

const NAV_ITEMS = [
  { key: 'projects', href: '#proyectos' },
  { key: 'stack', href: '#stack' },
  { key: 'experience', href: '#experiencia' },
  { key: 'education', href: '#educacion' },
  { key: 'contact', href: '#contacto' },
] as const

export async function Nav() {
  const t = await getTranslations('nav')

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.key}
          href={item.href}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors"
        >
          {t(item.key)}
        </a>
      ))}
    </nav>
  )
}
```

**Test existente** (`components/layout/__tests__/Nav.test.tsx`): comprueba
`links.length >= 4` y que algún `href` empieza por `#` — con 5 enlaces sigue pasando sin
cambios. No requiere actualización, pero se puede añadir una aserción extra para "STACK" como
mejora opcional (no obligatoria).

---

### 9.2 `components/layout/Header.tsx`

Cambios: `rounded-none` (ya no tenía radius, sin cambio funcional), logo en `font-mono`
(antes heredaba `font-sans`/Plus Jakarta). Tokens `bg-surface`/`border-default` se mantienen
(mismos nombres, nuevos valores via `globals.css`).

```tsx
import { Nav } from './Nav'
import { ThemeToggle } from './ThemeToggle'
import { LocaleToggle } from './LocaleToggle'

export async function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-default">
      <div className="max-w-[1200px] mx-auto px-5 md:px-20 h-16 flex items-center justify-between">
        <a
          href="#hero"
          className="font-mono text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          migue.dev
        </a>
        <div className="flex items-center gap-4">
          <Nav />
          <div className="flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
```

**Notas:**
- `max-w-[1200px]` — actualizado de `1100px` a `1200px` (Decisión 4 design.md: "max-width:
  1200px (vs 1100px en v1)"). Este cambio se replica en TODOS los contenedores `max-w-[1100px]`
  del proyecto (Header, Footer, Hero, ProjectsGrid, Timeline, Education, Contact, TechStack).
- `px-5 md:px-20` — "márgenes 80px desktop / 20px mobile" (Decisión 4): `px-20` = 5rem = 80px,
  `px-5` = 1.25rem = 20px. Sustituye `px-6` (24px) de v1 en TODOS los contenedores de sección.
- `header` ya era efectivamente `rounded-none` (no tenía radius), así que no hay cambio
  visual aquí salvo el logo en mono y el max-width/padding.

---

### 9.3 `components/layout/Footer.tsx`

Cambios: tokens nuevos (`border-default`, `text-muted` ya existían con nuevos valores),
`max-w-[1200px]`, `px-5 md:px-20`, copyright en `font-mono` (consistente con
`web_design/code.html`: `© 2026 MIGUEL ÁNGEL BENÍTEZ ALGUACIL` en `font-label-mono`).

```tsx
import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-default mt-24">
      <div className="max-w-[1200px] mx-auto px-5 md:px-20 py-8 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">
          © {year} {t('copyright')}
        </p>
      </div>
    </footer>
  )
}
```

---

### 9.4 `components/layout/ThemeToggle.tsx`

**Sin cambios de lógica.** Únicamente revisar clases de color/hover si referencian algún
valor obsoleto. Inspección del código actual:

```tsx
className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-accent transition-colors"
```

- `text-muted` / `hover:text-accent` siguen siendo utilidades válidas (apuntan a los nuevos
  tokens automáticamente vía `globals.css`).
- `rounded-lg` (0.5rem) — bajo el lenguaje "rounded-none" estricto, un botón icon-only
  pequeño en el header podría mantenerse `rounded-lg` (es un control interactivo pequeño, no
  un "contenedor estructural"). **Decisión**: cambiar a `rounded-none` para coherencia
  estricta con `design.md` Decisión 3 ("Radius global = 0 para: header, ... botones/CTAs").
  El ThemeToggle es un botón del Header, así que aplica `rounded-none`.

```tsx
className="flex items-center justify-center w-9 h-9 rounded-none text-muted hover:text-accent transition-colors"
```

Solo ese cambio de clase (`rounded-lg` → `rounded-none`). El resto del componente
(`useTheme`, `useEffect`, SVGs, `aria-label`) permanece IDÉNTICO.

---

### 9.5 `components/layout/LocaleToggle.tsx`

**Sin cambios de lógica.** Clase actual:

```tsx
className="flex items-center gap-1 text-sm font-medium text-muted hover:text-accent transition-colors px-2 py-1 rounded"
```

Cambios:
- `text-sm font-medium` → `font-mono text-xs uppercase tracking-wide` (consistencia con Nav/
  labels mono).
- `rounded` → `rounded-none` (mismo razonamiento que ThemeToggle: es un control del Header).
- El `<span className="font-semibold text-accent">{locale.toUpperCase()}</span>` se mantiene
  (ya usa `text-accent`, válido con los nuevos tokens). Opcionalmente cambiar `font-semibold`
  por nada (el mono ya da peso visual) — no crítico.

```tsx
'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale() {
    const next = locale === 'es' ? 'en' : 'es'
    router.replace(pathname, { locale: next })
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors px-2 py-1 rounded-none"
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="text-accent">{locale.toUpperCase()}</span>
      <span className="opacity-40">/</span>
      <span>{locale === 'es' ? 'EN' : 'ES'}</span>
    </button>
  )
}
```

**Tests existentes** (`ThemeToggle.test.tsx`, `LocaleToggle.test.tsx`): comprueban
`getByRole('button')`, `aria-label`, y `getByText(/ES/i)` — ninguna de estas aserciones
depende de clases CSS, por lo que **siguen pasando sin modificación**.

---

## 10. Secciones (`components/sections/`)

Convención común a todas las secciones (excepto Hero, que no lleva `SectionHeading`):
- `max-w-[1200px] mx-auto px-5 md:px-20` (sustituye `max-w-[1100px] ... px-6`).
- `py-24 border-b border-default` en el `<section>` (excepto la última, Contact, que puede
  omitir `border-b` o mantenerlo por consistencia con el footer ya teniendo `border-t`).
- `<SectionHeading number="0X" title={t('...')} />` reemplaza el `<h2>` manual existente.

### 10.1 `components/sections/ProjectsGrid.tsx` — `[01]`, layout de filas

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { AnimatedProjectCard } from '@/components/ui/AnimatedProjectCard'
import type { Project } from '@/lib/types'

interface ProjectsGridProps {
  projects: Project[]
}

export async function ProjectsGrid({ projects }: ProjectsGridProps) {
  const t = await getTranslations('sections')
  const tp = await getTranslations('project')

  const labels = {
    viewRepo: tp('view_repo'),
    viewBackend: tp('view_backend'),
    viewMod: tp('view_mod'),
    viewDemo: tp('view_demo'),
  }

  return (
    <section id="proyectos" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="01" title={t('projects')} />
      <FadeIn delay={0.1}>
        <p className="text-muted text-lg mb-12">{t('projects_subtitle')}</p>
      </FadeIn>
      <StaggerChildren className="flex flex-col border-b border-default">
        {projects.map((project, i) => (
          <AnimatedProjectCard
            key={project.id}
            project={project}
            index={String(i + 1).padStart(2, '0')}
            labels={labels}
          />
        ))}
      </StaggerChildren>
    </section>
  )
}
```

**Notas:**
- `border-b border-default` en el wrapper `StaggerChildren` cierra la última fila (cada
  `ProjectCard` ya aporta `border-t`); el conjunto produce: borde superior de la primera fila
  (de `ProjectCard`), separadores entre filas (border-t de cada fila siguiente), y borde
  inferior de cierre (del wrapper) — exactamente "borde superior/inferior de 1px" por fila +
  cierre de sección.
- El test existente `ProjectsGrid.test.tsx` usa `getByRole('heading', { level: 2 })` —
  `SectionHeading` sigue renderizando un `<h2>`, así que pasa sin cambios. También verifica
  `getByText('Project Alpha')`/`'Project Beta')` — siguen presentes en `ProjectCard` (el
  `project.name` se sigue renderizando). **Mock de `framer-motion` en el test** ya mockea
  `motion.div` como `<div>` — sigue funcionando porque `AnimatedProjectCard` sigue usando
  `motion.div`.
- ⚠️ El test mock de `framer-motion` en `ProjectsGrid.test.tsx` NO incluye
  `useMotionValue`/`useSpring` (sí los incluye el de `Hero.test.tsx`/`Contact.test.tsx`,
  porque usan `MagneticButton`). `ProjectsGrid`/`AnimatedProjectCard`/`ProjectCard` NO usan
  `MagneticButton`, así que esto está bien — no requiere actualizar el mock.

---

### 10.2 `components/sections/TechStack.tsx` — NUEVA sección `[02]`

```tsx
import { getTranslations } from 'next-intl/server'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import { SkillChip } from '@/components/ui/SkillChip'
import type { SkillCategory } from '@/lib/types'

interface TechStackProps {
  skills: SkillCategory[]
}

export async function TechStack({ skills }: TechStackProps) {
  const t = await getTranslations('sections')

  return (
    <section id="stack" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="02" title={t('stack')} />
      <div className="flex flex-col gap-12">
        {skills.map((category) => (
          <div key={category.id} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <h3 className="font-mono uppercase tracking-widest text-sm text-primary">
                {category.category}
              </h3>
              <div className="flex-grow border-t border-default" />
            </div>
            <StaggerChildren className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {category.skills.map((skill) => (
                <SkillChip key={skill.name} name={skill.name} icon={skill.icon} />
              ))}
            </StaggerChildren>
          </div>
        ))}
      </div>
    </section>
  )
}
```

**Notas:**
- `StaggerChildren` envuelve cada grid de chips de UNA categoría (no toda la sección) — así
  cada categoría anima su propia cascada al entrar en viewport, replicando "animación de
  entrada por categoría" del spec.
- `SkillChip` no es `motion`, así que para que `StaggerChildren` anime cada hijo
  individualmente (vía `staggerItem` variants), **`SkillChip` necesitaría ser envuelto en
  `motion.div variants={staggerItem}`** igual que `AnimatedProjectCard` envuelve `ProjectCard`.
  Dos opciones:
  1. Crear un wrapper `AnimatedSkillChip` (Client Component) análogo a
     `AnimatedProjectCard`, que envuelve `<SkillChip>` en `motion.div variants={staggerItem}`.
  2. Hacer que `StaggerChildren` anime el contenedor completo (categoría) sin animar cada
     chip individualmente — más simple, pero pierde el efecto "stagger por chip".

  **Decisión recomendada**: opción 1, crear `components/ui/AnimatedSkillChip.tsx`:
  ```tsx
  'use client'
  import { motion } from 'framer-motion'
  import { staggerItem } from '@/components/animations/StaggerChildren'
  import { SkillChip } from './SkillChip'

  interface AnimatedSkillChipProps {
    name: string
    icon: string
  }

  export function AnimatedSkillChip({ name, icon }: AnimatedSkillChipProps) {
    return (
      <motion.div variants={staggerItem}>
        <SkillChip name={name} icon={icon} />
      </motion.div>
    )
  }
  ```
  Y en `TechStack.tsx`, usar `<AnimatedSkillChip key={skill.name} name={skill.name}
  icon={skill.icon} />` en vez de `<SkillChip>` directamente dentro de `StaggerChildren`.
  Esto NO está listado como archivo separado en `tasks.md`/proposal.md explícitamente, pero
  es necesario para que el requirement "Animación de entrada por categoría... chips de cada
  categoría aparecen con animación escalonada" se cumpla con el wrapper `StaggerChildren`
  existente (que aplica `variants={container}` al contenedor y espera que los HIJOS directos
  tengan `variants={staggerItem}` — de lo contrario los chips aparecerían todos a la vez sin
  el efecto cascada, aunque seguirían apareciendo correctamente con `FadeIn` implícito de
  `StaggerChildren` solo en el contenedor).
  → **Añadir `components/ui/AnimatedSkillChip.tsx` como archivo nuevo adicional** (pequeño,
  mismo patrón que `AnimatedProjectCard`). Actualizar `TechStack.tsx` para usarlo.

---

### 10.3 `components/sections/Hero.tsx`

Estructura final según spec `hero-section` + Decisión 6 design.md:

```tsx
import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { MagneticButton } from '@/components/animations/MagneticButton'
import { WireframeBackground } from '@/components/ui/WireframeBackground'
import type { PersonalInfo } from '@/lib/types'

interface HeroProps {
  personal: PersonalInfo
}

export async function Hero({ personal }: HeroProps) {
  const t = await getTranslations('hero')

  return (
    <section
      id="hero"
      className="relative overflow-hidden min-h-screen flex items-center py-24 md:py-32 border-b border-default"
    >
      <WireframeBackground />
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-5 md:px-20">
        <FadeIn delay={0.1}>
          <p className="font-mono text-muted text-sm uppercase tracking-widest mb-4">
            {personal.title}
          </p>
        </FadeIn>
        <SlideUp delay={0.2}>
          <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] font-bold leading-none tracking-tight text-primary mb-10">
            {personal.name}
          </h1>
        </SlideUp>
        <FadeIn delay={0.4}>
          <blockquote className="flex items-start gap-4 border-l-2 border-accent pl-4 md:pl-6 mb-10 max-w-2xl">
            <span className="font-mono text-accent text-sm shrink-0 mt-1">
              {t('bio_label')}
            </span>
            <p className="text-muted text-lg leading-relaxed">
              {personal.bio}
            </p>
          </blockquote>
        </FadeIn>
        <FadeIn delay={0.5}>
          <div className="flex gap-4 flex-wrap">
            <MagneticButton>
              <a
                href="#proyectos"
                className="inline-flex items-center gap-2 bg-accent text-background font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                {t('cta_projects')}
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 border border-default text-primary font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-surface-hover transition-colors"
              >
                {t('cta_contact')}
              </a>
            </MagneticButton>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
```

**Notas:**
- `bg-accent` no es una utilidad declarada en `globals.css` (solo `bg-background`,
  `bg-surface`, `bg-surface-hover`, `bg-accent-dim` están declaradas). `bg-accent` SÍ
  funciona igualmente porque Tailwind v4 genera automáticamente `bg-{name}` para cualquier
  `--color-{name}` definido en `@theme` — y `--color-accent` SÍ está en `@theme`. Por tanto
  `bg-accent`, `text-background`, `border-accent` (usado en el blockquote) son utilidades
  válidas generadas automáticamente por Tailwind v4 a partir de los tokens `--color-*`
  definidos en `@theme` (esto YA pasaba en v1 con `bg-[var(--color-accent)]` usado de forma
  explícita — con Tailwind v4 + `@theme` no hace falta el `[var(...)]`, basta `bg-accent`).
  **Verificar en build** que `bg-accent`/`border-accent`/`text-background` se generan
  correctamente; si Tailwind v4 no las genera automáticamente para algún token (verificar con
  `npm run build` y class compilation), usar la forma explícita `bg-[var(--color-accent)]`
  como fallback (igual que hacía v1 en CTAs).
- `relative overflow-hidden` en la sección — necesario para que `<WireframeBackground />`
  (`absolute inset-0`) se posicione correctamente y no desborde.
- `border-b border-default` en el Hero — para mantener el patrón "architectural rows" con
  separadores `border-b` entre TODAS las secciones (Decisión 4 design.md), incluido el Hero.
- CTA primario (`bg-accent text-background`): en dark mode esto da fondo cian (`#00dce5`) con
  texto `#131314` (background dark) — alto contraste, correcto. En light mode da fondo azul
  `#0284c7` con texto `#f6f9fc` (background light, casi blanco) — también alto contraste.
  Verificar en E2E que el texto sobre el botón primario es legible en ambos modos
  (`text-background` cambia de valor según `.dark`, así que se adapta automáticamente).
- CTA secundario: `border border-default` + `hover:bg-surface-hover` (antes
  `hover:bg-surface`) — usa el nuevo token `surface-hover`.
- **Tests existentes** (`Hero.test.tsx`): comprueban `getByText('Test User')` (nombre),
  `getByText('Test bio here')` (bio), `getByText('AI Engineer')` (título). Todos estos textos
  se siguen renderizando literalmente — el mock de `framer-motion` ya incluye
  `useMotionValue`/`useSpring` (necesarios por `MagneticButton`). El mock de
  `next-intl/server` (`getTranslations` → `(key) => key`) hará que `t('bio_label')` devuelva
  el string `"bio_label"` literal — esto se renderiza como texto visible junto al blockquote,
  lo cual NO rompe ninguna aserción existente (no se busca ausencia de ese string). **No
  requiere cambios en el test**, pero se podría añadir una aserción opcional
  `expect(screen.getByText('bio_label')).toBeInTheDocument()` para cubrir el nuevo elemento
  (no obligatorio).

---

### 10.4 `components/sections/Timeline.tsx` — `[03]`

```tsx
import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TimelineItem } from '@/components/ui/TimelineItem'
import type { ExperienceItem } from '@/lib/types'

interface TimelineProps {
  experience: ExperienceItem[]
}

export async function Timeline({ experience }: TimelineProps) {
  const t = await getTranslations('sections')
  const tl = await getTranslations('timeline')

  return (
    <section id="experiencia" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="03" title={t('experience')} />
      <div className="space-y-10">
        {experience.map((item, i) => (
          <SlideUp key={item.id} delay={i * 0.08}>
            <TimelineItem item={item} presentLabel={tl('present')} />
          </SlideUp>
        ))}
      </div>
    </section>
  )
}
```

**Notas:**
- Se elimina `bg-surface` de la sección (en v1, `Timeline` tenía `bg-surface` para
  alternar fondo con `ProjectsGrid`). En el nuevo lenguaje "architectural rows" con
  `border-b` consistentes, las secciones comparten `--color-background` y se diferencian
  por los separadores de borde, NO por fondo alterno (excepción: `TechStack` en
  `web_design/code.html` usa `bg-surface-container-lowest`/`dark:bg-background` — pero para
  mantener simplicidad y consistencia, **este plan usa fondo uniforme
  `--color-background` en todas las secciones** salvo donde el spec explícitamente pida
  contraste, lo cual no es el caso de Experiencia/Educación). Si se prefiere alternar fondo
  sutil entre secciones (como v1), se puede añadir `bg-surface` a `Timeline`/`Education` —
  **no es un requirement bloqueante**, es una decisión visual menor que el desarrollador
  puede ajustar libremente sin romper specs.
- Test existente `Timeline.test.tsx`: `getByRole/getAllByText` sobre `'Senior Dev'`/
  `'Junior Dev'` — siguen presentes vía `TimelineItem`. Sin cambios requeridos.

---

### 10.5 `components/sections/Education.tsx` — `[04]`

Cambios: `SectionHeading number="04"`, tokens nuevos, bloques `rounded-none`
(antes `rounded-xl`), enlace "Verificar"/"Verify" con icono ↗ (sustituye `"Verificar →"`
hardcodeado).

```tsx
import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { EducationData } from '@/lib/types'

interface EducationProps {
  data: EducationData
}

function ArrowUpRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  )
}

export async function Education({ data }: EducationProps) {
  const t = await getTranslations('sections')
  const te = await getTranslations('education')

  return (
    <section id="educacion" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="04" title={t('education')} />

      <div className="space-y-6 mb-16">
        {data.degrees.map((degree, i) => (
          <FadeIn key={degree.id} delay={i * 0.1}>
            <div className="bg-surface border border-default rounded-none p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <h3 className="font-display font-medium text-primary text-[1.0625rem]">{degree.degree}</h3>
                <span className="font-mono text-xs uppercase tracking-wide text-muted shrink-0">
                  {degree.startYear} — {degree.endYear ?? '...'}
                </span>
              </div>
              <p className="text-sm font-medium text-accent mb-1">{degree.institution}</p>
              {degree.specialization && (
                <p className="text-sm text-muted">{degree.specialization}</p>
              )}
              {degree.exchange && (
                <p className="text-sm text-muted mt-1">
                  {te('exchange')} · {degree.exchange.institution}, {degree.exchange.city} ({degree.exchange.startYear}–{degree.exchange.endYear})
                </p>
              )}
            </div>
          </FadeIn>
        ))}
      </div>

      <SlideUp>
        <h3 className="font-mono uppercase tracking-widest text-sm text-primary mb-6">{t('certifications')}</h3>
      </SlideUp>
      <div className="space-y-4">
        {data.certifications.map((cert, i) => (
          <FadeIn key={cert.id} delay={i * 0.08}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-default rounded-none p-5">
              <div>
                <p className="text-primary font-medium">{cert.name}</p>
                <p className="font-mono text-xs uppercase tracking-wide text-muted">{cert.issuer} · {cert.year}</p>
              </div>
              {cert.verifyUrl && (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors shrink-0"
                >
                  {te('verify')}
                  <ArrowUpRight />
                </a>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
```

**Notas:**
- `rounded-none` sustituye `rounded-xl` en ambos bloques (degrees y certifications).
- `te('verify')` requiere la nueva key `education.verify` (sección 6) — el test
  `Education.test.tsx` usa el mock `getTranslations: async () => (key: string) => key`, por
  lo que `te('verify')` devuelve `"verify"` literal en tests; esto NO rompe
  `getByText('Test Cert')` ni `getByText('Bachelor CS')` (siguen presentes). Si se quisiera
  testear el enlace "Verificar", el mock de `EducationData` en el test no incluye
  `verifyUrl`, así que el bloque `{cert.verifyUrl && (...)}` no se renderiza en el test
  actual — sin impacto.
- `ArrowUpRight` duplicado aquí y en `ProjectCard.tsx` — considerar extraer a
  `components/ui/Icons.tsx` o usar `lucide-react`'s `ArrowUpRight` en ambos sitios para evitar
  duplicación (recomendado, ya que `lucide-react` estará instalado). Si se usa
  `lucide-react`, importar `import { ArrowUpRight } from 'lucide-react'` y usar
  `<ArrowUpRight size={14} aria-hidden />` directamente — más simple que mantener un SVG
  inline duplicado en 2 archivos.

---

### 10.6 `components/sections/Contact.tsx` — `[05]`

Cambios: `SectionHeading number="05"`, 3 bloques `rounded-none` tipo "panel de control" con
borde `--color-border` (antes `rounded-lg` con `bg-accent`/`border` planos sin "panel").
Mantiene `MagneticButton`, `mailto:`, `target="_blank"` para LinkedIn/GitHub.

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/FadeIn'
import { MagneticButton } from '@/components/animations/MagneticButton'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { PersonalInfo } from '@/lib/types'

interface ContactProps {
  personal: PersonalInfo
}

export async function Contact({ personal }: ContactProps) {
  const t = await getTranslations('sections')
  const tc = await getTranslations('contact')

  return (
    <section id="contacto" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20">
      <SectionHeading number="05" title={t('contact')} />
      <FadeIn delay={0.1}>
        <p className="text-muted text-lg max-w-lg mb-12">{t('contact_invite')}</p>
      </FadeIn>
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MagneticButton className="block">
            <a
              href={`mailto:${personal.email}`}
              aria-label={tc('email_label')}
              className="flex flex-col gap-3 border border-default rounded-none p-6 hover:bg-surface-hover hover:border-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden>
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <span className="font-mono uppercase tracking-wide text-sm text-primary">{tc('email_label')}</span>
            </a>
          </MagneticButton>
          <MagneticButton className="block">
            <a
              href={personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tc('linkedin_label')}
              className="flex flex-col gap-3 border border-default rounded-none p-6 hover:bg-surface-hover hover:border-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden>
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect width="4" height="12" x="2" y="9"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              <span className="font-mono uppercase tracking-wide text-sm text-primary">{tc('linkedin_label')}</span>
            </a>
          </MagneticButton>
          <MagneticButton className="block">
            <a
              href={personal.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tc('github_label')}
              className="flex flex-col gap-3 border border-default rounded-none p-6 hover:bg-surface-hover hover:border-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden>
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                <path d="M9 18c-4.51 2-5-2-7-2"/>
              </svg>
              <span className="font-mono uppercase tracking-wide text-sm text-primary">{tc('github_label')}</span>
            </a>
          </MagneticButton>
        </div>
      </FadeIn>
    </section>
  )
}
```

**Notas:**
- Cambio de layout: de `flex flex-wrap gap-4` con botones pill a `grid grid-cols-1
  sm:grid-cols-3 gap-4` con bloques "panel de control" (icono arriba + label abajo,
  `border-default`, `rounded-none`, `hover:border-accent` + `hover:bg-surface-hover`).
- `MagneticButton className="block"` — el componente `MagneticButton` acepta `className`
  (ver `components/animations/MagneticButton.tsx` línea 11) y lo aplica al `motion.div`
  raíz; `className="block"` asegura que el `motion.div` no colapse su tamaño dentro del
  grid (por defecto un `div` ya es `block`, pero al usarlo dentro de CSS grid conviene
  asegurar que ocupe la celda — `block` es suficiente, no requiere `w-full` extra porque los
  hijos de grid por defecto se estiran a la celda con `display:block`).
- Iconos: se mantienen los mismos SVGs inline de v1 (mail, linkedin, github), solo se les
  añade `className="text-accent"` para colorearlos con el nuevo acento (antes heredaban
  `text-white` del botón con `bg-accent`, que ya no existe en este layout).
- **Sin formulario** (spec "Sin formulario de contacto") — se mantiene, no se añade ningún
  `<input>`/`<form>`.
- Test existente `Contact.test.tsx`: `getByRole('link', { name: /email/i })` con
  `toHaveAttribute('href', 'mailto:test@example.com')` — el `aria-label={tc('email_label')}`
  con el mock `getTranslations` devuelve `"email_label"`, que NO contiene "email" en
  minúsculas... espera, sí contiene "email" (substring `/email/i` hace match contra
  `"email_label"` porque "email" es substring de "email_label", case-insensitive) → **sigue
  pasando**. Igualmente `getAllByRole('link')` + verificación de `linkedin`/`github` en
  `href` — ambos siguen presentes sin cambios. **No requiere actualización del test.**

---

## 11. `app/[locale]/page.tsx` — composición de página

Insertar `<TechStack />` entre `<ProjectsGrid />` y `<Timeline />`, cargando `getSkills(locale)`
en paralelo con el resto.

```tsx
import { getPersonal, getProjects, getExperience, getEducation, getSkills } from '@/lib/content'
import { Hero } from '@/components/sections/Hero'
import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { TechStack } from '@/components/sections/TechStack'
import { Timeline } from '@/components/sections/Timeline'
import { Education } from '@/components/sections/Education'
import { Contact } from '@/components/sections/Contact'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const [personal, projects, experience, educationData, skills] = await Promise.all([
    getPersonal(locale),
    getProjects(locale),
    getExperience(locale),
    getEducation(locale),
    getSkills(locale),
  ])

  return (
    <>
      <Hero personal={personal} />
      <ProjectsGrid projects={projects} />
      <TechStack skills={skills} />
      <Timeline experience={experience} />
      <Education data={educationData} />
      <Contact personal={personal} />
    </>
  )
}
```

**Confirmación Next.js 16**: `params: Promise<{ locale: string }>` + `await params` es el
patrón correcto en esta versión (ya usado en v1, sin cambios — confirmado por el código
existente que ya sigue este patrón). `generateStaticParams` sin cambios.

---

## 12. Estrategia de tests — qué romperá y cómo actualizarlo

### 12.1 Tests que NO requieren cambios (verificado arriba por archivo)

- `components/animations/__tests__/*` — wrappers sin cambios de lógica (Decisión 9
  design.md). NO tocar.
- `components/layout/__tests__/ThemeToggle.test.tsx` — solo verifica `role="button"` +
  `aria-label`. Sin cambios.
- `components/layout/__tests__/LocaleToggle.test.tsx` — solo verifica `role="button"` +
  texto `/ES/i`. Sin cambios.
- `components/layout/__tests__/Nav.test.tsx` — verifica `>= 4` links y algún `href`
  empezando por `#`. Con 5 enlaces (incluyendo "STACK") sigue pasando.
- `components/sections/__tests__/Hero.test.tsx` — verifica nombre/bio/título por texto
  literal. Siguen presentes. El mock de `framer-motion` ya cubre `useMotionValue`/`useSpring`
  (necesarios por `MagneticButton`, que se mantiene).
- `components/sections/__tests__/Timeline.test.tsx` — verifica roles por texto y orden.
  `TimelineItem` sigue renderizando `item.role` igual.
- `components/sections/__tests__/Education.test.tsx` — verifica `degree.degree` y
  `cert.name` por texto. Sin cambios (mock de `EducationData` no incluye `verifyUrl`, así
  que el bloque "Verificar" nuevo no afecta).
- `components/sections/__tests__/Contact.test.tsx` — verifica links por `href`/aria-label
  con regex `/email/i`, `linkedin`, `github`. Sigue pasando (ver análisis 10.6).
- `components/sections/__tests__/ProjectsGrid.test.tsx` — verifica nombres de proyecto y
  `getByRole('heading', { level: 2 })`. `SectionHeading` sigue produciendo un `<h2>`.

### 12.2 Tests NUEVOS a crear (TDD, tasks 3.2/3.5/5.1)

1. `components/ui/__tests__/SectionHeading.test.tsx` — ver sección 7.2 de este plan.
2. `components/ui/__tests__/SkillChip.test.tsx` — ver sección 7.5 de este plan (incluye caso
   de icono inválido → fallback sin romper).
3. `components/sections/__tests__/TechStack.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { SkillCategory } from '@/lib/types'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...p}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
}))

const mockSkills: SkillCategory[] = [
  {
    id: 'ai-data',
    category: 'IA & Datos',
    skills: [
      { name: 'LangChain', icon: 'Workflow' },
      { name: 'Python', icon: 'Code2' },
    ],
  },
  {
    id: 'tools',
    category: 'Herramientas',
    skills: [{ name: 'Docker', icon: 'Container' }],
  },
]

describe('TechStack', () => {
  it('renders all category names', async () => {
    const { TechStack } = await import('../TechStack')
    render(await TechStack({ skills: mockSkills }))
    expect(screen.getByText('IA & Datos')).toBeInTheDocument()
    expect(screen.getByText('Herramientas')).toBeInTheDocument()
  })

  it('renders all skill chips', async () => {
    const { TechStack } = await import('../TechStack')
    render(await TechStack({ skills: mockSkills }))
    expect(screen.getByText('LangChain')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('Docker')).toBeInTheDocument()
  })

  it('renders the section heading with [02]', async () => {
    const { TechStack } = await import('../TechStack')
    render(await TechStack({ skills: mockSkills }))
    expect(screen.getByText('[02]')).toBeInTheDocument()
  })
})
```

> Nota sobre el mock de `framer-motion` en este test: `TechStack` usa `StaggerChildren`
> (`useInView`, `useReducedMotion`) y `AnimatedSkillChip` usa `motion.div` con
> `staggerItem` (no requiere `useMotionValue`/`useSpring`, eso es solo para
> `MagneticButton`). El mock de arriba (igual que `ProjectsGrid.test.tsx`) es suficiente.

4. `components/sections/__tests__/ProjectsGrid.test.tsx` — **revisar/extender** (no
   obligatorio reescribir, pero recomendable) para cubrir el nuevo caso de proyecto con
   `repoUrls` múltiples (Backend/Mod) y verificar que aparecen 2 enlaces ↗ con sus labels.
   Ejemplo de aserción adicional:
   ```tsx
   const mockProjects: Project[] = [
     // ...
     {
       id: 'p3', name: 'Multi Repo Project', description: 'desc', stack: ['Python'],
       featured: true,
       repoUrls: [
         { label: 'Backend', url: 'https://github.com/test/backend' },
         { label: 'Mod', url: 'https://github.com/test/mod' },
       ],
     },
   ]
   // ...
   it('renders a link per repository for multi-repo projects', async () => {
     const { ProjectsGrid } = await import('../ProjectsGrid')
     render(await ProjectsGrid({ projects: mockProjects }))
     const links = screen.getAllByRole('link')
     const hrefs = links.map(l => l.getAttribute('href'))
     expect(hrefs).toContain('https://github.com/test/backend')
     expect(hrefs).toContain('https://github.com/test/mod')
   })
   ```

### 12.3 Componentes UI sin test propio (no obligatorio crear, pero documentado)

- `Badge.tsx`, `ProjectCard.tsx`, `AnimatedProjectCard.tsx`, `TimelineItem.tsx` — NO tienen
  carpeta `__tests__` hoy. `tasks.md` (3.11) pide "actualizar tests existentes ... si
  referencian clases/estructura obsoleta" — como NO existen tests unitarios directos de estos
  componentes (se cubren indirectamente vía `ProjectsGrid.test.tsx`/`Timeline.test.tsx`), no
  hay nada que actualizar salvo lo ya cubierto en 12.1/12.2. Crear tests nuevos para estos
  componentes es OPCIONAL (mejora de cobertura, no bloqueante).

---

## 13. Orden de implementación recomendado

Sigue el "Migration Plan" de `design.md` con el detalle de archivos de este plan. El objetivo
es no romper el build a mitad de camino: primero la base global (tokens/fuentes), luego
tipos/contenido/mensajes (no rompen nada visualmente), luego componentes hoja → contenedores
→ páginas.

1. **Setup**
   - `npm install lucide-react` (prerrequisito 0.3).

2. **Base global** (afecta a todo el sitio simultáneamente — hacerlo en un solo paso atómico)
   - Reescribir `app/globals.css` (sección 1).
   - Reescribir `app/layout.tsx` (sección 2).
   - En este punto: `npm run build` debería seguir funcionando (las clases viejas
     `bg-surface`, `text-muted`, etc. siguen existiendo, solo cambian sus valores de color;
     `font-mono`/`font-sans` ahora apuntan a otras fuentes pero siguen siendo utilidades
     válidas). Los componentes existentes (`Plus_Jakarta_Sans` ya no se importa, pero ningún
     componente referencia `font-sans`/`Plus Jakarta` por nombre directo — usan la utilidad
     `--font-sans` indirectamente vía `body`).

3. **Tipos + contenido + mensajes** (no visual aún, no rompe nada)
   - `lib/types.ts`: añadir `Skill`/`SkillCategory` (sección 3).
   - `content/es/skills.ts`, `content/en/skills.ts` (sección 4).
   - `lib/content.ts`: añadir `getSkills` (sección 5).
   - `messages/es.json`, `messages/en.json`: añadir las 4 keys nuevas (sección 6).
   - `npm run lint && npm run test` deberían seguir en verde (nada las usa todavía).

4. **Componentes UI nuevos** (hoja, sin dependientes aún)
   - `components/ui/SectionHeading.tsx` + test (sección 7.1/7.2).
   - `components/ui/WireframeBackground.tsx` (sección 7.3) — Server Component puro, sin
     consumidores aún.
   - `components/ui/SkillChip.tsx` + test (sección 7.4/7.5) — requiere `lucide-react` ya
     instalado (paso 1).
   - `components/ui/AnimatedSkillChip.tsx` (sección 10.2) — requiere `SkillChip` +
     `staggerItem`.
   - `npm run test` en verde con los 2-3 tests nuevos pasando.

5. **Componentes UI existentes restyled** (hoja → su consumidor inmediato aún no cambia)
   - `components/ui/Badge.tsx` (8.1).
   - `components/ui/TimelineItem.tsx` (8.4).
   - `components/ui/ProjectCard.tsx` — **cambio de contrato** (añade prop `index`) (8.2).
   - `components/ui/AnimatedProjectCard.tsx` — actualizar para pasar `index` (8.3).
   - ⚠️ En este punto, `ProjectsGrid.tsx` (aún no actualizado) llamará a
     `<AnimatedProjectCard project={...} labels={...} />` SIN `index` →
     **error de TypeScript** (`index` es prop requerida). Para evitar romper el build en este
     paso intermedio, **dos opciones**:
     - (a) Hacer `index` una prop OPCIONAL (`index?: string`) con valor por defecto
       `undefined` → `ProjectCard` muestra `''` o `'00'` si no se provee. Luego
       `ProjectsGrid` la provee correctamente en el paso 6. Esto mantiene el build verde en
       todo momento.
     - (b) Hacer los pasos 5 y 6 (`ProjectCard`/`AnimatedProjectCard` + `ProjectsGrid`) en el
       MISMO commit/paso de implementación, sin build intermedio entre ellos.
     **Recomendación**: opción (b) — es más simple y el agente `apply` ejecuta la
     verificación completa al final de cada bloque lógico, no tras cada archivo individual.

6. **Componentes de layout restyled**
   - `components/layout/Nav.tsx` (9.1) — añade enlace Stack (apunta a `#stack`, que aún no
     existe como sección — no rompe nada, es un ancla a una sección que se creará en el paso
     8; un `href="#stack"` sin target existente no produce error, solo no hace scroll).
   - `components/layout/Header.tsx` (9.2).
   - `components/layout/Footer.tsx` (9.3).
   - `components/layout/ThemeToggle.tsx` (9.4) — cambio de una clase.
   - `components/layout/LocaleToggle.tsx` (9.5) — cambio de clases.
   - `npm run test` en verde (tests de Nav/ThemeToggle/LocaleToggle sin cambios necesarios).

7. **Secciones restyled (sin TechStack todavía)**
   - `components/sections/Hero.tsx` (10.3) — usa `WireframeBackground` (ya existe del paso
     4).
   - `components/sections/ProjectsGrid.tsx` (10.1) — usa `SectionHeading` (paso 4) +
     `AnimatedProjectCard` con `index` (paso 5).
   - `components/sections/Timeline.tsx` (10.4).
   - `components/sections/Education.tsx` (10.5) — usa `te('verify')` (mensajes del paso 3).
   - `components/sections/Contact.tsx` (10.6).
   - `npm run lint && npm run test && npm run build` — debería pasar en verde (TODAS las
     secciones existentes actualizadas, `TechStack`/`getSkills` aún no se usan en
     `page.tsx`).

8. **Nueva sección Stack + composición de página**
   - `components/sections/TechStack.tsx` + test (10.2 + 12.2.3) — usa `SectionHeading`,
     `AnimatedSkillChip`, `getSkills` (todo ya existe).
   - `app/[locale]/page.tsx` (sección 11) — añade `getSkills(locale)` + `<TechStack />`.
   - `npm run lint && npm run test && npm run build` — verificación final completa.

9. **Verificación E2E** (sección 8 de `tasks.md`, fuera del alcance de este plan técnico de
   archivos pero a ejecutar por el agente `apply` tras el paso 8).

---

## 14. Resumen de archivos — checklist final

### Nuevos
- `content/es/skills.ts`
- `content/en/skills.ts`
- `components/ui/SectionHeading.tsx`
- `components/ui/__tests__/SectionHeading.test.tsx`
- `components/ui/WireframeBackground.tsx`
- `components/ui/SkillChip.tsx`
- `components/ui/__tests__/SkillChip.test.tsx`
- `components/ui/AnimatedSkillChip.tsx`
- `components/sections/TechStack.tsx`
- `components/sections/__tests__/TechStack.test.tsx`

### Modificados
- `app/globals.css` (reescritura completa)
- `app/layout.tsx` (fuentes)
- `lib/types.ts` (+ `Skill`, `SkillCategory`)
- `lib/content.ts` (+ `getSkills`)
- `messages/es.json` (+4 keys)
- `messages/en.json` (+4 keys)
- `components/ui/Badge.tsx`
- `components/ui/ProjectCard.tsx` (cambio de contrato: + prop `index`)
- `components/ui/AnimatedProjectCard.tsx` (+ prop `index`)
- `components/ui/TimelineItem.tsx`
- `components/layout/Nav.tsx` (+ enlace Stack)
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/layout/ThemeToggle.tsx` (1 clase)
- `components/layout/LocaleToggle.tsx` (clases)
- `components/sections/Hero.tsx`
- `components/sections/ProjectsGrid.tsx`
- `components/sections/Timeline.tsx`
- `components/sections/Education.tsx`
- `components/sections/Contact.tsx`
- `app/[locale]/page.tsx` (+ `TechStack`, `getSkills`)
- `components/sections/__tests__/ProjectsGrid.test.tsx` (extensión recomendada, no obligatoria)
- `package.json` / `package-lock.json` (vía `npm install lucide-react`)

### Sin cambios
- `i18n/`, `proxy.ts`/`middleware.ts`, `lib/content.ts` (funciones existentes salvo adición),
  `content/{es,en}/{personal,projects,experience,education}.ts` (contenido real intacto),
  `components/animations/*` (lógica intacta), `components/layout/SmoothScroll.tsx`,
  todos los tests de `components/animations/__tests__/`, `ThemeToggle.test.tsx`,
  `LocaleToggle.test.tsx`, `Nav.test.tsx`, `Hero.test.tsx`, `Timeline.test.tsx`,
  `Education.test.tsx`, `Contact.test.tsx`.

---

## 15. Verificación final (recordatorio del agente `apply`)

```powershell
npm run lint
npm run test
npm run build
```

Todos deben pasar en verde antes de proceder a E2E (Playwright MCP, sección 8 de
`tasks.md`) y al cierre del cambio (PR vía `gh` + `write-pr-report`, sección 9 de
`tasks.md`).
