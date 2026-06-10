# Plan técnico — portfolio-v1-landing

Agente: developer  
Fecha: 2026-06-09  
Cambio: `portfolio-v1-landing`

---

## Estado del proyecto antes de implementar

- `app/layout.tsx` — existe, usa Geist + Geist_Mono. Debe reemplazarse completamente.
- `app/page.tsx` — existe con scaffolding de Next.js. Debe eliminarse (la landing vive en `app/[locale]/page.tsx`).
- `app/globals.css` — existe con tokens Tailwind v4 básicos. Debe reescribirse.
- `next.config.ts` — vacío. Debe configurarse con el plugin de next-intl.
- `messages/`, `content/`, `lib/`, `i18n.ts`, `middleware.ts` — NO existen. Deben crearse.
- `components/` — NO existe. Crear todas las carpetas y archivos.

Dependencias ya instaladas: `framer-motion@^12`, `lenis@^1`, `next-intl@^4`, `next@16.2.7`.  
Dependencias a instalar: `next-themes`, `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`.

---

## Detalles críticos de Next.js 16 y el stack

### `params` es una Promise en Next.js 16

En Next.js 16 (App Router) los props `params` y `searchParams` de layouts y páginas son `Promise<...>`. Deben awaitearse:

```tsx
// CORRECTO en Next.js 16
export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>
  children: React.ReactNode
}) {
  const { locale } = await params
  // ...
}
```

### `next/font/google` — fuentes variables vs. con pesos explícitos

Plus Jakarta Sans NO es variable font — hay que especificar pesos explícitamente como array.  
Geist Mono SÍ es variable, pero de igual forma es más seguro especificar pesos.

```tsx
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})
```

El nombre de importación en `next/font/google` usa guiones bajos en lugar de espacios.  
`Plus Jakarta Sans` → `Plus_Jakarta_Sans`.

### `ThemeProvider` de next-themes — anti-FOUC

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

<html suppressHydrationWarning>  // OBLIGATORIO para evitar hydration mismatch de clase dark
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  </body>
</html>
```

`suppressHydrationWarning` va en `<html>`, NO en `<body>`.

### Lenis en App Router — Client Component

Lenis usa `window` y `requestAnimationFrame`, que no existen en SSR. Debe inicializarse dentro de un `useEffect` en un Client Component, y destruido en el cleanup:

```tsx
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis()
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    const id = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
    }
  }, [])
  return <>{children}</>
}
```

### next-intl v4 — patrón correcto

next-intl v4 usa `defineRouting` + `getRequestConfig` (en `i18n/request.ts`) + `createNextIntlPlugin` en `next.config.ts`.

La carpeta de configuración es `i18n/request.ts` (NO `i18n.ts` en la raíz, aunque funciona también).  
El plugin de next-intl DEBE envolverse en `next.config.ts`.

Para `localePrefix: 'as-needed'`: el locale por defecto (`es`) NO lleva prefijo en la URL. La URL `/` renderiza el locale `es`. La URL `/en` renderiza el locale `en`.

`generateStaticParams` en `app/[locale]/page.tsx` devuelve ambos locales:
```tsx
export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}
```

### Tailwind CSS v4 — `@theme` sin `tailwind.config.js`

En Tailwind v4 NO existe `tailwind.config.js`. Los tokens se definen directamente en `globals.css` con el bloque `@theme`. Las clases se generan automáticamente a partir de los tokens definidos.

El bloque `@theme` define los valores por defecto (light). Las sobreescrituras dark se hacen con la clase `.dark { ... }` en CSS estándar (no con `@theme`):

```css
@import "tailwindcss";

@theme {
  --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  --color-background: #f6f9fc;
  --color-surface:    #ffffff;
  /* ... resto de tokens light */
}

.dark {
  --color-background: #080c10;
  --color-surface:    #0e1520;
  /* ... tokens dark */
}
```

En los componentes se usan como `bg-[var(--color-background)]` o, si se crean utilidades custom:

```css
@layer utilities {
  .bg-background { background-color: var(--color-background); }
  .bg-surface    { background-color: var(--color-surface); }
  .text-primary  { color: var(--color-text); }
  .text-muted    { color: var(--color-text-muted); }
  .text-accent   { color: var(--color-accent); }
  .border-default { border-color: var(--color-border); }
}
```

Esto permite usar `className="bg-background"` en lugar de `className="bg-[var(--color-background)]"`.

### Framer Motion v12 — patrón Server/Client

Las secciones (`components/sections/`) son Server Components. Los wrappers de animación (`components/animations/`) son Client Components. El patrón es:

```tsx
// components/sections/Hero.tsx — Server Component (sin 'use client')
import { SlideUp } from '@/components/animations/SlideUp'
import { MagneticButton } from '@/components/animations/MagneticButton'

export function Hero({ personal }: { personal: PersonalInfo }) {
  return (
    <section id="hero">
      <SlideUp>
        <h1>{personal.name}</h1>
      </SlideUp>
      <MagneticButton>
        <a href="#proyectos">Ver proyectos</a>
      </MagneticButton>
    </section>
  )
}
```

```tsx
// components/animations/SlideUp.tsx — Client Component
'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function SlideUp({ children }: { children: React.ReactNode }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  // ...
}
```

### `useInView` de Framer Motion — `once: true` obligatorio

Para que las animaciones de entrada NO se repitan al hacer scroll de vuelta, usar siempre `{ once: true }`.

### `prefers-reduced-motion` — patrón correcto

```tsx
'use client'
import { useReducedMotion } from 'framer-motion'

export function FadeIn({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion()
  // Si prefersReduced es true, no animar
}
```

---

## Interfaces TypeScript — `lib/types.ts`

```typescript
// lib/types.ts

export interface PersonalInfo {
  name: string           // "Miguel Á. Benítez Alguacil"
  title: string          // "AI Engineer | GenAI, Agentes y Desarrollo de Producto"
  bio: string            // párrafo de presentación
  email: string          // "miguealguacil@gmail.com"
  linkedin: string       // URL completa
  github: string         // URL completa
  location: string       // "Granada, España" / "Granada, Spain"
}

export interface Project {
  id: string             // slug único, igual en ES y EN
  name: string
  description: string
  stack: string[]        // tecnologías — NO se traducen
  repoUrl?: string       // URL del repositorio principal
  repoUrls?: { label: string; url: string }[]  // múltiples repos (Minecraft Butler AI)
  demoUrl?: string
  featured: boolean
}

export interface ExperienceItem {
  id: string
  role: string           // título del rol (se traduce)
  company: string        // nombre de empresa (NO se traduce)
  startDate: string      // "YYYY-MM" formato ISO parcial, ej. "2024-12"
  endDate: string | null // null = posición actual
  location: string
  bullets: string[]      // logros/responsabilidades (se traducen)
}

export interface EducationItem {
  id: string
  degree: string         // nombre de la titulación (se traduce)
  institution: string    // nombre institución (NO se traduce)
  startYear: number
  endYear: number | null // null = en curso
  specialization?: string  // "Ciencia de Datos y Tecnologías Inteligentes"
  exchange?: {
    institution: string
    city: string
    country: string
    startYear: number
    endYear: number
  }
}

export interface Certification {
  id: string
  name: string           // nombre del certificado (se traduce si aplica)
  issuer: string         // "NVIDIA DLI"
  year: number
  credentialId?: string
  verifyUrl?: string
}

export interface EducationData {
  degrees: EducationItem[]
  certifications: Certification[]
}
```

---

## Archivos a crear — orden de implementación

El orden minimiza dependencias rotas. Implementar en este orden:

### Fase 0 — Instalación de dependencias

```powershell
npm install next-themes
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

### Fase 1 — Configuración base

**1. `vitest.config.ts`** (crear en raíz)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

**2. `vitest.setup.ts`** (crear en raíz)

```typescript
import '@testing-library/jest-dom'
```

Nota: instalar también `@testing-library/jest-dom` para los matchers como `toBeInTheDocument`.

**3. `package.json`** — añadir script `test`:

```json
"scripts": {
  "test": "vitest run"
}
```

**4. `i18n/request.ts`** (crear carpeta `i18n/`)

Este archivo define el routing y la carga de mensajes para next-intl v4.

```typescript
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'es' | 'en')) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

**5. `i18n/routing.ts`** (en la misma carpeta)

```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
})
```

**6. `middleware.ts`** (en raíz)

```typescript
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
```

**7. `next.config.ts`** (modificar)

```typescript
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
```

### Fase 2 — Tipos y helpers

**8. `lib/types.ts`** — interfaces completas (ver sección anterior)

**9. `lib/content.ts`** — helpers tipados

```typescript
import type { PersonalInfo, Project, ExperienceItem, EducationData } from './types'

export async function getPersonal(locale: string): Promise<PersonalInfo> {
  const mod = await import(`@/content/${locale}/personal`)
  return mod.personal
}

export async function getProjects(locale: string): Promise<Project[]> {
  const mod = await import(`@/content/${locale}/projects`)
  return mod.projects
}

export async function getExperience(locale: string): Promise<ExperienceItem[]> {
  const mod = await import(`@/content/${locale}/experience`)
  return mod.experience
}

export async function getEducation(locale: string): Promise<EducationData> {
  const mod = await import(`@/content/${locale}/education`)
  return mod.educationData
}
```

Nota: los imports dinámicos son síncronos en el servidor de Next.js (los módulos TypeScript se precompilan). Usar `async/await` igualmente para consistencia con el patrón.

### Fase 3 — Contenido

**10. `messages/es.json`**

```json
{
  "nav": {
    "hero": "Inicio",
    "projects": "Proyectos",
    "experience": "Experiencia",
    "education": "Educación",
    "contact": "Contacto"
  },
  "hero": {
    "cta_projects": "Ver proyectos",
    "cta_contact": "Contacto"
  },
  "sections": {
    "projects": "Proyectos",
    "projects_subtitle": "Algunos de los proyectos en los que he trabajado",
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
    "exchange": "Erasmus"
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

**11. `messages/en.json`**

```json
{
  "nav": {
    "hero": "Home",
    "projects": "Projects",
    "experience": "Experience",
    "education": "Education",
    "contact": "Contact"
  },
  "hero": {
    "cta_projects": "View projects",
    "cta_contact": "Contact"
  },
  "sections": {
    "projects": "Projects",
    "projects_subtitle": "Some of the projects I've worked on",
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
    "exchange": "Erasmus"
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

**12. `content/es/personal.ts`**

```typescript
import type { PersonalInfo } from '@/lib/types'

export const personal: PersonalInfo = {
  name: 'Miguel Á. Benítez Alguacil',
  title: 'AI Engineer | GenAI, Agentes y Desarrollo de Producto',
  bio: 'Data Scientist con perfil de ingeniería, especializado en GenAI y desarrollo de producto. Desarrollo agentes LLM con LangChain/LangGraph e integro IA en productos reales con FastAPI + React.',
  email: 'miguealguacil@gmail.com',
  linkedin: 'https://www.linkedin.com/in/miguealguacil/',
  github: 'https://github.com/migue0418',
  location: 'Granada, España',
}
```

**13. `content/en/personal.ts`**

```typescript
import type { PersonalInfo } from '@/lib/types'

export const personal: PersonalInfo = {
  name: 'Miguel Á. Benítez Alguacil',
  title: 'AI Engineer | GenAI, Agents & Product Development',
  bio: 'Data Scientist with an engineering profile, specialized in GenAI and product development. I build LLM agents with LangChain/LangGraph and integrate AI into real products using FastAPI + React.',
  email: 'miguealguacil@gmail.com',
  linkedin: 'https://www.linkedin.com/in/miguealguacil/',
  github: 'https://github.com/migue0418',
  location: 'Granada, Spain',
}
```

**14. `content/es/projects.ts`**

```typescript
import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'Agente LLM integrado en Minecraft a través de un mod personalizado. El backend gestiona el contexto del juego en tiempo real mediante WebSocket y ejecuta acciones dentro del mundo mediante LangGraph.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
  },
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Plantilla full stack con SDD y buenas prácticas de desarrollo. Incluye pre-commit hooks, Git Flow, Docker y estructura modular para proyectos de producción.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
  },
]
```

**15. `content/en/projects.ts`**

```typescript
import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'LLM agent integrated into Minecraft through a custom mod. The backend manages in-game context in real time via WebSocket and executes actions inside the world using LangGraph.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
  },
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Full stack template with SDD and development best practices. Includes pre-commit hooks, Git Flow, Docker, and modular structure for production projects.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
  },
]
```

**16. `content/es/experience.ts`**

```typescript
import type { ExperienceItem } from '@/lib/types'

export const experience: ExperienceItem[] = [
  {
    id: 'gpu-solutions',
    role: 'Data Scientist & AI Engineer',
    company: 'GPU Solutions (BIAI Technology)',
    startDate: '2024-12',
    endDate: '2026-04',
    location: 'Granada, España',
    bullets: [
      'Diseño y desarrollo de agentes LLM con LangChain y LangGraph (arquitectura multiagente)',
      'Desarrollo desde cero con Python (FastAPI) + ReactJS, aplicando buenas prácticas (pre-commit, Git Flow)',
      'Pipelines RAG con Milvus y Qdrant',
      'Monitorización con logging estructurado y dashboards',
    ],
  },
  {
    id: 'educa-lead',
    role: 'Technical Lead (Proyectos de IA)',
    company: 'Educa Edtech Group',
    startDate: '2023-10',
    endDate: '2024-11',
    location: 'Granada, España',
    bullets: [
      'Liderazgo de equipo multidisciplinario de software y datos',
      'Implementación de metodologías ágiles',
      'Base de datos centralizada MySQL/BigQuery + pipelines ETL en Python',
    ],
  },
  {
    id: 'educa-ds',
    role: 'Junior Data Scientist',
    company: 'Educa Edtech Group',
    startDate: '2022-08',
    endDate: '2023-10',
    location: 'Granada, España',
    bullets: [
      'Proyecto de traducción automática con NLP',
      'Plataforma centralizada con IA para gestión de contenidos',
      'Sistema sincronizador de productos entre bases de datos',
    ],
  },
  {
    id: 'educa-dev',
    role: 'Junior Software Developer',
    company: 'Educa Edtech Group',
    startDate: '2022-05',
    endDate: '2022-08',
    location: 'Granada, España',
    bullets: [
      'Diseño de bases de datos SQL',
      'APIs en Python (FastAPI)',
      'Desarrollo PHP (Laravel, Phalcon) + CRM',
    ],
  },
  {
    id: 'ceprud',
    role: 'Prácticas - Área Web',
    company: 'CEPRUD (Universidad de Granada)',
    startDate: '2021-03',
    endDate: '2021-10',
    location: 'Granada, España',
    bullets: [
      'Desarrollo y mantenimiento con CMS WordPress y Drupal',
    ],
  },
]
```

**17. `content/en/experience.ts`**

```typescript
import type { ExperienceItem } from '@/lib/types'

export const experience: ExperienceItem[] = [
  {
    id: 'gpu-solutions',
    role: 'Data Scientist & AI Engineer',
    company: 'GPU Solutions (BIAI Technology)',
    startDate: '2024-12',
    endDate: '2026-04',
    location: 'Granada, Spain',
    bullets: [
      'Design and development of LLM agents with LangChain and LangGraph (multi-agent architecture)',
      'Full-stack development with Python (FastAPI) + ReactJS, applying best practices (pre-commit, Git Flow)',
      'RAG pipelines with Milvus and Qdrant',
      'Monitoring with structured logging and dashboards',
    ],
  },
  {
    id: 'educa-lead',
    role: 'Technical Lead (AI Projects)',
    company: 'Educa Edtech Group',
    startDate: '2023-10',
    endDate: '2024-11',
    location: 'Granada, Spain',
    bullets: [
      'Leadership of a multidisciplinary software and data team',
      'Implementation of agile methodologies',
      'Centralized MySQL/BigQuery database + Python ETL pipelines',
    ],
  },
  {
    id: 'educa-ds',
    role: 'Junior Data Scientist',
    company: 'Educa Edtech Group',
    startDate: '2022-08',
    endDate: '2023-10',
    location: 'Granada, Spain',
    bullets: [
      'Automatic translation project using NLP',
      'Centralized AI-powered platform for content management',
      'Product synchronizer system between databases',
    ],
  },
  {
    id: 'educa-dev',
    role: 'Junior Software Developer',
    company: 'Educa Edtech Group',
    startDate: '2022-05',
    endDate: '2022-08',
    location: 'Granada, Spain',
    bullets: [
      'SQL database design',
      'APIs in Python (FastAPI)',
      'PHP development (Laravel, Phalcon) + CRM',
    ],
  },
  {
    id: 'ceprud',
    role: 'Internship - Web Area',
    company: 'CEPRUD (Universidad de Granada)',
    startDate: '2021-03',
    endDate: '2021-10',
    location: 'Granada, Spain',
    bullets: [
      'Development and maintenance with WordPress and Drupal CMS',
    ],
  },
]
```

**18. `content/es/education.ts`**

```typescript
import type { EducationData } from '@/lib/types'

export const educationData: EducationData = {
  degrees: [
    {
      id: 'master-ugr',
      degree: 'Máster Universitario en Ciencia de Datos e Ingeniería de Computadores',
      institution: 'Universidad de Granada',
      startYear: 2023,
      endYear: 2025,
      specialization: 'Ciencia de Datos y Tecnologías Inteligentes',
    },
    {
      id: 'grado-ugr',
      degree: 'Grado en Ingeniería Informática',
      institution: 'Universidad de Granada',
      startYear: 2017,
      endYear: 2022,
      exchange: {
        institution: 'Åbo Akademi University',
        city: 'Turku',
        country: 'Finlandia',
        startYear: 2019,
        endYear: 2020,
      },
    },
  ],
  certifications: [
    {
      id: 'nvidia-cuda-python',
      name: 'Fundamentals of Accelerated Computing with CUDA Python',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'fxy9PAM8SDS_Q3KlOR6FiA',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=-eCWdDy5Q-agVRZB1sbBYg',
    },
    {
      id: 'nvidia-deep-learning',
      name: 'Getting Started with Deep Learning',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'M0S7oiZMQcO9R966P9O6-Q',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=z81gjItNQgG3VfGLs1EaNQ',
    },
    {
      id: 'nvidia-prompt-engineering',
      name: 'Building LLM Applications With Prompt Engineering',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'v4rq1bLWQO-q2Ymc5WeYfw',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=XCTUF8gkS4u29cEQRcSr2Q',
    },
  ],
}
```

**19. `content/en/education.ts`**

```typescript
import type { EducationData } from '@/lib/types'

export const educationData: EducationData = {
  degrees: [
    {
      id: 'master-ugr',
      degree: "Master's Degree in Data Science and Computer Engineering",
      institution: 'Universidad de Granada',
      startYear: 2023,
      endYear: 2025,
      specialization: 'Data Science and Intelligent Technologies',
    },
    {
      id: 'grado-ugr',
      degree: "Bachelor's Degree in Computer Engineering",
      institution: 'Universidad de Granada',
      startYear: 2017,
      endYear: 2022,
      exchange: {
        institution: 'Åbo Akademi University',
        city: 'Turku',
        country: 'Finland',
        startYear: 2019,
        endYear: 2020,
      },
    },
  ],
  certifications: [
    {
      id: 'nvidia-cuda-python',
      name: 'Fundamentals of Accelerated Computing with CUDA Python',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'fxy9PAM8SDS_Q3KlOR6FiA',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=-eCWdDy5Q-agVRZB1sbBYg',
    },
    {
      id: 'nvidia-deep-learning',
      name: 'Getting Started with Deep Learning',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'M0S7oiZMQcO9R966P9O6-Q',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=z81gjItNQgG3VfGLs1EaNQ',
    },
    {
      id: 'nvidia-prompt-engineering',
      name: 'Building LLM Applications With Prompt Engineering',
      issuer: 'NVIDIA DLI',
      year: 2024,
      credentialId: 'v4rq1bLWQO-q2Ymc5WeYfw',
      verifyUrl: 'https://learn.nvidia.com/certificates?id=XCTUF8gkS4u29cEQRcSr2Q',
    },
  ],
}
```

### Fase 4 — globals.css y layout raíz

**20. `app/globals.css`** — reescribir completamente

```css
@import "tailwindcss";

/* ── Tokens de diseño ── */
@theme {
  /* Tipografía */
  --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  /* Colores — light mode (por defecto) */
  --color-background: #f6f9fc;
  --color-surface:    #ffffff;
  --color-border:     #dde6ef;
  --color-text:       #0d1b2a;
  --color-muted:      #5a7a96;
  --color-accent:     #0284c7;
  --color-accent-hover: #0369a1;
  --color-accent-dim: #e0f2fe;
}

/* Dark mode — sobreescribe los tokens cuando .dark está en <html> */
.dark {
  --color-background: #080c10;
  --color-surface:    #0e1520;
  --color-border:     #1c2a3a;
  --color-text:       #eef2f7;
  --color-muted:      #6b87a0;
  --color-accent:     #38bdf8;
  --color-accent-hover: #7dd3fc;
  --color-accent-dim: #0c2a3d;
}

/* ── Utilidades de color semántico ── */
@layer utilities {
  .bg-background    { background-color: var(--color-background); }
  .bg-surface       { background-color: var(--color-surface); }
  .text-primary     { color: var(--color-text); }
  .text-muted       { color: var(--color-muted); }
  .text-accent      { color: var(--color-accent); }
  .border-default   { border-color: var(--color-border); }
  .bg-accent-dim    { background-color: var(--color-accent-dim); }
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

**21. `app/layout.tsx`** — reescribir completamente

```tsx
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
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
      className={`${plusJakarta.variable} ${geistMono.variable}`}
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

Notas:
- `suppressHydrationWarning` en `<html>` (NO en `body`) porque next-themes añade la clase `dark` al cargar.
- `ThemeProvider` va DENTRO de `<body>`, no puede envolver `<html>`.
- `SmoothScroll` es un Client Component que inicializa Lenis.
- Las fuentes se aplican mediante CSS variables, no directamente en `className` del `<html>`.

### Fase 5 — Wrappers de animación (Client Components)

**22. `components/animations/FadeIn.tsx`**

Props: `children`, `delay?: number` (default 0), `className?: string`

Lógica: `useInView({ once: true })` + `useReducedMotion()`. Si `prefersReduced`, render directo sin motion.

```tsx
'use client'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div ref={ref} className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

**23. `components/animations/SlideUp.tsx`**

Props: `children`, `delay?: number`, `className?: string`

Variantes: `initial: { opacity: 0, y: 24 }` → `animate: { opacity: 1, y: 0 }`

**24. `components/animations/StaggerChildren.tsx`**

Props: `children`, `staggerDelay?: number` (default 0.1), `className?: string`

Patrón: `motion.div` con `variants` que tienen `staggerChildren`. Los hijos directos deben usar `motion.div` con variante `item`.

```tsx
'use client'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

const container = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: { staggerChildren: staggerDelay },
  }),
}

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

interface StaggerChildrenProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerChildren({ children, staggerDelay = 0.1, className }: StaggerChildrenProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div ref={ref} className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      variants={container}
      custom={staggerDelay}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

Los hijos que quieran animarse con el stagger deben ser `<motion.div variants={staggerItem}>`.  
Se exporta `staggerItem` para que `ProjectCard` y `TimelineItem` puedan importarlo.

**25. `components/animations/MagneticButton.tsx`**

Props: `children`, `className?: string`, `strength?: number` (default 0.3)

Lógica:
- `useMotionValue(0)` para x e y
- `useSpring` con `{ stiffness: 300, damping: 30 }` para suavizado
- `onMouseMove`: calcular offset del cursor respecto al centro del elemento
- `onMouseLeave`: resetear x e y a 0
- Detectar `'ontouchstart' in window` para desactivar en táctil
- Respetar `useReducedMotion()`

```tsx
'use client'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  strength?: number
}

export function MagneticButton({ children, className, strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 300, damping: 30 })
  const y = useSpring(rawY, { stiffness: 300, damping: 30 })

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    rawX.set((e.clientX - centerX) * strength)
    rawY.set((e.clientY - centerY) * strength)
  }

  function handleMouseLeave() {
    rawX.set(0)
    rawY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

### Fase 6 — Componentes de layout

**26. `components/layout/SmoothScroll.tsx`** (Client Component)

Ver código en sección "Detalles críticos — Lenis".

Importante: el `cancelAnimationFrame` en el cleanup necesita guardar el ID de la llamada inicial, no solo de `raf`. Usar un flag de ejecución:

```tsx
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true })
    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
```

**27. `components/layout/ThemeToggle.tsx`** (Client Component)

```tsx
'use client'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('theme')

  return (
    <button
      aria-label={theme === 'dark' ? t('toggle_light') : t('toggle_dark')}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="..."
    >
      {/* Icono sol/luna */}
    </button>
  )
}
```

Nota: `useTheme` puede devolver `undefined` antes de la hidratación. Manejar con `mounted` state:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return <div className="w-9 h-9" /> // placeholder para evitar layout shift
```

**28. `components/layout/LocaleToggle.tsx`** (Client Component)

```tsx
'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale() {
    const next = locale === 'es' ? 'en' : 'es'
    // Con localePrefix: 'as-needed', la URL para 'es' es sin prefijo
    // Para 'en' es /en + resto del path
    if (next === 'es') {
      // Quitar /en del inicio del path
      const newPath = pathname.replace(/^\/en/, '') || '/'
      router.push(newPath)
    } else {
      router.push(`/en${pathname}`)
    }
  }
  // ...
}
```

**NOTA CRÍTICA**: Con `localePrefix: 'as-needed'`, el toggle de locale NO debe usar el `Link` de next-intl navigation API (que usa la routing config) directamente, ya que la manipulación manual de paths es frágil. La forma más robusta es usar la función de navegación del `createNavigation` de next-intl.

Alternativa más robusta: crear `i18n/navigation.ts`:

```typescript
// i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

Y en `LocaleToggle.tsx`:

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
  // ...
}
```

Este patrón usa la API de next-intl y gestiona correctamente `localePrefix: 'as-needed'`.

**29. `components/layout/Nav.tsx`** (Server Component)

Usa `useTranslations` de next-intl. Pero como necesita `useTranslations` (hook de React), si se quiere que sea Server Component hay que usar `getTranslations` de `next-intl/server`:

```tsx
// Server Component — NO tiene 'use client'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

const NAV_ITEMS = [
  { key: 'projects', href: '#proyectos' },
  { key: 'experience', href: '#experiencia' },
  { key: 'education', href: '#educacion' },
  { key: 'contact', href: '#contacto' },
] as const

export async function Nav() {
  const t = await getTranslations('nav')
  return (
    <nav>
      {NAV_ITEMS.map((item) => (
        <a key={item.key} href={item.href}>{t(item.key)}</a>
      ))}
    </nav>
  )
}
```

**ALTERNATIVA**: Si el Nav necesita estado de scroll activo (highlight del link activo), hay que hacerlo Client Component con `useTranslations` y `useIntersectionObserver`. La v1 puede omitir el link activo y ser Server Component.

**30. `components/layout/Header.tsx`** (puede ser Server Component)

Compone `Nav` (Server), `ThemeToggle` (Client), `LocaleToggle` (Client). Sticky con `position: sticky; top: 0; z-index: 50`.

**31. `components/layout/Footer.tsx`** (Server Component)

```tsx
import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()
  return (
    <footer>
      <p>© {year} {t('copyright')}</p>
    </footer>
  )
}
```

### Fase 7 — Componentes UI atómicos

**32. `components/ui/Badge.tsx`** (Server Component)

```tsx
interface BadgeProps {
  label: string
  className?: string
}

export function Badge({ label, className }: BadgeProps) {
  return (
    <span
      className={`bg-accent-dim text-accent font-mono text-[0.8125rem] px-2 py-0.5 rounded ${className ?? ''}`}
    >
      {label}
    </span>
  )
}
```

**33. `components/ui/ProjectCard.tsx`** (Server Component)

Props: `project: Project`, el componente renderiza nombre, descripción, badges de stack y enlace(s).  
Puede ser `motion.div` con la variante `staggerItem` si se usa dentro de `StaggerChildren`. Pero como los datos vienen del servidor y la animación está en el cliente, el patrón correcto es:

```tsx
// ProjectCard.tsx — Server Component
import { Badge } from './Badge'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  viewRepoLabel: string
  viewBackendLabel: string
  viewModLabel: string
}

export function ProjectCard({ project, viewRepoLabel, viewBackendLabel, viewModLabel }: ProjectCardProps) {
  return (
    <article className="bg-surface border border-default rounded-xl p-6 flex flex-col gap-4">
      <h3 className="text-primary font-semibold text-[1.375rem]">{project.name}</h3>
      <p className="text-muted text-base">{project.description}</p>
      <div className="flex flex-wrap gap-2">
        {project.stack.map((tech) => <Badge key={tech} label={tech} />)}
      </div>
      {/* enlaces */}
    </article>
  )
}
```

Para que `ProjectCard` se anime con `StaggerChildren`, en `ProjectsGrid` se envuelve cada card con una `<motion.div variants={staggerItem}>`.

**34. `components/ui/TimelineItem.tsx`** (Server Component)

Props: `item: ExperienceItem`, `presentLabel: string`

Muestra: borde izquierdo accent, punto accent, rol, empresa, período, bullets.

### Fase 8 — Secciones

**35. `components/sections/Hero.tsx`** (Server Component)

```tsx
import type { PersonalInfo } from '@/lib/types'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { MagneticButton } from '@/components/animations/MagneticButton'
import { getTranslations } from 'next-intl/server'

interface HeroProps {
  personal: PersonalInfo
}

export async function Hero({ personal }: HeroProps) {
  const t = await getTranslations('hero')
  return (
    <section id="hero" className="min-h-screen flex items-center py-24 md:py-32">
      <div className="w-full max-w-[1100px] mx-auto px-6">
        <FadeIn delay={0.1}>
          <p className="text-muted font-medium text-sm uppercase tracking-widest mb-4">
            {personal.title}
          </p>
        </FadeIn>
        <SlideUp delay={0.2}>
          <h1 className="text-[clamp(3.5rem,8vw,5.5rem)] font-extrabold leading-none tracking-tight text-primary mb-6">
            {personal.name}
          </h1>
        </SlideUp>
        <FadeIn delay={0.4}>
          <p className="text-muted text-lg max-w-xl mb-10">{personal.bio}</p>
        </FadeIn>
        <FadeIn delay={0.5}>
          <div className="flex gap-4 flex-wrap">
            <MagneticButton>
              <a
                href="#proyectos"
                className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                {t('cta_projects')}
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 border border-default text-primary font-semibold px-6 py-3 rounded-lg hover:bg-surface transition-colors"
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

**36. `components/sections/ProjectsGrid.tsx`** (Server Component)

```tsx
import type { Project } from '@/lib/types'
import { StaggerChildren, staggerItem } from '@/components/animations/StaggerChildren'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { motion } from 'framer-motion' // ATENCIÓN: esto NO funcionará en Server Component
```

**PROBLEMA**: `motion` de framer-motion no puede usarse directamente en un Server Component.

**Solución**: crear un thin Client Component wrapper `AnimatedProjectCard.tsx`:

```tsx
// components/ui/AnimatedProjectCard.tsx
'use client'
import { motion } from 'framer-motion'
import { staggerItem } from '@/components/animations/StaggerChildren'
import { ProjectCard } from './ProjectCard'
import type { Project } from '@/lib/types'

interface AnimatedProjectCardProps {
  project: Project
  labels: { viewRepo: string; viewBackend: string; viewMod: string }
}

export function AnimatedProjectCard({ project, labels }: AnimatedProjectCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <ProjectCard project={project} {...labels} />
    </motion.div>
  )
}
```

Entonces `ProjectsGrid.tsx` (Server Component) usa `StaggerChildren` + `AnimatedProjectCard`.

**37. `components/sections/Timeline.tsx`** (Server Component)

Similar patrón: `StaggerChildren` + items animados. Cada `TimelineItem` puede tener su propio `SlideUp` wrapper.

**38. `components/sections/Education.tsx`** (Server Component)

Dos subsecciones: titulaciones (con `FadeIn`) y certificaciones (con `StaggerChildren`).

**39. `components/sections/Contact.tsx`** (Server Component)

Tres enlaces (email, LinkedIn, GitHub), cada uno con `MagneticButton` wrapper.

### Fase 9 — Layouts y páginas

**40. `app/[locale]/layout.tsx`**

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params  // OBLIGATORIO: params es Promise en Next.js 16

  if (!routing.locales.includes(locale as 'es' | 'en')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Header />
      <main>{children}</main>
      <Footer />
    </NextIntlClientProvider>
  )
}
```

**41. `app/[locale]/page.tsx`**

```tsx
import { getPersonal, getProjects, getExperience, getEducation } from '@/lib/content'
import { Hero } from '@/components/sections/Hero'
import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
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

  const [personal, projects, experience, educationData] = await Promise.all([
    getPersonal(locale),
    getProjects(locale),
    getExperience(locale),
    getEducation(locale),
  ])

  return (
    <>
      <Hero personal={personal} />
      <ProjectsGrid projects={projects} />
      <Timeline experience={experience} />
      <Education data={educationData} />
      <Contact personal={personal} />
    </>
  )
}
```

**42. Eliminar `app/page.tsx`** — ya no es necesario, la landing está en `app/[locale]/page.tsx`.

---

## Tests Vitest

### Configuración — `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### `vitest.setup.ts`

```typescript
import '@testing-library/jest-dom'
```

Necesita instalar también `@testing-library/jest-dom`:

```powershell
npm install -D @testing-library/jest-dom
```

### Tests de animaciones

Ubicación: `components/animations/__tests__/`

**`FadeIn.test.tsx`**:

```tsx
import { render, screen } from '@testing-library/react'
import { FadeIn } from '../FadeIn'

// Mock de framer-motion para tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

describe('FadeIn', () => {
  it('renders children', () => {
    render(<FadeIn><span>Test content</span></FadeIn>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders without motion when prefers-reduced-motion', () => {
    vi.mocked(require('framer-motion').useReducedMotion).mockReturnValue(true)
    render(<FadeIn><span>Accessible content</span></FadeIn>)
    expect(screen.getByText('Accessible content')).toBeInTheDocument()
  })
})
```

**NOTA sobre mocking de framer-motion**: en Vitest con `jsdom`, framer-motion puede tener problemas de ejecución. El mock es la estrategia recomendada para tests unitarios de componentes que usan animaciones.

**`MagneticButton.test.tsx`**:

```tsx
it('renders children', () => {
  render(<MagneticButton><button>Click me</button></MagneticButton>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})

it('renders without magnetic effect in reduced motion', () => {
  vi.mocked(require('framer-motion').useReducedMotion).mockReturnValue(true)
  render(<MagneticButton><button>Static</button></MagneticButton>)
  expect(screen.getByText('Static')).toBeInTheDocument()
})
```

### Tests de layout

Ubicación: `components/layout/__tests__/`

**`ThemeToggle.test.tsx`**:

```tsx
// Mock de next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}))

// Mock de next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

it('renders a button with aria-label', () => {
  render(<ThemeToggle />)
  expect(screen.getByRole('button')).toBeInTheDocument()
  expect(screen.getByRole('button')).toHaveAttribute('aria-label')
})
```

**`Nav.test.tsx`**: Nav es Server Component con `getTranslations`. Para tests unitarios, puede ser necesario convertirlo en Client Component alternativo o testear su output renderizado. La estrategia recomendada es mockear `next-intl/server`.

**`LocaleToggle.test.tsx`**: mockear `next-intl` y `@/i18n/navigation`.

### Tests de secciones

Ubicación: `components/sections/__tests__/`

Para secciones Server Component con `async`, los tests necesitan usar `act` y resolver la Promise:

```tsx
// Hero.test.tsx
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))

it('renders name and bio', async () => {
  const personal = { name: 'Miguel Test', bio: 'Bio test', title: 'Dev', ... }
  render(await Hero({ personal }))
  expect(screen.getByText('Miguel Test')).toBeInTheDocument()
})
```

**ALTERNATIVA para Server Components async**: usar `renderAsync` de `@testing-library/react` o resolver el componente antes de renderizar. En React 19 + Next.js 16, la forma más directa es llamar el componente como función y awaitearlo:

```tsx
const heroOutput = await Hero({ personal: mockPersonal })
render(heroOutput)
```

---

## Estructura de archivos final

```
app/
├── layout.tsx                         ← MODIFICAR (fuentes + ThemeProvider + SmoothScroll)
├── globals.css                        ← MODIFICAR (@theme completo + utilities)
├── [locale]/
│   ├── layout.tsx                     ← CREAR (NextIntlClientProvider + Header + Footer)
│   └── page.tsx                       ← CREAR (todas las secciones + generateStaticParams)
i18n/
├── request.ts                         ← CREAR (getRequestConfig)
├── routing.ts                         ← CREAR (defineRouting con locales + localePrefix)
└── navigation.ts                      ← CREAR (createNavigation para LocaleToggle)
middleware.ts                          ← CREAR (createMiddleware desde next-intl)
next.config.ts                         ← MODIFICAR (withNextIntl plugin)
vitest.config.ts                       ← CREAR
vitest.setup.ts                        ← CREAR
lib/
├── types.ts                           ← CREAR (interfaces completas)
└── content.ts                         ← CREAR (helpers getPersonal, getProjects, etc.)
messages/
├── es.json                            ← CREAR
└── en.json                            ← CREAR
content/
├── es/
│   ├── personal.ts
│   ├── projects.ts
│   ├── experience.ts
│   └── education.ts
└── en/
    ├── personal.ts
    ├── projects.ts
    ├── experience.ts
    └── education.ts
components/
├── layout/
│   ├── Header.tsx                     ← CREAR (Server Component)
│   ├── Footer.tsx                     ← CREAR (Server Component async)
│   ├── Nav.tsx                        ← CREAR (Server Component async)
│   ├── ThemeToggle.tsx                ← CREAR (Client Component)
│   ├── LocaleToggle.tsx               ← CREAR (Client Component)
│   └── SmoothScroll.tsx               ← CREAR (Client Component, Lenis)
├── animations/
│   ├── FadeIn.tsx                     ← CREAR (Client Component)
│   ├── SlideUp.tsx                    ← CREAR (Client Component)
│   ├── StaggerChildren.tsx            ← CREAR (Client Component, exporta staggerItem)
│   └── MagneticButton.tsx             ← CREAR (Client Component)
├── sections/
│   ├── Hero.tsx                       ← CREAR (Server Component async)
│   ├── ProjectsGrid.tsx               ← CREAR (Server Component async)
│   ├── Timeline.tsx                   ← CREAR (Server Component async)
│   ├── Education.tsx                  ← CREAR (Server Component async)
│   └── Contact.tsx                    ← CREAR (Server Component async)
└── ui/
    ├── Badge.tsx                      ← CREAR
    ├── ProjectCard.tsx                ← CREAR (Server Component)
    ├── AnimatedProjectCard.tsx        ← CREAR (Client Component wrapper para stagger)
    └── TimelineItem.tsx               ← CREAR (Server Component)
```

Archivos a eliminar/reemplazar:
- `app/page.tsx` — eliminar (queda vacío el import del scaffolding; el locale layout maneja la landing)

---

## Orden de implementación (minimiza dependencias rotas)

1. Instalar dependencias (next-themes, vitest stack)
2. `vitest.config.ts` + `vitest.setup.ts`
3. `lib/types.ts`
4. `messages/es.json` + `messages/en.json`
5. `content/es/*.ts` + `content/en/*.ts`
6. `lib/content.ts`
7. `i18n/routing.ts`
8. `i18n/request.ts`
9. `i18n/navigation.ts`
10. `middleware.ts`
11. `next.config.ts` (withNextIntl)
12. `app/globals.css` (reescribir)
13. `components/layout/SmoothScroll.tsx`
14. `app/layout.tsx` (reescribir con fuentes + ThemeProvider + SmoothScroll)
15. Tests de animaciones (TDD: primero los tests)
16. `components/animations/FadeIn.tsx`
17. `components/animations/SlideUp.tsx`
18. `components/animations/StaggerChildren.tsx`
19. `components/animations/MagneticButton.tsx`
20. Tests de layout (TDD)
21. `components/layout/ThemeToggle.tsx`
22. `components/layout/LocaleToggle.tsx`
23. `components/layout/Nav.tsx`
24. `components/layout/Header.tsx`
25. `components/layout/Footer.tsx`
26. `components/ui/Badge.tsx`
27. `components/ui/ProjectCard.tsx`
28. `components/ui/AnimatedProjectCard.tsx`
29. `components/ui/TimelineItem.tsx`
30. Tests de secciones (TDD)
31. `components/sections/Hero.tsx`
32. `components/sections/ProjectsGrid.tsx`
33. `components/sections/Timeline.tsx`
34. `components/sections/Education.tsx`
35. `components/sections/Contact.tsx`
36. `app/[locale]/layout.tsx`
37. `app/[locale]/page.tsx`
38. Eliminar `app/page.tsx` (o vaciar para evitar conflicto de rutas)
39. `npm run lint && npm run test && npm run build`

---

## Notas y trampas frecuentes

### 1. `app/page.tsx` vs `app/[locale]/page.tsx`

Con `localePrefix: 'as-needed'`, la URL `/` es manejada por el middleware que redirecciona internamente al locale `es`. Esto significa que `app/[locale]/page.tsx` con `locale='es'` sirve la ruta `/`. El archivo `app/page.tsx` puede causar conflicto — debe eliminarse o redirigir.

La forma más limpia: eliminar `app/page.tsx` y dejar que el middleware de next-intl gestione el routing.

### 2. `package.json` — script `test`

El script `test` no existe en el `package.json` actual. Debe añadirse:

```json
"test": "vitest run"
```

Para modo watch durante desarrollo: `"test:watch": "vitest"`.

### 3. `@testing-library/jest-dom` no está instalado

El `vitest.setup.ts` importa `@testing-library/jest-dom`. Instalar:

```powershell
npm install -D @testing-library/jest-dom
```

### 4. framer-motion en Server Components

framer-motion v12 tiene soporte experimental para RSC, pero los componentes de `motion.*` siguen necesitando `"use client"`. La estrategia de thin Client Component wrappers (`AnimatedProjectCard`) es la solución correcta.

### 5. `useTranslations` solo en Client Components

`useTranslations` de next-intl es un hook de React — solo funciona en Client Components.  
Para Server Components usar `getTranslations` de `next-intl/server` (función async).

### 6. Hydration mismatch con ThemeToggle

El hook `useTheme` de next-themes retorna `undefined` en SSR. Si se renderiza contenido condicional basado en el tema en SSR, causará mismatch. Solución: state `mounted` y renderizar placeholder en SSR.

### 7. Anclas de sección — IDs en español

Los `id` de las secciones deben coincidir con los `href` de la Nav. Usar siempre los mismos IDs, independientemente del locale. IDs definidos: `hero`, `proyectos`, `experiencia`, `educacion`, `contacto`. El Nav enlaza a estos en ambos locales (los IDs no se traducen).

### 8. `eslint.config.js` — verificar si acepta TypeScript

El proyecto usa ESLint 9. Si hay errores de lint en archivos `.tsx` nuevos, revisar que `eslint-config-next` 16.2.7 esté configurado correctamente para TypeScript. Si aparecen errores de módulo no encontrado, puede ser necesario añadir `@typescript-eslint/eslint-plugin` si no viene incluido.

### 9. Plus_Jakarta_Sans — nombre de importación

El nombre de importación para Google Fonts en `next/font/google` usa guiones bajos: `Plus_Jakarta_Sans` (no `PlusJakartaSans`, no `Plus Jakarta Sans`).

### 10. `generateStaticParams` — solo en page.tsx, no en layout

`generateStaticParams` debe estar en `app/[locale]/page.tsx`. No es necesario ni correcto en el layout.

### 11. Secciones async con datos — patrón correcto

Las secciones reciben datos como props desde `page.tsx`. No hacen fetch propio. La carga de datos ocurre en `app/[locale]/page.tsx` usando los helpers de `lib/content.ts`.

### 12. `content/` — imports dinámicos vs. estáticos

Los helpers en `lib/content.ts` usan `import()` dinámico con el locale. En Next.js 16 con SSG, estos imports se resuelven en build time. No hay fetch de red. Los módulos TypeScript se compilan a JavaScript y se importan como módulos estáticos en el bundle de servidor.

---

## Verificación final

```powershell
npm run lint && npm run test && npm run build
```

- `lint`: sin errores de TypeScript ni ESLint
- `test`: todos los tests de animaciones, layout y secciones en verde
- `build`: genera rutas estáticas `/` (es) y `/en` sin errores
