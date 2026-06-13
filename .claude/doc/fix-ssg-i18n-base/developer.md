# Plan técnico — `fix-ssg-i18n-base`

> Plan de implementación a nivel de archivos para `/opsx:apply`. Sigue la estructura de
> `openspec/changes/fix-ssg-i18n-base/tasks.md` (secciones 0-6). Las secciones 0, 4, 5 y 6
> ya están suficientemente especificadas en `tasks.md`; aquí solo se añaden notas que afecten
> a archivos concretos.

## Confirmaciones previas (verificadas contra el código real)

- `next-intl` instalado: **v4.13.0**. `setRequestLocale` se exporta desde `next-intl/server`
  como `export { setCachedRequestLocale as setRequestLocale } from './RequestLocaleCache.js'`.
  Firma: `setRequestLocale(locale: Locale): void` — **síncrona**, recibe el `locale` ya
  resuelto (string), no una promesa. Import: `import { setRequestLocale } from 'next-intl/server'`.
- `app/layout.tsx` (root layout actual) define `<html>` SIN `lang`, las 3 fuentes
  (`Space Grotesk`/`Inter`/`JetBrains Mono`), `metadata` estático (`title`/`description`),
  `viewport` (`themeColor`), `ThemeProvider` y `SmoothScroll`. Importa `./globals.css`.
- `app/[locale]/layout.tsx` NO renderiza `<html>`/`<body>`; solo envuelve en
  `NextIntlClientProvider` + `Header`/`main`/`Footer`. No llama `setRequestLocale`.
- `app/[locale]/page.tsx` y `app/[locale]/proyectos/[projectId]/page.tsx` tienen
  `generateStaticParams` pero no llaman `setRequestLocale`.
- **No existe** `app/[locale]/proyectos/page.tsx` (no hay ruta de listado separada — el
  listado de proyectos vive embebido en la home vía `ProjectsGrid`). **Fuera de alcance**,
  confirmado: no se toca.
- **No existen** `app/not-found.tsx`, `app/error.tsx`, ni rutas API fuera de `app/[locale]/`.
  Solo existen, además de los layouts/pages ya mencionados: `app/globals.css`,
  `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png` (metadata files de Next.js —
  se siguen sirviendo igual independientemente de dónde esté el root layout; **no requieren
  cambios**).
- `app/globals.css` se importa actualmente desde `app/layout.tsx` — el import debe moverse a
  `app/[locale]/layout.tsx` (ruta relativa `./globals.css` sigue siendo válida porque
  `app/[locale]/layout.tsx` también puede importar `../globals.css`... **cuidado**: la ruta
  relativa cambia de carpeta. Ver detalle en sección 1.1.
- `i18n/routing.ts`: `pathnames` solo define `/proyectos/[projectId]` (es) ↔
  `/projects/[projectId]` (en). La home (`/`) no tiene entrada en `pathnames` porque es la
  misma ruta (`/`) en ambos locales (con `localePrefix: 'as-needed'`, `/en` para inglés).
- `components/ui/TimelineItem.tsx`: `formatDate` hardcodea `'es-ES'` (líneas 8-12). Recibe
  `item: ExperienceItem` y `presentLabel: string` como props. **No tiene test propio**
  (`components/ui/__tests__/` no contiene `TimelineItem.test.tsx`).
- `components/sections/Timeline.tsx`: resuelve `locale` vía `getLocale()` de
  `next-intl/server` (ya importado) y lo usa para `getSectionAnchorId`. Pasa `item` y
  `presentLabel` a `TimelineItem`, pero no `locale`. Existe
  `components/sections/__tests__/Timeline.test.tsx` que mockea `next-intl/server` con
  `getLocale: () => mockLocale()` (devuelve `'es'`/`'en'` síncronamente vía promesa resuelta).
- `messages/{es,en}.json`: no existe namespace `metadata`. Existen `hero.bio_label`,
  `sections.projects_subtitle`, etc. `content/{es,en}/personal.ts` tiene `title` y `bio`
  (campos no vacíos, listos para usar como `description`/parte del `title` de home).
- `content/{es,en}/projects.ts`: cada `Project` tiene `description: string` (una frase,
  apta para `<meta name="description">` de la página de detalle) y `name: string` (apto
  para `<title>`).
- `lib/navigation.ts` ya tiene un mapa de anclas de sección por locale (`SECTION_ANCHORS`,
  `getSectionHref`) — útil como referencia de estilo, pero **no se reutiliza directamente**
  para `alternates.languages` (es un caso distinto: anclas de sección vs. rutas de página).

---

## 0. Setup (OBLIGATORIO - PRIMER PASO)

- 0.1 Crear rama `feature/fix-ssg-i18n-base` desde `main`. Sin cambios de archivo asociados.

---

## 1. Renderizado estático + `<html lang>` (next-intl `setRequestLocale`)

### 1.1 Fusionar `app/layout.tsx` → `app/[locale]/layout.tsx`

**Archivos:**
- **Eliminar**: `app/layout.tsx`
- **Modificar (reescribir completo)**: `app/[locale]/layout.tsx`
- `app/globals.css`, `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`: **sin cambios**
  (siguen en `app/`, Next.js los sigue resolviendo como metadata files / CSS importable por
  ruta relativa desde `app/[locale]/layout.tsx` con `../globals.css`).

**Por qué es seguro eliminar `app/layout.tsx`:**
Confirmado que no hay ninguna ruta (`not-found.tsx`, `error.tsx`, rutas API, route groups)
fuera de `app/[locale]/` que dependa de `app/layout.tsx` como root layout. Next.js 16
permite que el root layout esté bajo un segmento dinámico (`app/[locale]/layout.tsx`) — es
el patrón estándar de next-intl con App Router (confirmado en
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`,
sección "Root Layout": *"The root layout can be under a dynamic segment, for example when
implementing internationalization with `app/[lang]/layout.js`"*).

Como `app/[locale]/layout.tsx` se convierte en el ÚNICO root layout, **debe**:
- Definir `<html>` y `<body>` (requisito de Next.js para el root layout).
- Seguir teniendo `notFound()` si el locale no es válido (mantener el guard existente).

**Contenido final exacto de `app/[locale]/layout.tsx`:**

```tsx
import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import '../globals.css'

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
  metadataBase: new URL('https://miguealguacil.com'),
  title: 'miguealguacil — AI Engineer',
  description:
    'Portfolio de Miguel Á. Benítez Alguacil, AI Engineer especializado en GenAI, agentes LLM y desarrollo de producto.',
}

export const viewport: Viewport = {
  themeColor: '#131314',
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'es' | 'en')) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-background text-primary min-h-screen"
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <SmoothScroll>
              <Header />
              <main>{children}</main>
              <Footer />
            </SmoothScroll>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Notas críticas sobre este archivo:**

1. **Orden de llamadas**: `await params` → guard `notFound()` → `setRequestLocale(locale)`
   → `await getMessages()`. `setRequestLocale` debe ejecutarse **antes** de `getMessages()`
   (que internamente usa `getRequestConfig`/el locale cacheado) y antes de cualquier render
   de componentes hijos que llamen `getTranslations`/`getLocale` (Header, Footer, Hero,
   Timeline, etc.).
2. **`metadataBase`**: se añade aquí (Decisión 3/4 de `design.md`), como campo estático
   junto al `metadata` existente. Es independiente del locale, por lo que vive en el layout
   raíz (ahora fusionado) y no en `generateMetadata`.
3. **`title`/`description` del `metadata` estático del layout**: se mantienen como
   *defaults* en español (igual que el `app/layout.tsx` original). `app/[locale]/page.tsx`
   sobrescribirá `title`/`description` con `generateMetadata` localizado (ES/EN) — ver
   sección 2.4. Para `/en`, si por algún motivo `generateMetadata` de la página no se
   resolviera, el fallback seguiría siendo el texto en español del layout; esto es aceptable
   porque `generateMetadata` de `page.tsx` siempre se ejecuta para esta ruta (no es opcional
   ni condicional).
4. **Orden de wrappers**: el original era `ThemeProvider > SmoothScroll > children`. El
   `app/[locale]/layout.tsx` original era `NextIntlClientProvider > Header/main/Footer`.
   Al fusionar, el orden final es:
   `ThemeProvider > NextIntlClientProvider > SmoothScroll > (Header, main, Footer)`.
   - `ThemeProvider` debe estar en el nivel más alto posible dentro de `<body>` (como en el
     original) para que el atributo de clase de tema (`dark`/`light`) se aplique sobre
     `<html>`/`<body>` sin depender de next-intl.
   - `NextIntlClientProvider` debe envolver TODO lo que use `useTranslations`/`useLocale`
     en cliente (`Header`, `Footer`, `ThemeToggle`, `LocaleToggle`, etc.) — por eso pasa a
     envolver también `SmoothScroll`/`Header`/`Footer` (que antes estaban dentro del
     `app/[locale]/layout.tsx` original, ya envueltos por `NextIntlClientProvider`).
   - Resultado: se preserva el comportamiento original de ambos layouts, solo que ahora
     viven en un único archivo. **No cambia ningún `className`, `suppressHydrationWarning`,
     ni props de `ThemeProvider`.**
5. **Import de CSS**: cambia de `'./globals.css'` (relativo a `app/`) a `'../globals.css'`
   (relativo a `app/[locale]/`, sube un nivel a `app/`). Verificar que el archivo
   `app/globals.css` permanece en su sitio (no se mueve).
6. **`React.ReactNode`**: el tipo `React.ReactNode` se usa sin importar `React` explícito —
   esto ya funcionaba en el `app/layout.tsx` original (con `"jsx": "react-jsx"` en
   `tsconfig.json`, los tipos globales de React están disponibles vía `@types/react`). No
   cambia.
7. **`generateStaticParams`**: el layout fusionado NO necesita `generateStaticParams` propio
   — Next.js ya usa el `generateStaticParams` de `app/[locale]/page.tsx` (y de
   `proyectos/[projectId]/page.tsx`) para resolver `[locale]` en todo el árbol de esa rama.
   No lo añadas al layout.

**Riesgo a vigilar en E2E (sección 5)**: como `ThemeProvider` envuelve ahora a
`NextIntlClientProvider`, confirmar que `next-themes` sigue añadiendo la clase `dark`/`light`
en `<html>` (vía `attribute="class"`) sin colisionar con `className={...variable...}` ya
presente — `next-themes` añade/quita clases, no sobrescribe `className` completo, así que
no debería haber conflicto, pero verificarlo visualmente en el toggle de tema (paso 5.4).

---

### 1.2 Añadir `setRequestLocale(locale)` en páginas con `generateStaticParams`

**Archivos a modificar:**
- `app/[locale]/page.tsx`
- `app/[locale]/proyectos/[projectId]/page.tsx`

(El layout ya se cubrió en 1.1; aquí solo las dos páginas.)

#### `app/[locale]/page.tsx`

Diff conceptual:
- Añadir import: `import { setRequestLocale } from 'next-intl/server'`
- Dentro de `HomePage`, justo después de `const { locale } = await params`, antes de
  cualquier otra llamada (`getPersonal`, `getProjects`, etc.):
  ```tsx
  setRequestLocale(locale)
  ```

Contenido resultante (solo se muestra la función `HomePage`, el resto del archivo
—imports de componentes, `generateStaticParams`— no cambia salvo el nuevo import):

```tsx
import { getPersonal, getProjects, getExperience, getEducation, getSkills } from '@/lib/content'
import { setRequestLocale } from 'next-intl/server'
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
  setRequestLocale(locale)

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

(`generateMetadata` se añade en la sección 2.4, en este mismo archivo.)

#### `app/[locale]/proyectos/[projectId]/page.tsx`

Diff conceptual:
- Añadir import: `import { setRequestLocale } from 'next-intl/server'`
- Dentro de `ProjectDetailPage`, justo después de
  `const { locale, projectId } = await params`, antes de `getProjects(locale)`:
  ```tsx
  setRequestLocale(locale)
  ```

Contenido resultante (función `ProjectDetailPage`; `generateStaticParams` no cambia):

```tsx
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getProjects } from '@/lib/content'
import { ProjectDetail } from '@/components/sections/ProjectDetail'
import { routing } from '@/i18n/routing'

export async function generateStaticParams() {
  const params: { locale: string; projectId: string }[] = []

  for (const locale of routing.locales) {
    const projects = await getProjects(locale)
    for (const project of projects) {
      params.push({ locale, projectId: project.id })
    }
  }

  return params
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>
}) {
  const { locale, projectId } = await params
  setRequestLocale(locale)

  const projects = await getProjects(locale)
  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    notFound()
  }

  return <ProjectDetail project={project} />
}
```

(`generateMetadata` se añade en la sección 2.5, en este mismo archivo.)

**Nota sobre el orden `setRequestLocale` vs. `notFound()` en esta página**: a diferencia del
layout (donde el guard de locale inválido va ANTES de `setRequestLocale`, porque un locale
inválido nunca debe llegar a `setRequestLocale`), en `proyectos/[projectId]/page.tsx` el
`notFound()` es por `projectId` no encontrado, NO por locale inválido — el locale ya fue
validado en el layout padre. Por tanto aquí `setRequestLocale(locale)` va primero (antes de
`getProjects`), y el `notFound()` por proyecto inexistente sigue yendo después, sin cambios
de orden relativo entre ellos.

---

### 1.3 Verificar `npm run build`

Sin archivos nuevos. Pasos de verificación (a ejecutar en la sección 4, pero documentados
aquí para contexto):
- `npm run build`
- Inspeccionar la tabla de rutas en la salida de `next build`: `/` y `/en` (y
  `/proyectos/[projectId]` × `es`/`en`) deben aparecer como estáticas (`○`/`●`), NO como
  `ƒ`.
- Inspeccionar `.next/prerender-manifest.json`: debe listar una entrada por cada
  combinación `locale` × `projectId` definida en `content/{es,en}/projects.ts` (3 proyectos
  × 2 locales = 6 entradas de detalle, más `/` y `/en`).

---

## 2. Metadatos: `metadataBase` + `alternates.languages`

### 2.1-2.2 Decisión sobre origen de `title`/`description` y nuevas claves en `messages/{es,en}.json`

**Decisión (resuelve la Open Question de `design.md`)**: se añade un **namespace `metadata`
nuevo** en `messages/{es,en}.json`, con dos claves mínimas para el `title`/`description` de
la **home** (`metadata.home_title`, `metadata.home_description`). Razones:

- `content/{locale}/personal.ts` tiene `title`/`bio`, pero son textos pensados para el Hero
  (p. ej. `title: 'AI Engineer | GenAI, Agentes y Desarrollo de Producto'`, `bio` es un
  párrafo largo en primera persona "Data Scientist con perfil de ingeniería..."). Usarlos
  tal cual como `<title>`/`<meta description>` de la home funcionaría, pero mezclaría
  "contenido de portfolio" (`content/`) con "metadatos SEO de la página", que son conceptos
  distintos y pueden divergir en el futuro (p. ej. el bio del Hero puede crecer/cambiar de
  tono sin que se quiera tocar el `<title>` del `<head>`).
- Las claves de UI (`messages/`) son el lugar correcto para textos que son "de la página/UI"
  y no "del contenido del portfolio" — un `<title>`/`<meta description>` de SEO es UI, no
  contenido de bio/proyectos/experiencia.
- Para la **página de detalle de proyecto** SÍ se reutiliza contenido existente:
  `project.name` (→ `title`) y `project.description` (→ `description`), ambos ya
  tipados y localizados en `content/{locale}/projects.ts`. No se añade ninguna clave nueva
  para detalle de proyecto.

**Archivos a modificar:**
- `c:\Users\migue\Documents\Proyectos\miguealguacil\messages\es.json`
- `c:\Users\migue\Documents\Proyectos\miguealguacil\messages\en.json`

**Claves nuevas — `messages/es.json`** (añadir como nuevo namespace de nivel superior,
después de `projectDetail` o donde resulte más limpio, manteniendo el JSON válido):

```json
"metadata": {
  "home_title": "miguealguacil — AI Engineer | GenAI, Agentes y Desarrollo de Producto",
  "home_description": "Portfolio de Miguel Á. Benítez Alguacil, AI Engineer especializado en GenAI, agentes LLM y desarrollo de producto."
}
```

**Claves nuevas — `messages/en.json`**:

```json
"metadata": {
  "home_title": "miguealguacil — AI Engineer | GenAI, Agents & Product Development",
  "home_description": "Portfolio of Miguel Á. Benítez Alguacil, AI Engineer specialized in GenAI, LLM agents and product development."
}
```

**Notas:**
- `home_description` (ES) es idéntica al `description` que ya existe en el `metadata`
  estático de `app/layout.tsx`/nuevo `app/[locale]/layout.tsx` — coherente, ya que ese
  texto seguirá siendo el fallback en el layout para el caso ES, y la versión EN es su
  traducción.
- `home_title` (ES) combina el `title` original del layout (`'miguealguacil — AI
  Engineer'`) con el `personal.title` (`'AI Engineer | GenAI, Agentes y Desarrollo de
  Producto'`) para dar un `<title>` más descriptivo en home, sin depender de `content/`.
  Si se prefiere mantener el `<title>` corto original (`'miguealguacil — AI Engineer'`),
  es una decisión de producto trivial de ajustar el valor de la clave — la estructura
  (namespace `metadata`, claves `home_title`/`home_description`) es lo prescriptivo aquí.
- Verificar que el JSON resultante sigue siendo válido (coma final correcta tras
  `"projectDetail": { ... }`).

### 2.3 `metadataBase` en el layout raíz fusionado

Ya incluido en el contenido de `app/[locale]/layout.tsx` de la sección 1.1
(`metadataBase: new URL('https://miguealguacil.com')`). No requiere archivo adicional.

### 2.4 `generateMetadata` en `app/[locale]/page.tsx`

**Archivo a modificar**: `app/[locale]/page.tsx` (mismo archivo de la sección 1.2; añadir
el export `generateMetadata` además de los cambios ya descritos).

**Mapeo de alternates para la home**: la home es la ruta `/` en ambos locales (no está en
`routing.pathnames` porque no necesita traducción de segmento). Con
`localePrefix: 'as-needed'` y `defaultLocale: 'es'`:
- ES (`es`, default): URL pública = `/`
- EN (`en`): URL pública = `/en`

Por tanto `alternates.languages` para la home es estático en su forma (no depende de
`routing.pathnames`, ya que `/` no tiene entrada ahí), pero el plan pide construirlo
"usando el mapeo de `i18n/routing.ts`" en la medida de lo razonable — para la home,
construimos las dos URLs a partir de `routing.locales` y `routing.defaultLocale` (mismo
criterio de prefijo que usa `lib/navigation.ts::getSectionHref`), evitando hardcodear
`'/en'` de forma aislada sin relacionarlo con `routing`.

**Contenido a añadir en `app/[locale]/page.tsx`** (export adicional, antes o después de
`generateStaticParams`; recomendado justo después):

```tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    languages[loc] = loc === routing.defaultLocale ? '/' : `/${loc}`
  }

  return {
    title: t('home_title'),
    description: t('home_description'),
    alternates: {
      languages,
    },
  }
}
```

**Notas:**
- `getTranslations({ locale, namespace: 'metadata' })` (forma con objeto de opciones) es la
  variante de `next-intl/server` pensada para usarse **fuera** del árbol de render donde
  `setRequestLocale` ya fijó el locale en curso (aunque aquí, como `generateMetadata` se
  ejecuta para la misma ruta/locale que `HomePage`, pasar `locale` explícito es más robusto
  y explícito; evita depender de que el caché de `setRequestLocale` ya esté poblado en el
  momento en que se resuelve `generateMetadata`, cuyo orden de ejecución relativo a la
  página no está garantizado por la documentación). Verificar el tipo exacto de
  `getTranslations` en `node_modules/next-intl/dist/types/server/react-server/getTranslations.d.ts`
  si hay dudas de tipado al implementar — debe aceptar `{ locale, namespace }`.
- `import type { Metadata } from 'next'` ya se usaba en `app/layout.tsx` original; aquí es
  un import nuevo en `app/[locale]/page.tsx`.
- `alternates.languages` con claves `'es'`/`'en'` (no `'es-ES'`/`'en-US'`) — coincide con
  los locales de `routing.locales` (`['es', 'en']`) y con los escenarios de la spec
  (`alternates.languages incluye una entrada en que apunta a /en`).
- Las URLs `'/'` y `'/en'` son rutas **relativas**; con `metadataBase` definido en el
  layout, Next.js las resuelve a `https://miguealguacil.com/` y
  `https://miguealguacil.com/en` respectivamente (ver
  `node_modules/next/dist/docs/.../generate-metadata.md`, sección `metadataBase` →
  "URL-based metadata fields... can use a relative path").

### 2.5 `generateMetadata` en `app/[locale]/proyectos/[projectId]/page.tsx`

**Archivo a modificar**: `app/[locale]/proyectos/[projectId]/page.tsx` (mismo archivo de la
sección 1.2; añadir el export `generateMetadata`).

**Mapeo de alternates para detalle de proyecto**: usar `routing.pathnames` para
`'/proyectos/[projectId]'`:

```ts
pathnames: {
  '/proyectos/[projectId]': {
    es: '/proyectos/[projectId]',
    en: '/projects/[projectId]',
  },
},
```

Para una página en `es` con `projectId = 'tfm-sexism-classifier'`:
- alternate `en` → sustituir el patrón `en` (`/projects/[projectId]`) con el `projectId`
  real → `/en/projects/tfm-sexism-classifier` (con prefijo `/en` porque `en` no es el
  locale por defecto).

Para una página en `en` con el mismo `projectId`:
- alternate `es` → sustituir el patrón `es` (`/proyectos/[projectId]`) →
  `/proyectos/tfm-sexism-classifier` (sin prefijo, porque `es` es el `defaultLocale`).

**Contenido a añadir en `app/[locale]/proyectos/[projectId]/page.tsx`**:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getProjects } from '@/lib/content'
import { ProjectDetail } from '@/components/sections/ProjectDetail'
import { routing } from '@/i18n/routing'

const PROJECT_DETAIL_PATHNAME = '/proyectos/[projectId]' as const

export async function generateStaticParams() {
  // ... sin cambios
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>
}): Promise<Metadata> {
  const { locale, projectId } = await params

  const projects = await getProjects(locale)
  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    return {}
  }

  const pathnamesForRoute = routing.pathnames[PROJECT_DETAIL_PATHNAME]

  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    const template = pathnamesForRoute[loc]
    const localizedPath = template.replace('[projectId]', projectId)
    languages[loc] = loc === routing.defaultLocale ? localizedPath : `/${loc}${localizedPath}`
  }

  return {
    title: project.name,
    description: project.description,
    alternates: {
      languages,
    },
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>
}) {
  // ... sin cambios (sección 1.2)
}
```

**Notas críticas:**

1. **Tipado de `routing.pathnames`**: `routing.pathnames` se define con `defineRouting` de
   `next-intl/routing` y su tipo es
   `Record<string, Record<Locale, string> | string>` (o similar, dependiendo de la versión).
   Verificar en `node_modules/next-intl/dist/types/routing/types.d.ts` /
   `node_modules/next-intl/dist/types/routing/config.d.ts` la forma exacta del tipo de
   `pathnames` para v4.13.0 antes de implementar — si TypeScript se queja del acceso
   `routing.pathnames[PROJECT_DETAIL_PATHNAME][loc]`, puede requerirse un cast o un
   `as const` adicional sobre el objeto `pathnames` en `i18n/routing.ts` (ver sección
   "Riesgos" más abajo — **no modificar `i18n/routing.ts`** salvo que sea estrictamente
   necesario para el tipado, y si se hace, documentarlo).
2. **`project.name`/`project.description` ya son strings localizados** porque `getProjects(locale)`
   importa `content/{locale}/projects.ts` — no requiere namespace de mensajes adicional.
3. **`notFound()` para `projectId` inválido**: `generateMetadata` puede devolver `{}` si el
   proyecto no existe (caso límite, ya que `generateStaticParams` solo genera params
   válidos; en producción esta rama no debería ejecutarse para rutas estáticas, pero es
   defensivo y evita un `throw` en metadata). El `notFound()` real sigue ocurriendo en el
   `default export` (página), sin cambios.
4. **Reutilización del array `routing.locales`** (`['es', 'en']`) para iterar — coherente
   con el resto del código (`generateStaticParams` ya itera `routing.locales`).
5. Si se prefiere extraer esta lógica de "construir alternates desde pathnames" a un helper
   en `lib/` (p. ej. `lib/metadata.ts`) para reutilizarla entre home y detalle, es una
   mejora opcional **no obligatoria** para este cambio — el alcance mínimo es inline en
   cada `generateMetadata`. Si se decide extraer, el helper de home no necesitaría
   `pathnames` (solo `routing.locales`/`defaultLocale`), así que el helper compartido
   debería cubrir ambos casos (con/sin `pathnames`) o ser dos helpers separados. **No es
   obligatorio**; documentarlo aquí para que `/opsx:apply` no lo trate como bloqueante.

---

## 3. Fechas del timeline localizadas (TDD)

### 3.1 Test Vitest (nuevo) para `TimelineItem`/`formatDate`

**Archivo nuevo**: `c:\Users\migue\Documents\Proyectos\miguealguacil\components\ui\__tests__\TimelineItem.test.tsx`

No existe test previo de `TimelineItem` — es un archivo **nuevo**. Sigue el patrón de
`components/ui/__tests__/SectionHeading.test.tsx` / `SkillChip.test.tsx` /
`ProjectCard.test.tsx` (componentes `ui/` sin async ni `next-intl/server`, por lo que
probablemente **no necesitan mocks de next-intl** — `TimelineItem` es un componente
síncrono que recibe `locale` como prop simple, sin llamar a `getLocale`/`getTranslations`
directamente).

**Qué debe testear** (mínimo, TDD — este test debe FALLAR antes de 3.2):

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TimelineItem } from '../TimelineItem'
import type { ExperienceItem } from '@/lib/types'

const baseItem: ExperienceItem = {
  id: 'e1',
  role: 'AI Engineer',
  company: 'Acme',
  startDate: '2024-12',
  endDate: null,
  location: 'Remote',
  bullets: ['Did things'],
}

describe('TimelineItem', () => {
  it('formats the date in Spanish when locale is "es"', () => {
    render(<TimelineItem item={baseItem} presentLabel="Presente" locale="es" />)
    expect(screen.getByText(/dic 2024/i)).toBeInTheDocument()
  })

  it('formats the date in English when locale is "en"', () => {
    render(<TimelineItem item={baseItem} presentLabel="Present" locale="en" />)
    expect(screen.getByText(/Dec 2024/)).toBeInTheDocument()
    expect(screen.queryByText(/DIC/)).not.toBeInTheDocument()
  })
})
```

**Notas sobre el test:**
- El escenario crítico de la spec (`experience-section/spec.md`) es: `locale='en'` +
  `startDate='2024-12'` → debe mostrar `'Dec 2024'`, **no** `'DIC 2024'`. El segundo test
  cubre exactamente ese caso (incluyendo la aserción negativa `queryByText(/DIC/)`).
- El primer test (`es` → `'dic 2024'`) cubre el escenario equivalente en español de la
  spec (Decisión 5 / scenario "Formato de fecha localizado en español").
- `toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })` produce `'dic 2024'`
  (minúsculas, sin punto) en Node/V8 — usar matcher case-insensitive (`/dic 2024/i`) o
  ajustar a la salida exacta si V8 difiere; verificar al ejecutar el test (paso 3.3) y
  ajustar el regex si es necesario, sin cambiar la intención del test.
- `toLocaleDateString('en-US', { month: 'short', year: 'numeric' })` produce `'Dec 2024'`
  (con mayúscula inicial) — el test usa `/Dec 2024/` (sin `i`) para distinguir explícitamente
  de `'DIC 2024'` (el bug actual, que sería formateado con `'es-ES'` y mostraría `'dic 2024'`
  en minúsculas realmente — pero el hallazgo de la auditoría dice "DIC 2024" en mayúsculas,
  posiblemente por CSS `uppercase` aplicado en `TimelineItem.tsx` línea 23:
  `className="font-mono text-xs text-muted shrink-0 uppercase tracking-wide"`. El test
  Vitest con Testing Library/jsdom **no aplica CSS** `text-transform: uppercase`, por lo que
  el texto real en el DOM seguirá siendo `'dic 2024'` (es) / `'Dec 2024'` (en) — el
  `uppercase` es solo visual. El test debe comprobar el contenido del nodo de texto, no el
  render visual con CSS, por lo que `/Dec 2024/` y `/dic 2024/i` son correctos para jsdom.
- Si tras ejecutar el test V8 produce variantes inesperadas (p. ej. con punto: `'dic. 2024'`
  en algunas configuraciones de `Intl`), ajustar el matcher a `/dic\.?\s*2024/i` — pero
  intentar primero sin el punto, ya que `month: 'short'` con `es-ES` en Node moderno
  normalmente da `'dic'` sin punto.

### 3.2 Pasar `locale` desde `Timeline` a `TimelineItem` + actualizar `formatDate`

**Archivos a modificar:**
- `c:\Users\migue\Documents\Proyectos\miguealguacil\components\ui\TimelineItem.tsx`
- `c:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\Timeline.tsx`

#### `components/ui/TimelineItem.tsx` — contenido final

```tsx
import type { ExperienceItem } from '@/lib/types'

type SupportedLocale = 'es' | 'en'

interface TimelineItemProps {
  item: ExperienceItem
  presentLabel: string
  locale: SupportedLocale
}

const DATE_LOCALE_MAP: Record<SupportedLocale, string> = {
  es: 'es-ES',
  en: 'en-US',
}

function formatDate(dateStr: string, locale: SupportedLocale): string {
  const [year, month] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString(DATE_LOCALE_MAP[locale], { month: 'short', year: 'numeric' })
}

export function TimelineItem({ item, presentLabel, locale }: TimelineItemProps) {
  const startFormatted = formatDate(item.startDate, locale)
  const endFormatted = item.endDate ? formatDate(item.endDate, locale) : presentLabel

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

**Notas:**
- `SupportedLocale = 'es' | 'en'` es un tipo local al componente (más simple que importar
  `routing.locales` aquí; `TimelineItem` es un componente `ui/` que no debería depender de
  `i18n/routing.ts`). Si se prefiere máxima consistencia, se puede tipar como
  `(typeof routing.locales)[number]` importando `routing` desde `@/i18n/routing` — **no
  obligatorio**, ambas opciones son válidas; el tipo local `'es' | 'en'` es más simple y
  suficiente porque `Timeline.tsx` ya recibe el locale validado del request (vía
  `getLocale()`, que a su vez next-intl garantiza que es uno de `routing.locales`).
- `DATE_LOCALE_MAP` mapea exactamente `es → 'es-ES'` y `en → 'en-US'` (Decisión 5 de
  `design.md`).

#### `components/sections/Timeline.tsx` — cambio

Diff conceptual: pasar `locale` (ya resuelto en la línea `const locale = await getLocale()`,
existente) como prop a `TimelineItem`.

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TimelineItem } from '@/components/ui/TimelineItem'
import { getSectionAnchorId } from '@/lib/navigation'
import type { ExperienceItem } from '@/lib/types'

interface TimelineProps {
  experience: ExperienceItem[]
}

export async function Timeline({ experience }: TimelineProps) {
  const t = await getTranslations('sections')
  const tl = await getTranslations('timeline')
  const locale = await getLocale()

  return (
    <section id={getSectionAnchorId(locale, 'experience')} className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="03" title={t('experience')} />
      <div className="space-y-10">
        {experience.map((item, i) => (
          <SlideUp key={item.id} delay={i * 0.08}>
            <TimelineItem item={item} presentLabel={tl('present')} locale={locale as 'es' | 'en'} />
          </SlideUp>
        ))}
      </div>
    </section>
  )
}
```

**Notas:**
- `getLocale()` de `next-intl/server` devuelve `Promise<string>` (tipo `Locale` de
  `use-intl`, que en este proyecto es efectivamente `'es' | 'en'` por `routing.locales`,
  pero el tipo declarado es `string` o `Locale` genérico). Se usa `locale as 'es' | 'en'`
  para satisfacer el tipo `SupportedLocale` de `TimelineItem`. Si se prefiere evitar el
  `as`, se puede tipar `SupportedLocale` en `TimelineItem.tsx` como
  `(typeof routing.locales)[number]` y pasar `locale` directamente si su tipo inferido ya
  es compatible — pero lo más simple y consistente con el resto del archivo (que ya hace
  `getSectionAnchorId(locale, 'experience')` donde `getSectionAnchorId(locale: string, ...)`
  acepta `string`) es el cast explícito `as 'es' | 'en'` solo en el punto de paso a
  `TimelineItem`.
- El test existente `components/sections/__tests__/Timeline.test.tsx` mockea
  `getLocale: () => mockLocale()` devolviendo `'es'`/`'en'` — seguirá funcionando sin
  cambios, ya que el mock ya devuelve un string válido y `Timeline` simplemente lo reenvía.
  **Verificar** que tras el cambio el test sigue pasando (no debería requerir modificación,
  pero ejecutarlo en 3.3/4.1 para confirmar).

### 3.3 Verificar que el test de 3.1 pasa

Ejecutar (el agente, no delegar):
```powershell
npx vitest run components/ui/__tests__/TimelineItem.test.tsx
```
Debe pasar. Si no pasa por diferencias de formato de `Intl` (p. ej. `'dic. 2024'` vs
`'dic 2024'`), ajustar el regex del test (no la implementación) salvo que el formato
obtenido sea claramente incorrecto (p. ej. si devolviera `'DIC 2024'` en mayúsculas desde
`Intl` mismo, lo cual no debería ocurrir con `'es-ES'` + `month: 'short'`).

---

## Riesgos / ambigüedades adicionales detectados

1. **Tipado de `routing.pathnames` en next-intl v4.13.0** (sección 2.5): el acceso
   `routing.pathnames['/proyectos/[projectId]']['en']` debería tipar como `string`, pero
   `defineRouting` puede inferir `pathnames` como un tipo más laxo
   (`Record<string, string | Record<string, string>>`) si TypeScript no infiere bien el
   objeto literal de `i18n/routing.ts`. **Acción**: antes de escribir `generateMetadata` en
   2.5, leer
   `node_modules/next-intl/dist/types/routing/types.d.ts` y
   `node_modules/next-intl/dist/types/routing/defineRouting.d.ts` para confirmar el tipo
   resultante de `routing.pathnames`. Si TypeScript se queja, la solución más simple y
   localizada es un type guard/cast explícito en el propio `generateMetadata`
   (`pathnamesForRoute[loc] as string`), **sin tocar** `i18n/routing.ts`.

2. **`generateMetadata` y `setRequestLocale`**: la documentación de next-intl recomienda que
   `setRequestLocale` se llame en el componente de página (no solo en `generateMetadata`).
   En este plan, `setRequestLocale(locale)` se llama dentro del `default export` de
   `HomePage`/`ProjectDetailPage` (sección 1.2) y, por separado, `generateMetadata` recibe
   `locale` vía `params` y lo pasa explícitamente a `getTranslations({ locale, ... })`
   (home) o usa `getProjects(locale)` directamente (detalle) — **no depende** de que
   `setRequestLocale` ya se haya ejecutado, por lo que el orden relativo entre
   `generateMetadata` y el render de la página (que Next.js no garantiza) no es un
   problema para este plan.

3. **`app/[locale]/layout.tsx` ahora es `async`** (ya lo era, por `await params` y
   `getMessages()`), pero ahora además hace `await params` ANTES del guard `notFound()` y
   de `setRequestLocale`. Esto es coherente con el código actual de
   `app/[locale]/layout.tsx` (que ya hacía `await params` primero). Sin cambios de
   comportamiento en este punto, solo se añade `setRequestLocale` después del guard.

4. **Fuentes (`next/font/google`)**: al mover la inicialización de las 3 fuentes
   (`Space_Grotesk`, `Inter`, `JetBrains_Mono`) de `app/layout.tsx` a
   `app/[locale]/layout.tsx`, verificar que `next/font/google` sigue funcionando igual
   declarado en un archivo bajo un segmento dinámico — es un patrón estándar (los ejemplos
   oficiales de next-intl con App Router declaran las fuentes en
   `app/[locale]/layout.tsx`), no debería haber problema, pero es el cambio estructural más
   grande de este plan y debe verificarse visualmente en el E2E (fuentes correctas
   cargadas, sin FOUT/FOIT distinto al actual).

5. **`SmoothScroll` y `Header`/`Footer` ahora dentro de `NextIntlClientProvider` Y dentro de
   `ThemeProvider`** (antes, `Header`/`Footer` estaban solo dentro de
   `NextIntlClientProvider`, en un componente padre `RootLayout` separado que a su vez
   envolvía con `ThemeProvider > SmoothScroll`). El anidamiento profundo cambia pero el
   **orden relativo** de providers respecto a `Header`/`Footer`/`children` se mantiene
   (`ThemeProvider` fuera, `NextIntlClientProvider` dentro de `ThemeProvider`,
   `SmoothScroll` dentro de `NextIntlClientProvider`, y `Header`/`main`/`Footer` dentro de
   `SmoothScroll`) — esto es lo que estaba implícito en el árbol de componentes ya que
   `app/[locale]/layout.tsx` (con `NextIntlClientProvider`) se renderizaba como `children`
   de `app/layout.tsx` (con `ThemeProvider > SmoothScroll`). El nuevo archivo simplemente
   aplana ambos en uno, preservando el orden. **No debería haber regresión**, pero es el
   punto más sensible para el E2E (paso 5.4/5.5).

6. **`Header`/`Footer` import paths**: confirmar que
   `@/components/layout/Header` y `@/components/layout/Footer` siguen siendo válidos
   (alias `@` resuelve a la raíz del proyecto vía `tsconfig.json` `paths: { "@/*": ["./*"] }`)
   — sin cambios, ya se usaban así en `app/[locale]/layout.tsx` original.

---

## Resumen de archivos por tarea

| Tarea | Archivo | Acción |
|---|---|---|
| 1.1 | `app/layout.tsx` | Eliminar |
| 1.1 | `app/[locale]/layout.tsx` | Reescribir completo (root layout fusionado) |
| 1.2 | `app/[locale]/page.tsx` | Modificar (añadir `setRequestLocale`) |
| 1.2 | `app/[locale]/proyectos/[projectId]/page.tsx` | Modificar (añadir `setRequestLocale`) |
| 2.2 | `messages/es.json` | Modificar (añadir namespace `metadata`) |
| 2.2 | `messages/en.json` | Modificar (añadir namespace `metadata`) |
| 2.4 | `app/[locale]/page.tsx` | Modificar (añadir `generateMetadata`) |
| 2.5 | `app/[locale]/proyectos/[projectId]/page.tsx` | Modificar (añadir `generateMetadata`) |
| 3.1 | `components/ui/__tests__/TimelineItem.test.tsx` | Crear (nuevo) |
| 3.2 | `components/ui/TimelineItem.tsx` | Modificar (`locale` prop + `formatDate`) |
| 3.2 | `components/sections/Timeline.tsx` | Modificar (pasar `locale` a `TimelineItem`) |

Archivos NO afectados (confirmado, fuera de alcance): `i18n/request.ts`, `i18n/routing.ts`
(salvo posible cast de tipos si surge problema de tipado en 2.5, ver Riesgo 1),
`app/[locale]/proyectos/page.tsx` (no existe), `app/globals.css`,
`app/favicon.ico`/`icon.svg`/`apple-icon.png`, `content/{es,en}/*.ts` (no se modifica
contenido del portfolio).
