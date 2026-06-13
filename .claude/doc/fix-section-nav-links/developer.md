# Plan técnico — fix-section-nav-links

Plan a nivel de archivos para `/opsx:apply`. Cubre las secciones 1 y 2 de
`openspec/changes/fix-section-nav-links/tasks.md` (helper de navegación +
componentes Header/Nav/Hero/ProjectDetail). No repite la motivación ni las
decisiones de diseño (ver `proposal.md` / `design.md` / `specs/site-layout/spec.md`).

Resumen de la solución: nuevo helper `getSectionHref(locale, sectionId)` en
`lib/navigation.ts` que devuelve `/#sectionId` (locale por defecto `es`) o
`/en#sectionId` (locale `en`, **sin** barra antes de `#`). Header, Nav, Hero y
ProjectDetail (Server Components async) obtienen el locale con `getLocale()`
de `next-intl/server` y construyen los hrefs con este helper.

---

## 1. `lib/navigation.ts` (nuevo archivo)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\lib\navigation.ts`

Sigue el estilo de `lib/content.ts` (funciones exportadas, sin clases, JSDoc
opcional breve). Sin nuevas dependencias; usa `routing` de `@/i18n/routing`.

```ts
import { routing } from '@/i18n/routing'

/**
 * Devuelve el href a la home del locale activo seguido del ancla de sección,
 * de forma que funcione tanto desde la home (scroll suave) como desde
 * cualquier otra página (navegación completa a la home + ancla).
 *
 * - locale por defecto (`es`, sin prefijo): `/#sectionId`
 * - otros locales (`en`): `/en#sectionId` (sin barra antes de `#`, para que
 *   el pathname coincida exactamente con `/en` y se evite un redirect 308
 *   por trailing slash al navegar dentro de la home).
 *
 * `sectionId` debe coincidir exactamente con el `id` HTML de la sección
 * destino (`<section id="...">` en `app/[locale]/page.tsx`).
 */
export function getSectionHref(locale: string, sectionId: string): string {
  const home = locale === routing.defaultLocale ? '/' : `/${locale}`
  return `${home}#${sectionId}`
}
```

**Notas:**
- Export nombrado (no default), igual que `getPersonal`, `getProjects`, etc. en `lib/content.ts`.
- Firma exacta requerida por `design.md`: `getSectionHref(locale: string, sectionId: string): string`.
- No usar `routing.locales` ni validar `locale` contra la lista — si llega un
  locale desconocido, simplemente no coincidirá con `defaultLocale` y se
  tratará como no-default (comportamiento aceptable, no es objeto de este fix).
- Import del alias `@/i18n/routing` — confirmar que `tsconfig.json` resuelve
  `@` a la raíz del proyecto (ya configurado, ver `vitest.config.ts` alias
  `'@': path.resolve(__dirname, '.')`).

---

## 2. `lib/__tests__/navigation.test.ts` (nuevo archivo, TDD — escribir ANTES de `lib/navigation.ts`)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\lib\__tests__\navigation.test.ts`

No existe actualmente el directorio `lib/__tests__/`; créalo. El patrón
`include` de `vitest.config.ts` (`**/__tests__/**/*.{ts,tsx}`) ya lo cubre,
no requiere cambios de config.

```ts
import { describe, it, expect } from 'vitest'
import { getSectionHref } from '../navigation'

describe('getSectionHref', () => {
  it('returns root + anchor for the default locale (es)', () => {
    expect(getSectionHref('es', 'hero')).toBe('/#hero')
    expect(getSectionHref('es', 'proyectos')).toBe('/#proyectos')
  })

  it('returns locale-prefixed path + anchor without trailing slash for non-default locales (en)', () => {
    expect(getSectionHref('en', 'hero')).toBe('/en#hero')
    expect(getSectionHref('en', 'contacto')).toBe('/en#contacto')
  })
})
```

**Notas:**
- Import relativo `../navigation` (no `@/lib/navigation`) — consistente con
  estar dentro de `lib/__tests__/`; ambos formatos funcionan gracias al alias,
  pero el relativo es más simple y no depende de resolución de alias en este
  caso. Si se prefiere consistencia con el resto del repo, usar
  `@/lib/navigation` también es válido — cualquiera de las dos formas es
  aceptable, pero usa una sola de forma consistente.
- Verificar explícitamente que el resultado para `en` **no** contiene `/en/#`
  (sin barra antes del `#`) — esto es el núcleo del fix del redirect 308. Los
  `toBe('/en#hero')` ya lo cubren porque son comparaciones de igualdad estricta.
- Paso 1.3 de `tasks.md`: ejecutar `npm run test -- navigation` y confirmar
  que pasa tras implementar `lib/navigation.ts`.

---

## 3. `components/layout/Nav.tsx` (modificar)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\layout\Nav.tsx`

**Contenido actual** (referencia, líneas 1-27 del archivo leído):
```ts
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

**Nuevo contenido:**
```ts
import { getLocale, getTranslations } from 'next-intl/server'
import { getSectionHref } from '@/lib/navigation'

const NAV_ITEMS = [
  { key: 'projects', sectionId: 'proyectos' },
  { key: 'stack', sectionId: 'stack' },
  { key: 'experience', sectionId: 'experiencia' },
  { key: 'education', sectionId: 'educacion' },
  { key: 'contact', sectionId: 'contacto' },
] as const

export async function Nav() {
  const t = await getTranslations('nav')
  const locale = await getLocale()

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.key}
          href={getSectionHref(locale, item.sectionId)}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors"
        >
          {t(item.key)}
        </a>
      ))}
    </nav>
  )
}
```

**Cambios concretos:**
- Import adicional: `getLocale` desde `next-intl/server` (mismo módulo que
  `getTranslations`, un solo import combinado).
- Nuevo import: `import { getSectionHref } from '@/lib/navigation'`.
- `NAV_ITEMS`: cada objeto cambia `href: '#proyectos'` → `sectionId: 'proyectos'`
  (quitar el `#`). Mantener el mismo orden y los mismos `key` (`projects`,
  `stack`, `experience`, `education`, `contact`) — estos `key` se usan para
  `t(item.key)` y deben seguir coincidiendo con `messages/{es,en}.json` →
  `nav.projects`, `nav.stack`, `nav.experience`, `nav.education`, `nav.contact`
  (no tocar `messages/`, ya existen).
- `sectionId` de cada item debe coincidir EXACTAMENTE con los `id` de
  `<section id="...">` en `app/[locale]/page.tsx` (`proyectos`, `stack`,
  `experiencia`, `educacion`, `contacto`) — verificar que no hay discrepancias
  (p. ej. `experience` vs `experiencia`); usar los mismos valores que ya
  estaban en los hrefs (`#experiencia`, `#educacion`, etc., en español, no
  traducidos).
- `const t = await getTranslations('nav')` se mantiene tal cual.
- `getSectionHref(locale, item.sectionId)` reemplaza directamente `item.href`
  como valor de `href={...}`.

---

## 4. `components/layout/__tests__/Nav.test.tsx` (modificar)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\layout\__tests__\Nav.test.tsx`

**Contenido actual** (referencia completa, 26 líneas):
```ts
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))

describe('Nav', () => {
  it('renders 4 nav links', async () => {
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(4)
  })

  it('links point to section anchors', async () => {
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs.some(h => h?.startsWith('#'))).toBe(true)
  })
})
```

**Problema:** el mock de `next-intl/server` no incluye `getLocale`, así que
`Nav.tsx` fallará en `await getLocale()` (será `undefined` no es función) tras
el cambio. Y el segundo test (`hrefs.some(h => h?.startsWith('#'))`) deja de
ser cierto: ahora los hrefs son `/#proyectos`, etc., no `#proyectos`.

**Nuevo contenido propuesto** — se añade `getLocale` al mock y se parametriza
por locale (`es` y `en`) para cubrir ambos casos descritos en `tasks.md` 2.1:

```ts
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))

describe('Nav', () => {
  it('renders 5 nav links', async () => {
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })

  it('links point to home anchors for the default locale (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toEqual([
      '/#proyectos',
      '/#stack',
      '/#experiencia',
      '/#educacion',
      '/#contacto',
    ])
  })

  it('links point to locale-prefixed home anchors for non-default locale (en)', async () => {
    mockLocale.mockResolvedValue('en')
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toEqual([
      '/en#proyectos',
      '/en#stack',
      '/en#experiencia',
      '/en#educacion',
      '/en#contacto',
    ])
  })
})
```

**Notas críticas:**
- `vi.mock('next-intl/server', ...)` se hoistea por Vitest al inicio del
  módulo (igual que en otros tests), pero la factory **puede** referenciar
  `mockLocale` porque `vi.fn()` se declara antes del `vi.mock` y Vitest permite
  referenciar variables declaradas con `vi.fn`/`const` en el ámbito del módulo
  siempre que no dependan de imports — patrón ya usado en
  `ProjectDetail.test.tsx` (`getLocale: async () => 'es'`, fijo). Si surge
  algún problema de hoisting con `mockLocale`, alternativa más simple y
  segura: dos `describe` separados, cada uno con su propio `vi.mock` +
  `vi.resetModules()` antes del `import('../Nav')`, o directamente devolver un
  valor fijo por test reasignando `vi.mocked(getLocale)` tras importar. Dado
  que `ProjectDetail.test.tsx` ya usa con éxito `getLocale: async () => 'es'`
  como mock estático, el patrón con `vi.fn` + `mockResolvedValue` es análogo y
  debería funcionar sin problemas porque `vi.mock` se ejecuta de forma
  diferida (lazy) cuando el módulo se importa dinámicamente con
  `await import('../Nav')` dentro de cada test.
- Cambié `toBeGreaterThanOrEqual(4)` a `toHaveLength(5)` porque ahora
  `NAV_ITEMS` tiene 5 elementos (`projects`, `stack`, `experience`,
  `education`, `contact`) y es más preciso comprobar la longitud exacta y el
  orden de los hrefs. Si se prefiere mantener el test original sin riesgo,
  se puede dejar `toBeGreaterThanOrEqual(5)`, pero `toHaveLength(5)` es más
  estricto y válido dado que `Nav` no renderiza otros `<a>`.
- El test `links point to section anchors` original (que comprobaba
  `startsWith('#')`) se sustituye completamente — ya no aplica.
- Los `sectionId` usados en las aserciones (`proyectos`, `stack`,
  `experiencia`, `educacion`, `contacto`) deben coincidir exactamente con los
  definidos en `NAV_ITEMS` del paso 3.

---

## 5. `components/layout/Header.tsx` (modificar)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\layout\Header.tsx`

**Contenido actual** (38 líneas, ya leído arriba) — `locale` ya se obtiene en
la línea 8 (`const locale = await getLocale()`) y se usa para `getPersonal(locale)`.
Solo hace falta:

1. Importar `getSectionHref`.
2. Reemplazar `href="#hero"` por `href={getSectionHref(locale, 'hero')}`.

**Diff conceptual:**
```ts
import { getLocale, getTranslations } from 'next-intl/server'
import { getPersonal } from '@/lib/content'
import { getSectionHref } from '@/lib/navigation'   // [NUEVO]
import { Nav } from './Nav'
import { ThemeToggle } from './ThemeToggle'
import { LocaleToggle } from './LocaleToggle'

export async function Header() {
  const locale = await getLocale()
  const personal = await getPersonal(locale)
  const t = await getTranslations('nav')

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-default">
      <div className="max-w-[1200px] mx-auto px-5 md:px-20 h-16 flex items-center justify-between">
        <a
          href={getSectionHref(locale, 'hero')}   // [CAMBIO] antes: href="#hero"
          className="font-mono text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          miguealguacil
        </a>
        {/* ... resto sin cambios ... */}
```

**Notas:**
- No se necesita ninguna otra modificación: `locale` ya está disponible en el
  scope desde la línea 8 (`getLocale()` ya se llama para `getPersonal(locale)`).
- `sectionId` para el logo: `'hero'` — debe coincidir con `<section id="hero">`
  en `components/sections/Hero.tsx` (línea 17, ya existe).

---

## 6. `components/layout/__tests__/Header.test.tsx` (nuevo archivo)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\layout\__tests__\Header.test.tsx`

No existe actualmente (`Header.tsx` no tiene test). Crear siguiendo el patrón
de `Nav.test.tsx` / `ProjectDetail.test.tsx`. `Header` también llama a
`getPersonal(locale)` (de `@/lib/content`, que hace `import(`@/content/${locale}/personal`)`)
y a `Nav` (Server Component anidado, que también llama `getTranslations` y
`getLocale`) — hay que mockear todo lo necesario para que `await Header()` no
falle.

**Mocks necesarios:**
- `next-intl/server`: `getTranslations` (devuelve `(key) => key`) y `getLocale`
  (parametrizable, igual patrón que en `Nav.test.tsx`).
- `@/lib/content`: mockear `getPersonal` para que no intente cargar
  `content/{locale}/personal` real (aunque podría funcionar sin mock porque el
  contenido real existe, es más robusto y rápido mockearlo, y evita
  acoplar el test a datos de contenido reales).
- `Nav`, `ThemeToggle`, `LocaleToggle`: Header los renderiza como componentes
  hijos. `Nav` es async (Server Component) y usa los mismos mocks de
  `next-intl/server` — como el mock de `next-intl/server` es compartido a
  nivel de módulo, `Nav` heredará el mismo `getLocale`/`getTranslations`, así
  que no es necesario mockear `Nav` por separado, PERO si se quiere aislar el
  test del Header únicamente al logo, es más simple mockear `./Nav`,
  `./ThemeToggle`, `./LocaleToggle` como componentes triviales. Recomendación:
  mockear los tres para mantener el test enfocado y evitar fallos en cascada
  si `Nav`/`ThemeToggle`/`LocaleToggle` cambian su propia implementación.

**Contenido propuesto:**
```ts
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))

vi.mock('@/lib/content', () => ({
  getPersonal: async () => ({
    name: 'Test User',
    title: 'AI Engineer',
    bio: 'Test bio',
    email: 'test@example.com',
    linkedin: 'https://linkedin.com/in/test',
    github: 'https://github.com/test',
    location: 'Test City',
    cvUrl: '/cv/cv-miguel-benitez-es.pdf',
  }),
}))

vi.mock('./Nav', () => ({
  Nav: () => <nav data-testid="nav-mock" />,
}))
vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle-mock" />,
}))
vi.mock('./LocaleToggle', () => ({
  LocaleToggle: () => <button data-testid="locale-toggle-mock" />,
}))

describe('Header', () => {
  it('renders the logo link pointing to the home hero anchor for the default locale (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { Header } = await import('../Header')
    render(await Header())
    const logo = screen.getByRole('link', { name: 'miguealguacil' })
    expect(logo).toHaveAttribute('href', '/#hero')
  })

  it('renders the logo link pointing to the locale-prefixed hero anchor for non-default locale (en)', async () => {
    mockLocale.mockResolvedValue('en')
    const { Header } = await import('../Header')
    render(await Header())
    const logo = screen.getByRole('link', { name: 'miguealguacil' })
    expect(logo).toHaveAttribute('href', '/en#hero')
  })
})
```

**Notas:**
- El archivo es `.tsx` (no `.ts`) porque usa JSX en los mocks de
  `./Nav`/`./ThemeToggle`/`./LocaleToggle` — requiere que el `tsconfig`/vitest
  procesen JSX, lo cual ya está configurado (`@vitejs/plugin-react` en
  `vitest.config.ts`).
- `vi.mock('./Nav', ...)`, `vi.mock('./ThemeToggle', ...)`,
  `vi.mock('./LocaleToggle', ...)` usan rutas relativas porque `Header.tsx`
  importa con rutas relativas (`'./Nav'`, etc.) — Vitest resuelve el mock por
  la ruta tal como aparece en el import del módulo bajo test, así que el path
  del mock debe coincidir literalmente con el import de `Header.tsx` (`'./Nav'`,
  `'./ThemeToggle'`, `'./LocaleToggle'`).
- `mockLocale` con `vi.fn` + `mockResolvedValue` sigue el mismo patrón que en
  `Nav.test.tsx` (sección 4) — mantener consistencia entre ambos tests.
- El nombre accesible del link del logo es el texto `miguealguacil` (no hay
  `aria-label`), por eso `getByRole('link', { name: 'miguealguacil' })`
  funciona directamente.
- Si surgen problemas con el mock de `@/lib/content` por la forma en que
  `getPersonal` hace `import(`@/content/${locale}/personal`)` dinámicamente,
  el mock de módulo completo (`vi.mock('@/lib/content', ...)`) evita ese
  problema por completo porque sustituye la función entera.

---

## 7. `components/sections/Hero.tsx` (modificar)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\Hero.tsx`

**Contenido actual** (75 líneas, ya leído arriba). `Hero` ya es `async` y usa
`getTranslations('hero')` (línea 13). Hay que:

1. Importar `getLocale` desde `next-intl/server` (junto a `getTranslations`).
2. Importar `getSectionHref` desde `@/lib/navigation`.
3. Obtener `const locale = await getLocale()`.
4. Reemplazar `href="#proyectos"` (línea 46, CTA `cta_projects`) por
   `href={getSectionHref(locale, 'proyectos')}`.
5. Reemplazar `href="#contacto"` (línea 54, CTA `cta_contact`) por
   `href={getSectionHref(locale, 'contacto')}`.

**Diff conceptual:**
```tsx
import { getLocale, getTranslations } from 'next-intl/server'   // [CAMBIO] +getLocale
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { MagneticButton } from '@/components/animations/MagneticButton'
import { WireframeBackground } from '@/components/ui/WireframeBackground'
import { getSectionHref } from '@/lib/navigation'                // [NUEVO]
import type { PersonalInfo } from '@/lib/types'

interface HeroProps {
  personal: PersonalInfo
}

export async function Hero({ personal }: HeroProps) {
  const t = await getTranslations('hero')
  const locale = await getLocale()                                // [NUEVO]

  return (
    <section
      id="hero"
      className="relative overflow-hidden min-h-screen flex items-center py-24 md:py-32 border-b border-default"
    >
      {/* ... sin cambios hasta los CTAs ... */}
      <FadeIn delay={0.5}>
        <div className="flex gap-4 flex-wrap">
          <MagneticButton>
            <a
              href={getSectionHref(locale, 'proyectos')}          // [CAMBIO] antes: href="#proyectos"
              className="inline-flex items-center gap-2 bg-accent text-background font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              {t('cta_projects')}
            </a>
          </MagneticButton>
          <MagneticButton>
            <a
              href={getSectionHref(locale, 'contacto')}            // [CAMBIO] antes: href="#contacto"
              className="inline-flex items-center gap-2 border border-default text-primary font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-surface-hover transition-colors"
            >
              {t('cta_contact')}
            </a>
          </MagneticButton>
          <MagneticButton>
            <a
              href={personal.cvUrl}
              download
              {/* ... sin cambios, sigue siendo personal.cvUrl ... */}
            >
              {t('cta_cv')}
            </a>
          </MagneticButton>
        </div>
      </FadeIn>
    </section>
  )
}
```

**Notas:**
- El tercer CTA (`cta_cv`, `href={personal.cvUrl}`) **no se toca** — sigue
  apuntando al PDF del CV, no es un ancla de sección.
- `id="hero"` del `<section>` no cambia — sigue siendo el destino de
  `getSectionHref(locale, 'hero')` usado por el Header.

---

## 8. `components/sections/__tests__/Hero.test.tsx` (modificar)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\__tests__\Hero.test.tsx`

**Contenido actual** (53 líneas, ya leído arriba). El mock de
`next-intl/server` actual es:
```ts
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))
```
Esto **rompe** tras el cambio porque `Hero.tsx` llamará `await getLocale()` y
`getLocale` no existe en el mock → `TypeError: getLocale is not a function`.

**Cambios:**
1. Añadir `getLocale` al mock de `next-intl/server`, parametrizable por test
   (mismo patrón `vi.fn` + `mockResolvedValue` que en `Nav.test.tsx` y
   `Header.test.tsx`).
2. Añadir dos tests nuevos (o adaptar) para comprobar los hrefs de
   `cta_projects` y `cta_contact` en `es` y `en`, según tasks.md 2.5.
3. Mantener los tests existentes (`renders the name`, `renders the bio`,
   `renders the title`, `renders the CV download CTA...`) — solo necesitan que
   `getLocale` esté mockeado para no romperse (pueden usar el valor por
   defecto `'es'`).

**Nuevo contenido propuesto:**
```ts
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PersonalInfo } from '@/lib/types'

const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...p}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
}))

const mockPersonal: PersonalInfo = {
  name: 'Test User',
  title: 'AI Engineer',
  bio: 'Test bio here',
  email: 'test@example.com',
  linkedin: 'https://linkedin.com/in/test',
  github: 'https://github.com/test',
  location: 'Test City',
  cvUrl: '/cv/cv-miguel-benitez-es.pdf',
}

describe('Hero', () => {
  it('renders the name', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('renders the bio', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByText('Test bio here')).toBeInTheDocument()
  })

  it('renders the title', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByText('AI Engineer')).toBeInTheDocument()
  })

  it('renders the CV download CTA with correct href and download attribute', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    const cvLink = screen.getByRole('link', { name: 'cta_cv' })
    expect(cvLink).toHaveAttribute('href', '/cv/cv-miguel-benitez-es.pdf')
    expect(cvLink).toHaveAttribute('download')
  })

  it('renders cta_projects and cta_contact hrefs as home anchors for the default locale (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByRole('link', { name: 'cta_projects' })).toHaveAttribute('href', '/#proyectos')
    expect(screen.getByRole('link', { name: 'cta_contact' })).toHaveAttribute('href', '/#contacto')
  })

  it('renders cta_projects and cta_contact hrefs as locale-prefixed home anchors for non-default locale (en)', async () => {
    mockLocale.mockResolvedValue('en')
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByRole('link', { name: 'cta_projects' })).toHaveAttribute('href', '/en#proyectos')
    expect(screen.getByRole('link', { name: 'cta_contact' })).toHaveAttribute('href', '/en#contacto')
  })
})
```

**Notas:**
- `getByRole('link', { name: 'cta_projects' })` funciona porque el mock de
  `getTranslations` devuelve `(key) => key`, así que `t('cta_projects')` →
  `'cta_projects'` (texto literal del link), igual que ya hace el test
  existente con `'cta_cv'`.
- Si los tests anteriores (`renders the name`, etc.) no resetean
  `mockLocale` entre tests y el orden de ejecución importa, recordar que
  Vitest no garantiza aislamiento de mocks entre `it()` salvo que se llame
  `vi.clearAllMocks()`/`beforeEach`. Como `mockLocale` por defecto resuelve
  `'es'` y solo se reasigna en los dos últimos tests, no hay problema de orden
  siempre que el valor por defecto (`'es'`) sea válido para los primeros 4
  tests (lo es, `getSectionHref('es', ...)` siempre devuelve un string válido,
  no se comprueba en esos tests).
- Opcional pero recomendable: añadir `afterEach(() => mockLocale.mockResolvedValue('es'))`
  o `beforeEach` para evitar fugas de estado entre archivos de test si se
  ejecutan en el mismo worker — no es estrictamente necesario porque cada
  `describe`/archivo tiene su propio módulo, pero es buena práctica si se
  reutiliza el patrón en múltiples `it` del mismo archivo.

---

## 9. `components/sections/ProjectDetail.tsx` (modificar)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\ProjectDetail.tsx`

**Cambio único:** sustituir la línea 18 (lógica ad-hoc de `backHref`) por una
llamada a `getSectionHref(locale, 'proyectos')`.

**Contenido actual relevante (líneas 1-18):**
```ts
import { getLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { routing } from '@/i18n/routing'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import type { Project } from '@/lib/types'

interface ProjectDetailProps {
  project: Project
}

export async function ProjectDetail({ project }: ProjectDetailProps) {
  const t = await getTranslations('projectDetail')
  const tp = await getTranslations('project')
  const locale = await getLocale()
  const backHref = locale === routing.defaultLocale ? '/#proyectos' : `/${locale}/#proyectos`
```

**Nuevo contenido (líneas 1-18):**
```ts
import { getLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { getSectionHref } from '@/lib/navigation'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import type { Project } from '@/lib/types'

interface ProjectDetailProps {
  project: Project
}

export async function ProjectDetail({ project }: ProjectDetailProps) {
  const t = await getTranslations('projectDetail')
  const tp = await getTranslations('project')
  const locale = await getLocale()
  const backHref = getSectionHref(locale, 'proyectos')
```

**Cambios concretos:**
- Eliminar el import `import { routing } from '@/i18n/routing'` — tras el
  cambio, `routing` ya no se usa en este archivo (verificar con una búsqueda
  en el archivo completo que no hay otros usos de `routing.*`; según el
  contenido leído, la única referencia es la línea 18).
- Añadir `import { getSectionHref } from '@/lib/navigation'`.
- Reemplazar la línea de `backHref` por `const backHref = getSectionHref(locale, 'proyectos')`.
- El resto del archivo (líneas 20-173) no cambia.

---

## 10. `components/sections/__tests__/ProjectDetail.test.tsx` (verificar, sin cambios funcionales esperados)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\__tests__\ProjectDetail.test.tsx`

El mock actual de `next-intl/server` ya incluye `getLocale: async () => 'es'`
(línea 7), por lo que **no requiere cambios** para que `ProjectDetail.tsx`
siga funcionando tras sustituir la lógica de `backHref`.

El test relevante (líneas 156-162):
```ts
it('renders a back link to the projects section', async () => {
  const { ProjectDetail } = await import('../ProjectDetail')
  render(await ProjectDetail({ project: baseProject }))
  const back = screen.getByRole('link', { name: 'back' })
  expect(back).toHaveAttribute('href', '/#proyectos')
})
```

Con `locale === 'es'` (mockeado), `getSectionHref('es', 'proyectos')` →
`'/#proyectos'` — **idéntico** al resultado de la lógica ad-hoc anterior para
`es` (`locale === routing.defaultLocale ? '/#proyectos' : ...`). Este test
debe seguir pasando **sin modificaciones**.

**Acción:** no modificar este archivo. Solo ejecutarlo como parte de la
verificación global (`npm run test`) para confirmar que sigue en verde.
Si se desea (opcional, no requerido por `tasks.md`), se podría añadir un test
adicional con `getLocale: async () => 'en'` para comprobar `'/en#proyectos'`
(antes habría sido `'/en/#proyectos'` con la lógica ad-hoc), pero **no es una
tarea obligatoria** según `tasks.md` 2.7 — el criterio de aceptación explícito
es que el test existente para `es` siga pasando.

---

## Resumen de archivos

| Archivo | Acción |
|---|---|
| `lib/navigation.ts` | Crear |
| `lib/__tests__/navigation.test.ts` | Crear (TDD, antes de `lib/navigation.ts`) |
| `components/layout/Nav.tsx` | Modificar (`NAV_ITEMS`, `getLocale`, `getSectionHref`) |
| `components/layout/__tests__/Nav.test.tsx` | Modificar (mock `getLocale`, nuevos hrefs es/en) |
| `components/layout/Header.tsx` | Modificar (logo `href` con `getSectionHref`) |
| `components/layout/__tests__/Header.test.tsx` | Crear |
| `components/sections/Hero.tsx` | Modificar (`getLocale`, CTAs con `getSectionHref`) |
| `components/sections/__tests__/Hero.test.tsx` | Modificar (mock `getLocale`, nuevos tests CTAs es/en) |
| `components/sections/ProjectDetail.tsx` | Modificar (`backHref` con `getSectionHref`, quitar import `routing`) |
| `components/sections/__tests__/ProjectDetail.test.tsx` | Sin cambios (verificar que sigue pasando) |

---

## Orden de implementación recomendado (TDD)

1. `lib/__tests__/navigation.test.ts` (falla) → `lib/navigation.ts` (pasa).
   `npm run test -- navigation`.
2. `components/layout/__tests__/Nav.test.tsx` (actualizar, falla) →
   `components/layout/Nav.tsx` (pasa).
3. `components/layout/__tests__/Header.test.tsx` (crear, falla) →
   `components/layout/Header.tsx` (pasa).
4. `components/sections/__tests__/Hero.test.tsx` (actualizar, falla) →
   `components/sections/Hero.tsx` (pasa).
5. `components/sections/ProjectDetail.tsx` (modificar) — verificar que
   `ProjectDetail.test.tsx` (sin cambios) sigue en verde.
6. `npm run lint && npm run test && npm run build` (sección 3 de `tasks.md`).
7. E2E con Playwright MCP (sección 4 de `tasks.md`) — incluye verificación de
   los 5 escenarios descritos en `specs/site-layout/spec.md` + toggle de tema +
   animaciones del Hero.

---

## Notas generales / riesgos a vigilar durante `/opsx:apply`

- **Hoisting de `vi.mock`**: Vitest hoistea `vi.mock(...)` al inicio del
  archivo, pero las *factory functions* se ejecutan de forma diferida (lazy)
  cuando el módulo mockeado se importa por primera vez. El patrón
  `const mockLocale = vi.fn(...)` declarado ANTES de `vi.mock(...)` y
  referenciado dentro de la factory (`getLocale: () => mockLocale()`) es
  seguro en Vitest porque `vi.fn` no depende de imports externos (a diferencia
  de variables que vengan de un módulo importado, que sí darían
  "Cannot access before initialization"). Si al ejecutar `npm run test`
  apareciera un error de hoisting, la alternativa segura es usar
  `vi.doMock` + `vi.resetModules()` + `await import(...)` dentro de cada test,
  o simplemente duplicar el `describe` con mocks estáticos por locale
  (`getLocale: async () => 'es'` / `getLocale: async () => 'en'`) en archivos
  de test separados — pero el patrón propuesto ya se usa con éxito en
  proyectos similares y debería funcionar.
- **`sectionId` deben coincidir con los `id` HTML reales** — antes de marcar
  como completas las tareas 2.2/2.4/2.6, verificar en
  `app/[locale]/page.tsx` que las secciones tienen `id="proyectos"`,
  `id="stack"`, `id="experiencia"`, `id="educacion"`, `id="contacto"` (y
  `id="hero"` ya confirmado en `Hero.tsx` línea 17). Si algún `id` real difiere
  del valor usado en `NAV_ITEMS`/`getSectionHref`, el helper generará un href
  que no apunta a ningún elemento — corregir el `sectionId` para que coincida,
  NO el `id` HTML (fuera de alcance de este cambio).
- **No tocar `messages/{es,en}.json`**: el `proposal.md` confirma "Sin cambios
  en `content/` ni `messages/`". Los `key` de `NAV_ITEMS` (`projects`, `stack`,
  `experience`, `education`, `contact`) ya existen en ambos `messages/*.json`
  bajo `nav.*` y no cambian.
- **`routing` import en `ProjectDetail.tsx`**: tras eliminar su único uso
  (`routing.defaultLocale`), eliminar también el import
  `import { routing } from '@/i18n/routing'` para evitar un error de ESLint
  (`no-unused-vars` / `@typescript-eslint/no-unused-vars`) que rompería
  `npm run lint`.
- **Next.js 16 / Server Components async**: `getLocale()` y `getTranslations()`
  de `next-intl/server` son funciones async ya usadas en estos mismos
  componentes (`Header.tsx`, `ProjectDetail.tsx`) — no hay novedad de API de
  Next.js 16 involucrada en este cambio; es next-intl, no Next.js. No es
  necesario consultar `node_modules/next/dist/docs/` para esta tarea concreta,
  pero si surge alguna duda sobre `Link`/anchors/`scroll-behavior` en App
  Router, revisar ahí antes de asumir comportamiento de versiones previas.


---

## Addendum: localización de anclas de sección (tasks 1.4-1.6, 2.7-2.11, 3.1-3.3)

Cubre la ampliación de alcance descrita en `design.md` (Decisiones 1-3): el
`id` HTML de cada sección (y por tanto el ancla generada por `getSectionHref`)
debe estar en el idioma del locale activo. `hero` y `stack` se mantienen
invariables. No repite la motivación (ver `design.md`); aquí solo el plan a
nivel de archivos.

Resumen de la solución: `lib/navigation.ts` añade un tipo `SectionKey`
(palabras canónicas en inglés, iguales a las claves `nav.*` de
`messages/{es,en}.json`), un mapa `SECTION_ANCHORS: Record<SectionKey,
Record<Locale, string>>` y una función `getSectionAnchorId(locale,
sectionKey)`. `getSectionHref` se reescribe para delegar en
`getSectionAnchorId`. Todos los componentes que antes pasaban un literal
español (`'proyectos'`, `'contacto'`, etc.) a `getSectionHref` pasan ahora la
`SectionKey` correspondiente (`'projects'`, `'contact'`, etc.). Las cuatro
secciones de la home (`ProjectsGrid`, `Timeline`, `Education`, `Contact`)
calculan su `id` con `getSectionAnchorId(locale, sectionKey)` en lugar de un
literal estático.

---

### A.1 `lib/navigation.ts` (modificar — tasks 1.5)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\lib\navigation.ts`

**Contenido actual** (4 líneas exportables, ya implementado en fase 1):

```ts
import { routing } from '@/i18n/routing'

/**
 * ... (JSDoc existente) ...
 */
export function getSectionHref(locale: string, sectionId: string): string {
  const home = locale === routing.defaultLocale ? '/' : `/${locale}`
  return `${home}#${sectionId}`
}
```

**Nuevo contenido completo del archivo:**

```ts
import { routing } from '@/i18n/routing'

/**
 * Claves canónicas de sección, en inglés, iguales a las claves de
 * traducción `nav.*` en `messages/{es,en}.json` (`projects`, `stack`,
 * `experience`, `education`, `contact`), más `hero`.
 */
export type SectionKey = 'hero' | 'projects' | 'stack' | 'experience' | 'education' | 'contact'

type Locale = (typeof routing.locales)[number]

/**
 * Mapa de cada `SectionKey` al `id` HTML real de la sección en cada locale.
 * `hero` y `stack` son identificadores técnicos invariables; el resto se
 * traduce para que la URL/ancla esté en el idioma del locale activo
 * (p. ej. `/en#projects` en lugar de `/en#proyectos`).
 */
const SECTION_ANCHORS: Record<SectionKey, Record<Locale, string>> = {
  hero: { es: 'hero', en: 'hero' },
  projects: { es: 'proyectos', en: 'projects' },
  stack: { es: 'stack', en: 'stack' },
  experience: { es: 'experiencia', en: 'experience' },
  education: { es: 'educacion', en: 'education' },
  contact: { es: 'contacto', en: 'contact' },
}

/**
 * Devuelve el `id` HTML de la sección `sectionKey` en el idioma de `locale`.
 * Si `locale` no es uno de `routing.locales`, recurre a
 * `routing.defaultLocale` (mismo criterio de fallback que `getSectionHref`).
 */
export function getSectionAnchorId(locale: string, sectionKey: SectionKey): string {
  const anchors = SECTION_ANCHORS[sectionKey]
  return anchors[locale as Locale] ?? anchors[routing.defaultLocale]
}

/**
 * Devuelve el href a la home del locale activo seguido del ancla de sección
 * localizada, de forma que funcione tanto desde la home (scroll suave) como
 * desde cualquier otra página (navegación completa a la home + ancla).
 *
 * - locale por defecto (`es`, sin prefijo): `/#<ancla-es>`
 * - otros locales (`en`): `/en#<ancla-en>` (sin barra antes de `#`, para que
 *   el pathname coincida exactamente con `/en` y se evite un redirect 308
 *   por trailing slash al navegar dentro de la home).
 *
 * El ancla devuelta coincide exactamente con el `id` HTML de la sección
 * destino para ese locale (ver `getSectionAnchorId` / `SECTION_ANCHORS`).
 */
export function getSectionHref(locale: string, sectionKey: SectionKey): string {
  const home = locale === routing.defaultLocale ? '/' : `/${locale}`
  return `${home}#${getSectionAnchorId(locale, sectionKey)}`
}
```

**Cambios concretos:**
- Nuevo tipo exportado `SectionKey` — unión de 6 literales string.
- Nuevo tipo interno `type Locale = (typeof routing.locales)[number]` —
  `routing.locales` es `['es', 'en'] as const` (ver `i18n/routing.ts`), así
  que `Locale = 'es' | 'en'`.
- Nueva constante interna (no exportada) `SECTION_ANCHORS`.
- Nueva función exportada `getSectionAnchorId(locale: string, sectionKey:
  SectionKey): string`.
- `getSectionHref` **cambia su segundo parámetro** de `sectionId: string` a
  `sectionKey: SectionKey` (tipo más estricto) y su cuerpo delega en
  `getSectionAnchorId`. La firma pública sigue siendo
  `getSectionHref(locale: string, sectionKey: SectionKey): string` — el
  cambio de nombre del parámetro (`sectionId` → `sectionKey`) es solo
  cosmético/documental, no afecta a quien llama por posición.

**Notas:**
- `anchors[locale as Locale] ?? anchors[routing.defaultLocale]`: el cast
  `as Locale` es seguro en runtime porque si `locale` no es `'es'` ni `'en'`,
  `anchors[locale as Locale]` será `undefined` (TypeScript no detecta el
  acceso fuera de los literales declarados como error porque el cast lo
  oculta, pero el operador `??` cubre el caso real) y el `??` cae al
  `defaultLocale`. Igual criterio de robustez que la implementación de fase 1
  (que no validaba `locale` contra `routing.locales`).
- No se elimina ni se renombra `getSectionHref` como export — sigue siendo el
  helper usado por Header/Nav/Hero/ProjectDetail; solo cambia el tipo del
  segundo argumento, que ahora DEBE ser una de las 6 `SectionKey`.
- Tras este cambio, **todas las llamadas existentes** a `getSectionHref` con
  literales en español (`'hero'`, `'proyectos'`, `'contacto'`, `'stack'`,
  `'experiencia'`, `'educacion'`) deben actualizarse a sus `SectionKey`
  equivalentes en inglés (`'hero'` no cambia; `'proyectos'` → `'projects'`;
  `'contacto'` → `'contact'`; `'stack'` no cambia; etc.) — TypeScript dará
  error de tipo en cualquier llamada que siga usando un literal español que no
  sea `SectionKey`, lo cual ayuda a localizar todos los puntos a tocar (Header
  ya usa `'hero'`, que es válido en ambos esquemas, así que **no** dará error
  — confirmar manualmente que Header sigue correcto, no hace falta tocarlo).

---

### A.2 `lib/__tests__/navigation.test.ts` (modificar — tasks 1.4)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\lib\__tests__\navigation.test.ts`

**Contenido actual** (15 líneas, fase 1, ya implementado):

```ts
import { describe, it, expect } from 'vitest'
import { getSectionHref } from '../navigation'

describe('getSectionHref', () => {
  it('returns root + anchor for the default locale (es)', () => {
    expect(getSectionHref('es', 'hero')).toBe('/#hero')
    expect(getSectionHref('es', 'proyectos')).toBe('/#proyectos')
  })

  it('returns locale-prefixed path + anchor without trailing slash for non-default locales (en)', () => {
    expect(getSectionHref('en', 'hero')).toBe('/en#hero')
    expect(getSectionHref('en', 'contacto')).toBe('/en#contacto')
  })
})
```

**Nuevo contenido completo del archivo:**

```ts
import { describe, it, expect } from 'vitest'
import { getSectionAnchorId, getSectionHref } from '../navigation'
import type { SectionKey } from '../navigation'

describe('getSectionAnchorId', () => {
  it('returns the Spanish anchor id for translatable sections in es', () => {
    expect(getSectionAnchorId('es', 'projects')).toBe('proyectos')
    expect(getSectionAnchorId('es', 'experience')).toBe('experiencia')
    expect(getSectionAnchorId('es', 'education')).toBe('educacion')
    expect(getSectionAnchorId('es', 'contact')).toBe('contacto')
  })

  it('returns the English anchor id for translatable sections in en', () => {
    expect(getSectionAnchorId('en', 'projects')).toBe('projects')
    expect(getSectionAnchorId('en', 'experience')).toBe('experience')
    expect(getSectionAnchorId('en', 'education')).toBe('education')
    expect(getSectionAnchorId('en', 'contact')).toBe('contact')
  })

  it('returns invariable anchor ids for hero and stack in both locales', () => {
    const invariableSections: SectionKey[] = ['hero', 'stack']
    for (const section of invariableSections) {
      expect(getSectionAnchorId('es', section)).toBe(section)
      expect(getSectionAnchorId('en', section)).toBe(section)
    }
  })
})

describe('getSectionHref', () => {
  it('returns root + anchor for the default locale (es)', () => {
    expect(getSectionHref('es', 'hero')).toBe('/#hero')
    expect(getSectionHref('es', 'projects')).toBe('/#proyectos')
  })

  it('returns locale-prefixed path + localized anchor without trailing slash for non-default locales (en)', () => {
    expect(getSectionHref('en', 'hero')).toBe('/en#hero')
    expect(getSectionHref('en', 'contact')).toBe('/en#contact')
    expect(getSectionHref('en', 'projects')).toBe('/en#projects')
    expect(getSectionHref('en', 'experience')).toBe('/en#experience')
    expect(getSectionHref('en', 'education')).toBe('/en#education')
  })
})
```

**Cambios concretos:**
- Imports adicionales: `getSectionAnchorId` (función) y `SectionKey` (tipo,
  con `import type` en línea separada para evitar problemas con la regla
  ESLint `@typescript-eslint/consistent-type-imports` si está activa).
- Nuevo `describe('getSectionAnchorId', ...)` con 3 tests: `es`, `en`, y
  `hero`/`stack` invariables en ambos locales.
- `describe('getSectionHref', ...)` existente: los dos `it` se actualizan para
  usar `SectionKey` (`'projects'`, `'contact'`, `'experience'`, `'education'`)
  en lugar de los literales españoles (`'proyectos'`, `'contacto'`) que ya NO
  son válidos como segundo argumento tipado (TypeScript fallará en
  `npm run build`/`npm run lint` con esos literales si no son `SectionKey` —
  en este caso `'proyectos'`/`'contacto'` no pertenecen a `SectionKey`, por lo
  que el test ni siquiera compilaría).
  - `getSectionHref('es', 'projects')` sigue siendo `/#proyectos` (anclas en
    `es` no cambian).
  - `getSectionHref('en', ...)` ahora usa anclas localizadas:
    `/en#contact`, `/en#projects`, `/en#experience`, `/en#education` (antes,
    en fase 1, solo se comprobaba `/en#hero` y `/en#contacto` — el valor
    `/en#contacto` ya NO sería correcto tras la ampliación, se sustituye por
    `/en#contact`).
- Verificar que **ningún** test usa ya un literal `string` no perteneciente a
  `SectionKey` como segundo argumento — TypeScript debe compilar sin errores
  (`npm run build` incluye chequeo de tipos).

---

### A.3 `components/layout/Nav.tsx` (modificar — tasks 2.9)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\layout\Nav.tsx`

**Contenido actual** (10 líneas, fase 1, ya implementado):

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { getSectionHref } from '@/lib/navigation'

const NAV_ITEMS = [
  { key: 'projects', sectionId: 'proyectos' },
  { key: 'stack', sectionId: 'stack' },
  { key: 'experience', sectionId: 'experiencia' },
  { key: 'education', sectionId: 'educacion' },
  { key: 'contact', sectionId: 'contacto' },
] as const

export async function Nav() {
  const t = await getTranslations('nav')
  const locale = await getLocale()

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.key}
          href={getSectionHref(locale, item.sectionId)}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors"
        >
          {t(item.key)}
        </a>
      ))}
    </nav>
  )
}
```

**Nuevo contenido completo del archivo:**

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { getSectionHref } from '@/lib/navigation'
import type { SectionKey } from '@/lib/navigation'

const NAV_ITEMS: SectionKey[] = ['projects', 'stack', 'experience', 'education', 'contact']

export async function Nav() {
  const t = await getTranslations('nav')
  const locale = await getLocale()

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_ITEMS.map((key) => (
        <a
          key={key}
          href={getSectionHref(locale, key)}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors"
        >
          {t(key)}
        </a>
      ))}
    </nav>
  )
}
```

**Cambios concretos:**
- `NAV_ITEMS` pasa de un array de objetos `{ key, sectionId }` con `as const`
  a un array tipado `SectionKey[]` con los 5 valores literales
  `['projects', 'stack', 'experience', 'education', 'contact']`. **No** se usa
  `as const` aquí porque el tipo explícito `SectionKey[]` ya es suficiente y
  más legible; `as const` también funcionaría pero no aporta nada adicional
  dado que ya se anota el tipo.
- `import type { SectionKey } from '@/lib/navigation'` — import de tipo en
  línea separada (mismo criterio que A.2).
- En el `.map`, el parámetro cambia de `item` (objeto `{key, sectionId}`) a
  `key` (un `SectionKey` directo). `t(key)` funciona porque `key` (`'projects'`,
  `'stack'`, `'experience'`, `'education'`, `'contact'`) coincide
  EXACTAMENTE con las claves `nav.projects`, `nav.stack`, `nav.experience`,
  `nav.education`, `nav.contact` en `messages/{es,en}.json` (confirmado:
  ambos archivos tienen esas 6 claves bajo `"nav"`, incluyendo `"hero"` y
  `"cv"` que no se usan en `Nav`).
- `getSectionHref(locale, key)` reemplaza `getSectionHref(locale,
  item.sectionId)`.
- El orden de `NAV_ITEMS` (`projects, stack, experience, education, contact`)
  **no cambia** — debe coincidir con el orden esperado en
  `Nav.test.tsx` (ver A.4).

---

### A.4 `components/layout/__tests__/Nav.test.tsx` (modificar — tasks 2.8)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\layout\__tests__\Nav.test.tsx`

**Contenido actual** (52 líneas, fase 1, ya implementado y en verde) — el
mock de `next-intl/server` con `mockLocale` ya existe y NO cambia. Solo
cambian las aserciones del tercer test (`en`).

**Cambio único** — en el test `'links point to locale-prefixed home anchors
for non-default locale (en)'`, sustituir el array `hrefs` esperado:

```ts
// ANTES:
expect(hrefs).toEqual([
  '/en#proyectos',
  '/en#stack',
  '/en#experiencia',
  '/en#educacion',
  '/en#contacto',
])

// DESPUÉS:
expect(hrefs).toEqual([
  '/en#projects',
  '/en#stack',
  '/en#experience',
  '/en#education',
  '/en#contact',
])
```

**El test `'links point to home anchors for the default locale (es)'` NO
cambia** — sigue esperando:

```ts
expect(hrefs).toEqual([
  '/#proyectos',
  '/#stack',
  '/#experiencia',
  '/#educacion',
  '/#contacto',
])
```

(con `getSectionAnchorId('es', 'projects')` = `'proyectos'`, etc., estos
valores son idénticos a los de fase 1 — confirmando que `es` no se ve
afectado por la ampliación).

**Notas:**
- El test `'renders 5 nav links'` (`toHaveLength(5)`) no cambia — `NAV_ITEMS`
  sigue teniendo 5 elementos.
- Ningún cambio en el mock de `next-intl/server` (`mockLocale` + `getLocale`)
  — ya estaba correcto desde la fase 1.

---

### A.5 `components/sections/Hero.tsx` (modificar — tasks 2.11)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\Hero.tsx`

**Contenido actual relevante** (líneas 46-61, fase 1, ya implementado):

```tsx
<MagneticButton>
  <a
    href={getSectionHref(locale, 'proyectos')}
    className="inline-flex items-center gap-2 bg-accent text-background font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-[var(--color-accent-hover)] transition-colors"
  >
    {t('cta_projects')}
  </a>
</MagneticButton>
<MagneticButton>
  <a
    href={getSectionHref(locale, 'contacto')}
    className="inline-flex items-center gap-2 border border-default text-primary font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-surface-hover transition-colors"
  >
    {t('cta_contact')}
  </a>
</MagneticButton>
```

**Nuevo contenido (mismas líneas):**

```tsx
<MagneticButton>
  <a
    href={getSectionHref(locale, 'projects')}
    className="inline-flex items-center gap-2 bg-accent text-background font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-[var(--color-accent-hover)] transition-colors"
  >
    {t('cta_projects')}
  </a>
</MagneticButton>
<MagneticButton>
  <a
    href={getSectionHref(locale, 'contact')}
    className="inline-flex items-center gap-2 border border-default text-primary font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-surface-hover transition-colors"
  >
    {t('cta_contact')}
  </a>
</MagneticButton>
```

**Cambios concretos:**
- `getSectionHref(locale, 'proyectos')` → `getSectionHref(locale, 'projects')`
  (CTA `cta_projects`).
- `getSectionHref(locale, 'contacto')` → `getSectionHref(locale, 'contact')`
  (CTA `cta_contact`).
- Sin otros cambios: imports, `id="hero"` del `<section>`, tercer CTA
  (`cta_cv`, `personal.cvUrl`) — todo permanece igual.
- `'proyectos'`/`'contacto'` ya NO son valores válidos para el segundo
  argumento de `getSectionHref` (tipo `SectionKey`) tras A.1 — TypeScript
  marcará error de compilación en estas dos líneas si no se actualizan, lo
  que sirve como confirmación adicional de que no queda ningún literal
  obsoleto.

---

### A.6 `components/sections/__tests__/Hero.test.tsx` (modificar — tasks 2.10)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\__tests__\Hero.test.tsx`

**Contenido actual** (73 líneas, fase 1, ya implementado y en verde) — el
mock de `next-intl/server` con `mockLocale` ya existe y NO cambia. Solo
cambian las aserciones del último test (`en`).

**Cambio único** — en el test `'renders cta_projects and cta_contact hrefs
as locale-prefixed home anchors for non-default locale (en)'`:

```ts
// ANTES:
expect(screen.getByRole('link', { name: 'cta_projects' })).toHaveAttribute('href', '/en#proyectos')
expect(screen.getByRole('link', { name: 'cta_contact' })).toHaveAttribute('href', '/en#contacto')

// DESPUÉS:
expect(screen.getByRole('link', { name: 'cta_projects' })).toHaveAttribute('href', '/en#projects')
expect(screen.getByRole('link', { name: 'cta_contact' })).toHaveAttribute('href', '/en#contact')
```

**El test `'renders cta_projects and cta_contact hrefs as home anchors for
the default locale (es)'` NO cambia** — sigue esperando `/#proyectos` y
`/#contacto` (anclas `es` invariables).

**Notas:**
- Resto del archivo (mocks, `mockPersonal`, los otros 4 tests) sin cambios.

---

### A.7 `components/sections/ProjectDetail.tsx` (modificar — tasks 2.7)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\ProjectDetail.tsx`

**Contenido actual** (líneas 1-18, fase 1, ya implementado):

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { getSectionHref } from '@/lib/navigation'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import type { Project } from '@/lib/types'

interface ProjectDetailProps {
  project: Project
}

export async function ProjectDetail({ project }: ProjectDetailProps) {
  const t = await getTranslations('projectDetail')
  const tp = await getTranslations('project')
  const locale = await getLocale()
  const backHref = getSectionHref(locale, 'proyectos')
```

**Cambio único** (línea 18):

```tsx
// ANTES:
const backHref = getSectionHref(locale, 'proyectos')

// DESPUÉS:
const backHref = getSectionHref(locale, 'projects')
```

**Cambios concretos:**
- Único cambio: `'proyectos'` → `'projects'` (`SectionKey`). El import
  `routing` ya se eliminó en fase 1 (no se reintroduce). Ningún otro cambio
  en el archivo.

**Verificación del test existente** (`ProjectDetail.test.tsx`, líneas
156-161):

```ts
it('renders a back link to the projects section', async () => {
  const { ProjectDetail } = await import('../ProjectDetail')
  render(await ProjectDetail({ project: baseProject }))
  const back = screen.getByRole('link', { name: 'back' })
  expect(back).toHaveAttribute('href', '/#proyectos')
})
```

El mock de `next-intl/server` en este archivo fija `getLocale: async () =>
'es'` (línea 7, sin cambios). Con `locale === 'es'`,
`getSectionAnchorId('es', 'projects')` = `'proyectos'` (sin cambios respecto
a `SECTION_ANCHORS`), por lo que `getSectionHref('es', 'projects')` =
`'/#proyectos'` — **idéntico** al resultado anterior. Este test sigue pasando
**sin modificaciones**.

**Acción:** modificar solo `ProjectDetail.tsx` (línea 18). No modificar
`ProjectDetail.test.tsx`.

---

### A.8 Cuatro secciones de la home: `ProjectsGrid.tsx`, `Timeline.tsx`, `Education.tsx`, `Contact.tsx` (modificar — tasks 3.2)

Cada uno de estos 4 archivos sigue el mismo patrón de cambio: añadir
`getLocale` al import de `next-intl/server`, importar `getSectionAnchorId` de
`@/lib/navigation`, llamar a `const locale = await getLocale()`, y sustituir
el `id` literal del `<section>` por `id={getSectionAnchorId(locale,
'<sectionKey>')}`.

#### A.8.1 `components/sections/ProjectsGrid.tsx`

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\ProjectsGrid.tsx`

**Contenido actual** (líneas 1-25):

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
    viewDetails: tp('view_details'),
  }

  return (
    <section id="proyectos" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
```

**Nuevo contenido (mismas líneas):**

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { AnimatedProjectCard } from '@/components/ui/AnimatedProjectCard'
import { getSectionAnchorId } from '@/lib/navigation'
import type { Project } from '@/lib/types'

interface ProjectsGridProps {
  projects: Project[]
}

export async function ProjectsGrid({ projects }: ProjectsGridProps) {
  const t = await getTranslations('sections')
  const tp = await getTranslations('project')
  const locale = await getLocale()

  const labels = {
    viewRepo: tp('view_repo'),
    viewBackend: tp('view_backend'),
    viewMod: tp('view_mod'),
    viewDemo: tp('view_demo'),
    viewDetails: tp('view_details'),
  }

  return (
    <section id={getSectionAnchorId(locale, 'projects')} className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
```

**Cambios concretos:**
- `getTranslations` → `getLocale, getTranslations` (import combinado de
  `next-intl/server`).
- Nuevo import `import { getSectionAnchorId } from '@/lib/navigation'`.
- Nueva línea `const locale = await getLocale()` tras `tp`.
- `<section id="proyectos" ...>` → `<section id={getSectionAnchorId(locale,
  'projects')} ...>`.
- Resto del archivo (líneas 26-43) sin cambios.

#### A.8.2 `components/sections/Timeline.tsx`

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\Timeline.tsx`

**Contenido actual** (líneas 1-16):

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
```

**Nuevo contenido (mismas líneas):**

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
```

**Cambios concretos:**
- `getTranslations` → `getLocale, getTranslations`.
- Nuevo import `getSectionAnchorId` de `@/lib/navigation`.
- Nueva línea `const locale = await getLocale()` tras `tl`.
- `<section id="experiencia" ...>` → `<section id={getSectionAnchorId(locale,
  'experience')} ...>`.
- Resto del archivo (líneas 17-28) sin cambios.

#### A.8.3 `components/sections/Education.tsx`

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\Education.tsx`

**Contenido actual** (líneas 1-17):

```tsx
import { getTranslations } from 'next-intl/server'
import { ArrowUpRight } from 'lucide-react'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { EducationData } from '@/lib/types'

interface EducationProps {
  data: EducationData
}

export async function Education({ data }: EducationProps) {
  const t = await getTranslations('sections')
  const te = await getTranslations('education')

  return (
    <section id="educacion" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
```

**Nuevo contenido (mismas líneas):**

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowUpRight } from 'lucide-react'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getSectionAnchorId } from '@/lib/navigation'
import type { EducationData } from '@/lib/types'

interface EducationProps {
  data: EducationData
}

export async function Education({ data }: EducationProps) {
  const t = await getTranslations('sections')
  const te = await getTranslations('education')
  const locale = await getLocale()

  return (
    <section id={getSectionAnchorId(locale, 'education')} className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
```

**Cambios concretos:**
- `getTranslations` → `getLocale, getTranslations`.
- Nuevo import `getSectionAnchorId` de `@/lib/navigation`.
- Nueva línea `const locale = await getLocale()` tras `te`.
- `<section id="educacion" ...>` → `<section id={getSectionAnchorId(locale,
  'education')} ...>`.
- Resto del archivo (líneas 18-73) sin cambios.

#### A.8.4 `components/sections/Contact.tsx`

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\Contact.tsx`

**Contenido actual** (líneas 1-16):

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
```

**Nuevo contenido (mismas líneas):**

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/FadeIn'
import { MagneticButton } from '@/components/animations/MagneticButton'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getSectionAnchorId } from '@/lib/navigation'
import type { PersonalInfo } from '@/lib/types'

interface ContactProps {
  personal: PersonalInfo
}

export async function Contact({ personal }: ContactProps) {
  const t = await getTranslations('sections')
  const tc = await getTranslations('contact')
  const locale = await getLocale()

  return (
    <section id={getSectionAnchorId(locale, 'contact')} className="py-24 max-w-[1200px] mx-auto px-5 md:px-20">
```

**Cambios concretos:**
- `getTranslations` → `getLocale, getTranslations`.
- Nuevo import `getSectionAnchorId` de `@/lib/navigation`.
- Nueva línea `const locale = await getLocale()` tras `tc`.
- `<section id="contacto" ...>` → `<section id={getSectionAnchorId(locale,
  'contact')} ...>`.
- Resto del archivo (líneas 17-72) sin cambios.

---

### A.9 Tests de las cuatro secciones (modificar — tasks 3.1)

Cada uno de los 4 archivos de test sigue el mismo patrón: añadir `getLocale`
al mock de `next-intl/server` (patrón `mockLocale` ya usado en
`Nav.test.tsx`/`Hero.test.tsx`/`Header.test.tsx`), y añadir un nuevo bloque de
tests que verifica el `id` del `<section>` renderizado para `es` y `en`.

**Patrón común del mock** (sustituye el `vi.mock('next-intl/server', ...)`
actual de cada archivo, que solo tiene `getTranslations`):

```ts
// ANTES (en los 4 archivos):
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))

// DESPUÉS (en los 4 archivos):
const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))
```

**Patrón común para obtener el `<section>` renderizado** — `<section>` no
tiene un rol ARIA implícito específico (es `generic`/sin rol), por lo que
`getByRole` no es la vía más directa; usar `container.querySelector('section')`
del resultado de `render(...)`:

```ts
const { container } = render(await ProjectsGrid({ projects: mockProjects }))
const section = container.querySelector('section')
expect(section).toHaveAttribute('id', 'proyectos')
```

`render` de `@testing-library/react` devuelve `{ container, ... }` — ya se usa
`render(...)` en los 4 archivos, solo hay que destructurar `container`
adicionalmente (o usar `screen` para otras aserciones y `container` solo para
esta nueva).

#### A.9.1 `components/sections/__tests__/ProjectsGrid.test.tsx`

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\__tests__\ProjectsGrid.test.tsx`

**Contenido actual** (52 líneas) — mock de `next-intl/server` en líneas 5-7
(solo `getTranslations`), sin `getLocale`.

**Cambios:**
1. Mock de `next-intl/server` (líneas 5-7): aplicar el patrón común de A.9
   (añadir `mockLocale` + `getLocale`).
2. Añadir nuevo `it` dentro de `describe('ProjectsGrid', ...)`:

```ts
it('renders the section with the localized anchor id (es)', async () => {
  mockLocale.mockResolvedValue('es')
  const { ProjectsGrid } = await import('../ProjectsGrid')
  const { container } = render(await ProjectsGrid({ projects: mockProjects }))
  expect(container.querySelector('section')).toHaveAttribute('id', 'proyectos')
})

it('renders the section with the localized anchor id (en)', async () => {
  mockLocale.mockResolvedValue('en')
  const { ProjectsGrid } = await import('../ProjectsGrid')
  const { container } = render(await ProjectsGrid({ projects: mockProjects }))
  expect(container.querySelector('section')).toHaveAttribute('id', 'projects')
})
```

**Notas:**
- El resto del archivo (mocks de `framer-motion`, `@/i18n/navigation`,
  `mockProjects`, los 3 tests existentes) no cambia.
- `mockLocale` por defecto resuelve `'es'`, por lo que los 3 tests existentes
  (que no llaman a `mockLocale.mockResolvedValue(...)`) siguen funcionando sin
  cambios — `getLocale()` devuelve `'es'` y `getSectionAnchorId('es',
  'projects')` = `'proyectos'`, que no afecta a ninguna aserción existente
  (ninguna de ellas comprueba el `id` del `<section>`).

#### A.9.2 `components/sections/__tests__/Timeline.test.tsx`

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\__tests__\Timeline.test.tsx`

**Contenido actual** (33 líneas) — mock de `next-intl/server` en líneas 5-7
(solo `getTranslations`), sin `getLocale`.

**Cambios:**
1. Mock de `next-intl/server` (líneas 5-7): aplicar el patrón común de A.9.
2. Añadir nuevo `it` dentro de `describe('Timeline', ...)`:

```ts
it('renders the section with the localized anchor id (es)', async () => {
  mockLocale.mockResolvedValue('es')
  const { Timeline } = await import('../Timeline')
  const { container } = render(await Timeline({ experience: mockExperience }))
  expect(container.querySelector('section')).toHaveAttribute('id', 'experiencia')
})

it('renders the section with the localized anchor id (en)', async () => {
  mockLocale.mockResolvedValue('en')
  const { Timeline } = await import('../Timeline')
  const { container } = render(await Timeline({ experience: mockExperience }))
  expect(container.querySelector('section')).toHaveAttribute('id', 'experience')
})
```

**Notas:**
- Resto del archivo (mocks de `framer-motion`, `mockExperience`, los 2 tests
  existentes) sin cambios.

#### A.9.3 `components/sections/__tests__/Education.test.tsx`

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\__tests__\Education.test.tsx`

**Contenido actual** (31 líneas) — mock de `next-intl/server` en líneas 5-7
(solo `getTranslations`), sin `getLocale`.

**Cambios:**
1. Mock de `next-intl/server` (líneas 5-7): aplicar el patrón común de A.9.
2. Añadir nuevo `it` dentro de `describe('Education', ...)`:

```ts
it('renders the section with the localized anchor id (es)', async () => {
  mockLocale.mockResolvedValue('es')
  const { Education } = await import('../Education')
  const { container } = render(await Education({ data: mockEducation }))
  expect(container.querySelector('section')).toHaveAttribute('id', 'educacion')
})

it('renders the section with the localized anchor id (en)', async () => {
  mockLocale.mockResolvedValue('en')
  const { Education } = await import('../Education')
  const { container } = render(await Education({ data: mockEducation }))
  expect(container.querySelector('section')).toHaveAttribute('id', 'education')
})
```

**Notas:**
- Resto del archivo (mocks de `framer-motion`, `mockEducation`, los 2 tests
  existentes) sin cambios.

#### A.9.4 `components/sections/__tests__/Contact.test.tsx`

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\__tests__\Contact.test.tsx`

**Contenido actual** (54 líneas) — mock de `next-intl/server` en líneas 5-7
(solo `getTranslations`), sin `getLocale`.

**Cambios:**
1. Mock de `next-intl/server` (líneas 5-7): aplicar el patrón común de A.9.
2. Añadir nuevo `it` dentro de `describe('Contact', ...)`:

```ts
it('renders the section with the localized anchor id (es)', async () => {
  mockLocale.mockResolvedValue('es')
  const { Contact } = await import('../Contact')
  const { container } = render(await Contact({ personal: mockPersonal }))
  expect(container.querySelector('section')).toHaveAttribute('id', 'contacto')
})

it('renders the section with the localized anchor id (en)', async () => {
  mockLocale.mockResolvedValue('en')
  const { Contact } = await import('../Contact')
  const { container } = render(await Contact({ personal: mockPersonal }))
  expect(container.querySelector('section')).toHaveAttribute('id', 'contact')
})
```

**Notas:**
- Resto del archivo (mocks de `framer-motion`, `mockPersonal`, los 3 tests
  existentes) sin cambios.

---

### A.10 `components/sections/TechStack.tsx` (sin cambios)

Ruta: `C:\Users\migue\Documents\Proyectos\miguealguacil\components\sections\TechStack.tsx`

**No requiere ningún cambio.** Razón: `id="stack"` es uno de los dos valores
invariables en `SECTION_ANCHORS` (`stack: { es: 'stack', en: 'stack' }`,
decisión 1 de `design.md`) — el ancla `#stack` es idéntica en `es` y en `en`.
`Nav.tsx` ya genera `getSectionHref(locale, 'stack')` que para ambos locales
resuelve a `.../#stack`, coincidiendo con el `id="stack"` estático existente
en `TechStack.tsx` sin necesidad de `getLocale`/`getSectionAnchorId`.

No es necesario tampoco un nuevo test para `TechStack.test.tsx` (si existe) —
no hay cambio de comportamiento que verificar. **Acción:** ninguna, en código
ni en tests. (No confundir con A.9: las secciones que SÍ cambian son
`ProjectsGrid`, `Timeline`, `Education`, `Contact` — `TechStack` queda fuera
del bucle de A.8/A.9.)

---

## Resumen de archivos (Addendum)

| Archivo | Acción |
|---|---|
| `lib/navigation.ts` | Modificar (añadir `SectionKey`, `SECTION_ANCHORS`, `getSectionAnchorId`; reescribir `getSectionHref`) |
| `lib/__tests__/navigation.test.ts` | Modificar (tests `getSectionAnchorId` es/en/invariables; actualizar tests `getSectionHref` a `SectionKey` y anclas localizadas en `en`) |
| `components/layout/Nav.tsx` | Modificar (`NAV_ITEMS: SectionKey[]`, `t(key)`, `getSectionHref(locale, key)`) |
| `components/layout/__tests__/Nav.test.tsx` | Modificar (solo expectativas `en` → `/en#projects`, `/en#stack`, `/en#experience`, `/en#education`, `/en#contact`) |
| `components/sections/Hero.tsx` | Modificar (`getSectionHref(locale, 'projects'|'contact')`) |
| `components/sections/__tests__/Hero.test.tsx` | Modificar (solo expectativas `en` → `/en#projects`, `/en#contact`) |
| `components/sections/ProjectDetail.tsx` | Modificar (`backHref = getSectionHref(locale, 'projects')`) |
| `components/sections/__tests__/ProjectDetail.test.tsx` | Sin cambios (verificar que `/#proyectos` (es) sigue pasando) |
| `components/sections/ProjectsGrid.tsx` | Modificar (`getLocale`, `getSectionAnchorId(locale, 'projects')` en `<section id=...>`) |
| `components/sections/__tests__/ProjectsGrid.test.tsx` | Modificar (mock `getLocale` + 2 nuevos tests `id` es/en) |
| `components/sections/Timeline.tsx` | Modificar (`getLocale`, `getSectionAnchorId(locale, 'experience')` en `<section id=...>`) |
| `components/sections/__tests__/Timeline.test.tsx` | Modificar (mock `getLocale` + 2 nuevos tests `id` es/en) |
| `components/sections/Education.tsx` | Modificar (`getLocale`, `getSectionAnchorId(locale, 'education')` en `<section id=...>`) |
| `components/sections/__tests__/Education.test.tsx` | Modificar (mock `getLocale` + 2 nuevos tests `id` es/en) |
| `components/sections/Contact.tsx` | Modificar (`getLocale`, `getSectionAnchorId(locale, 'contact')` en `<section id=...>`) |
| `components/sections/__tests__/Contact.test.tsx` | Modificar (mock `getLocale` + 2 nuevos tests `id` es/en) |
| `components/sections/TechStack.tsx` | Sin cambios (`id="stack"` invariable) |

---

## Orden de implementación recomendado (TDD) — Addendum

1. **1.4**: actualizar `lib/__tests__/navigation.test.ts` (A.2) — añadir
   `describe('getSectionAnchorId', ...)` y actualizar `describe('getSectionHref',
   ...)` con `SectionKey`/anclas `en` localizadas. Ejecutar
   `npm run test -- navigation` → debe **fallar** (compilación TS: `'projects'`/
   `'contact'`/etc. no existen aún como `SectionKey`; `getSectionAnchorId` no
   existe).
2. **1.5**: implementar `lib/navigation.ts` (A.1) — `SectionKey`,
   `SECTION_ANCHORS`, `getSectionAnchorId`, reescribir `getSectionHref`.
3. **1.6**: `npm run test -- navigation` → debe **pasar**.
4. **2.7-2.11**: en este orden:
   - `2.7`: `ProjectDetail.tsx` (A.7) — `'proyectos'` → `'projects'`.
   - `2.8`: `Nav.test.tsx` (A.4) — expectativas `en` localizadas.
   - `2.9`: `Nav.tsx` (A.3) — `NAV_ITEMS: SectionKey[]`.
   - `2.10`: `Hero.test.tsx` (A.6) — expectativas `en` localizadas.
   - `2.11`: `Hero.tsx` (A.5) — `'projects'`/`'contact'`.

   Tras estos 5 cambios, ejecutar `npm run test -- navigation Nav Hero
   ProjectDetail` → deben pasar todos (incluyendo `ProjectDetail.test.tsx` sin
   modificar, A.7).
5. **3.1**: actualizar los 4 archivos de test (A.9: `ProjectsGrid.test.tsx`,
   `Timeline.test.tsx`, `Education.test.tsx`, `Contact.test.tsx`) — mock
   `getLocale` + nuevos tests de `id`. Ejecutar `npm run test -- ProjectsGrid
   Timeline Education Contact` → los 2 nuevos tests por archivo deben
   **fallar** (el `<section>` aún tiene `id` estático en español).
6. **3.2**: implementar los 4 componentes (A.8.1-A.8.4) — `getLocale` +
   `getSectionAnchorId` en `<section id=...>`. `TechStack.tsx` (A.10): sin
   cambios.
7. **3.3**: `npm run test -- ProjectsGrid Timeline Education Contact` → deben
   **pasar** todos (los 2 nuevos + los existentes).
8. Tras 1.4-3.3: `npm run lint && npm run test && npm run build` (sección 4 de
   `tasks.md`) — debe estar todo en verde, incluyendo el resto de tests de
   fase 1 (`Header.test.tsx`, etc.) que no deberían verse afectados.
9. E2E con Playwright MCP (sección 5 de `tasks.md`) — verificar
   específicamente que en `/en` las anclas/`id` son `experience`, `projects`,
   `education`, `contact` (no `experiencia`/`proyectos`/`educacion`/`contacto`),
   y que en `/` (es) siguen siendo `proyectos`/`experiencia`/`educacion`/`contacto`.

---

## Notas generales / riesgos a vigilar — Addendum

- **TypeScript como red de seguridad**: el cambio de `getSectionHref(locale:
  string, sectionId: string)` a `getSectionHref(locale: string, sectionKey:
  SectionKey)` hace que **cualquier** llamada con un literal no perteneciente
  a `SectionKey` (p. ej. un `'proyectos'` o `'contacto'` que se olvidara
  actualizar) falle en `npm run build`/`npm run lint` (chequeo de tipos). Esto
  es intencional: usar el error de compilación para localizar todos los
  puntos a actualizar (Header, Nav, Hero, ProjectDetail) en lugar de depender
  solo de `grep`.
- **`hero` y `stack` no necesitan migración de valor**: ambos ya usaban
  literales (`'hero'`, `'stack'`) que coinciden con su propia `SectionKey` Y
  con su `SECTION_ANCHORS[...]` en ambos locales — `Header.tsx`
  (`getSectionHref(locale, 'hero')`) y la entrada `stack` de `Nav.tsx`/
  `NAV_ITEMS` no requieren ningún cambio de valor, solo (en el caso de
  `Nav.tsx`) el cambio estructural de A.3.
- **`container.querySelector('section')` asume un único `<section>` raíz por
  componente** — confirmado para los 4 componentes (`ProjectsGrid`, `Timeline`,
  `Education`, `Contact`): cada uno devuelve un único `<section id="...">` como
  elemento raíz (sin `<section>` anidados). Si en el futuro se anidara otro
  `<section>`, `querySelector` devolvería el primero en orden de documento
  (que sigue siendo el raíz, por ser ancestro) — no es un riesgo actual.
- **Orden de los `it` con `mockLocale.mockResolvedValue(...)`**: igual que en
  fase 1 (`Hero.test.tsx`, `Nav.test.tsx`), `mockLocale` es un `vi.fn()`
  compartido a nivel de módulo cuyo valor por defecto es `'es'`; los tests que
  llaman `mockLocale.mockResolvedValue('en')` deben ejecutarse sabiendo que
  dejan el mock en `'en'` para tests posteriores en el mismo archivo *si no se
  resetea*. En los 4 archivos de A.9, los 2 nuevos tests (`es` luego `en`) se
  añaden al final del `describe` — los tests existentes (antes de ellos en el
  orden de declaración) seguirán usando el valor por defecto `'es'` la primera
  vez que se ejecuten (Vitest ejecuta los `it` en orden de declaración dentro
  de un `describe`), por lo que no hay riesgo de contaminación hacia atrás. Si
  se quisiera máxima robustez, se podría añadir `afterEach(() =>
  mockLocale.mockResolvedValue('es'))`, pero no es estrictamente necesario
  dado el orden de declaración y que ningún test existente depende de `en`.
- **No se requiere consultar `node_modules/next/dist/docs/`** para este
  addendum — no hay APIs de Next.js 16 nuevas involucradas (todo es
  `next-intl/server` + JSX/`<section id=...>` estándar, ya usado en fase 1).
