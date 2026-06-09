@AGENTS.md

# CLAUDE.md — Portfolio miguealguacil.com

Fuente de verdad para Claude Code en este repositorio. Léelo antes de actuar.

---

## Proyecto

Portfolio personal de Miguel Alguacil — desplegado en miguealguacil.com.
Next.js 16 (App Router, SSG), bilingüe ES/EN con `/es` por defecto, animaciones con Framer Motion + Lenis.
Sin backend propio: todo es generación estática. Hosting en Vercel (plan Hobby, gratuito).

---

## Estructura

```text
/
├── app/
│   ├── [locale]/            # rutas bilingües (es por defecto)
│   │   ├── layout.tsx
│   │   ├── page.tsx         # landing / hero
│   │   ├── proyectos/       # listado de proyectos
│   │   ├── experiencia/     # timeline laboral
│   │   ├── educacion/       # educación + certificaciones
│   │   └── contacto/        # enlaces de contacto
│   ├── layout.tsx           # root layout (fuente, tema, Lenis)
│   └── globals.css
├── components/
│   ├── layout/              # Header, Footer, Nav, ThemeToggle, LocaleToggle
│   ├── sections/            # Hero, ProjectsGrid, Timeline, Education, Contact
│   ├── ui/                  # componentes atómicos reutilizables (Button, Badge, Card...)
│   └── animations/          # wrappers Framer Motion (FadeIn, SlideUp, StaggerChildren...)
├── content/
│   ├── es/                  # datos del portfolio en español (proyectos, experiencia, etc.)
│   └── en/                  # datos del portfolio en inglés
├── messages/
│   ├── es.json              # strings de UI (next-intl)
│   └── en.json
├── lib/
│   ├── content.ts           # helpers para cargar content/
│   └── utils.ts
├── public/                  # imágenes y assets estáticos
├── i18n.ts                  # configuración de next-intl
└── middleware.ts            # redirección de locale
```

---

## Stack

- **Next.js 16** (App Router, SSG con `generateStaticParams`)
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **next-intl v4** — i18n (rutas `/[locale]/`, locale por defecto: `es`)
- **Framer Motion v12** — animaciones declarativas
- **Lenis v1** — scroll suave global
- **Vitest + Testing Library** — tests unitarios
- **Playwright** — tests E2E

---

## Convenciones

- Alias `@` para imports desde la raíz del proyecto (`tsconfig.json`).
- **Contenido** (proyectos, experiencia, educación, certs, bio) → `content/{es,en}/` como objetos TypeScript tipados. **Nunca** hardcodeado en componentes.
- **Strings de UI** (nav, botones, labels de sección) → `messages/{es,en}.json`, accedidos con `useTranslations` de next-intl.
- **Animaciones** con intención: wrappers reutilizables en `components/animations/`, no inline complejas. Presupuesto: hero interactivo en < 1.5 s.
- **Server Components** por defecto; `"use client"` solo cuando hay estado/efectos cliente (animaciones interactivas, ThemeToggle).
- Tema claro/oscuro via Tailwind `dark:` clases + `ThemeProvider` en el layout raíz.
- Componentes genéricos → `components/ui/`. Secciones de página → `components/sections/`.

---

## Comandos

```powershell
# desarrollo
npm run dev

# verificación completa (ejecutar antes de cada PR)
npm run lint && npm run test && npm run build

# tests E2E
npx playwright test
```

---

## SDD: OBLIGATORIO al planificar

**REGLA CRÍTICA — sin excepciones:** Cuando se quiera planificar, proponer, crear o implementar cualquier funcionalidad, el **primer paso siempre es el flujo SDD**:

1. Si la idea necesita refinamiento o hay dudas → `/opsx:explore`
2. Si la idea está clara → `/opsx:propose`

**NO** analices el código, **NO** planifiques directamente, **NO** propongas implementaciones sin pasar primero por `/opsx:explore` o `/opsx:propose`.

---

## SDD / OpenSpec

Flujo (perfil core):

```
/opsx:explore        # pensar/aclarar una idea (opcional)
/opsx:propose        # crear el cambio + artefactos (proposal, specs, design, tasks)
plan técnico         # agente developer → .claude/doc/<cambio>/developer.md (OBLIGATORIO)
/opsx:apply          # implementar tareas
write-pr-report + gh # abrir el PR
/opsx:archive        # fusionar delta specs en openspec/specs/ y archivar
```

- El **plan técnico es obligatorio** antes de `/opsx:apply`: debe existir `.claude/doc/<cambio>/developer.md`.
- Reglas de tareas: `.claude/rules/openspec-tasks-mandatory-steps.md`.
- Contexto del stack inyectado en artefactos: `openspec/config.yaml`.
- Agentes: `developer` (Next.js full-stack), `product-strategy-analyst` (ideación).

---

## NO hacer

- NO introducir un backend propio (FastAPI, Express, etc.) sin propuesta SDD explícita.
- NO hardcodear contenido en componentes — siempre `content/`.
- NO hardcodear strings de UI — siempre `messages/`.
- NO hacer `fetch` directo desde componentes (cuando haya API routes en el futuro, abstraer en `lib/`).
- NO instalar dependencias sin confirmación del usuario.
- NO commitear secretos, tokens o API keys.
- NO hacer cambios grandes no relacionados con la petición.
