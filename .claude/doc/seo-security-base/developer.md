# Plan técnico — `seo-security-base`

Plan de implementación a nivel de archivos para el cambio OpenSpec `seo-security-base`.
Sigue las 9 decisiones cerradas en `openspec/changes/seo-security-base/design.md` (no se
reabren) y mapea 1:1 los 8 grupos de `openspec/changes/seo-security-base/tasks.md`.

Stack relevante confirmado: Next.js `16.2.7` (App Router), `next-intl@4.13`, React `19.2.4`,
Tailwind v4, Vitest `4.1.8` + Testing Library, alias `@` → raíz del repo
(`tsconfig.json` → `"@/*": ["./*"]`, `vitest.config.ts` → mismo alias vía `resolve.alias`).

---

## 0. Resumen de archivos afectados

| Archivo | Tipo | Grupo tasks.md |
|---|---|---|
| `lib/seo.ts` | nuevo | 1, 5 |
| `lib/__tests__/seo.test.ts` | nuevo (test) | 5 |
| `app/[locale]/layout.tsx` | modificado | 1, 5 |
| `app/sitemap.ts` | nuevo | 2 |
| `app/__tests__/sitemap.test.ts` o `app/sitemap.test.ts` | nuevo (test) | 2 |
| `app/robots.ts` | nuevo | 2 |
| `app/robots.test.ts` | nuevo (test) | 2 |
| `lib/security-headers.ts` | nuevo | 3 |
| `lib/__tests__/security-headers.test.ts` | nuevo (test) | 3 |
| `next.config.ts` | modificado | 1 (SITE_URL no aplica aquí), 3 |
| `app/[locale]/opengraph-image.tsx` | nuevo | 4 |
| `app/[locale]/page.tsx` | modificado | 4, 5 |
| `app/[locale]/proyectos/[projectId]/page.tsx` | modificado | 4 |
| `messages/es.json`, `messages/en.json` | modificados (probable, ver §4.4) | 4 |

---

## 1. `lib/seo.ts` (nuevo) — infraestructura SEO compartida

### Contexto leído

- `app/[locale]/layout.tsx` ya define `metadataBase: new URL('https://miguealguacil.com')`.
- `app/[locale]/page.tsx` y `app/[locale]/proyectos/[projectId]/page.tsx` ya calculan
  `alternates.languages` a mano con la lógica:
  ```ts
  const home = locale === routing.defaultLocale ? '/' : `/${locale}`
  ```
  para la home, y para detalle de proyecto:
  ```ts
  const localizedPath = pathnamesForRoute[loc].replace('[projectId]', projectId)
  languages[loc] = loc === routing.defaultLocale ? localizedPath : `/${loc}${localizedPath}`
  ```
- `content/{es,en}/personal.ts` exporta `PersonalInfo` (`name`, `title`, `bio`, `email`,
  `linkedin`, `github`, `location`, `cvUrl`) — todos los campos que necesita el JSON-LD `Person`
  ya existen (Decisión 6, sin cambios en `content/`).

### Exports exactos

```ts
// lib/seo.ts
import type { PersonalInfo } from '@/lib/types'
import { routing } from '@/i18n/routing'

/** URL absoluta del sitio en producción. Única fuente de verdad para
 *  metadataBase, sitemap, robots, OG image y JSON-LD. */
export const SITE_URL = 'https://miguealguacil.com'

/**
 * Devuelve el path absoluto (relativo a SITE_URL, sin dominio) de la home
 * para `locale`, con la misma convención ya usada en
 * app/[locale]/page.tsx (`/` para el locale por defecto, `/en` para el resto).
 */
export function getLocalizedHomePath(locale: string): string {
  return locale === routing.defaultLocale ? '/' : `/${locale}`
}

/**
 * Devuelve la URL absoluta (SITE_URL + path) de la home para `locale`.
 * Para el locale por defecto, evita la doble barra: SITE_URL + '/' = SITE_URL + '' realmente
 * concatenado correctamente -> ver implementación.
 */
export function getAbsoluteUrl(path: string): string {
  // path ya viene con '/' inicial (p. ej. '/', '/en', '/en/projects/foo')
  // Evita doble barra cuando path === '/'
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}

export interface PersonJsonLd {
  '@context': 'https://schema.org'
  '@type': 'Person'
  name: string
  jobTitle: string
  description: string
  email: string
  url: string
  sameAs: string[]
}

/**
 * Construye el objeto JSON-LD `Person` (schema.org) para `locale`, a partir
 * de `content/{locale}/personal.ts` (Decisión 6 de design.md). No añade
 * campos nuevos a `PersonalInfo`.
 */
export function buildPersonJsonLd(locale: string, personal: PersonalInfo): PersonJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personal.name,
    jobTitle: personal.title,
    description: personal.bio,
    email: `mailto:${personal.email}`,
    url: getAbsoluteUrl(getLocalizedHomePath(locale)),
    sameAs: [personal.linkedin, personal.github],
  }
}
```

**Notas de implementación:**

- `getLocalizedHomePath` extrae la lógica ya duplicada en `app/[locale]/page.tsx` (líneas
  25-27). **No es obligatorio** refactorizar `page.tsx` para usarla en el bloque
  `alternates.languages` existente (fuera de alcance, evita un diff no relacionado), pero
  **sí debe usarse** para construir `url` del JSON-LD (tarea 5) y puede reutilizarse también en
  `app/sitemap.ts` (tarea 2) para no repetir el cálculo. Recomendación: usarla en `sitemap.ts` y
  en el JSON-LD; dejar intacto el cálculo de `languages` ya existente en `generateMetadata` de
  `page.tsx`/`proyectos/[projectId]/page.tsx` para minimizar el diff (riesgo de regresión en
  `alternates.languages`, ya cubierto por `fix-ssg-i18n-base`).
- `getAbsoluteUrl` se usa en `sitemap.ts`, `robots.ts` (vía `SITE_URL` directamente, sin pasar
  por la función — `robots.ts` solo necesita `${SITE_URL}/sitemap.xml`) y en el JSON-LD.
- `PersonJsonLd['@context']` y `['@type']` se tipan como literales (`'https://schema.org'`,
  `'Person'`) para que el test pueda comprobar igualdad estricta de tipos además de valor.

### Modificación de `app/[locale]/layout.tsx` (parte 1 — `metadataBase`)

Diff conceptual:

```diff
+import { SITE_URL } from '@/lib/seo'
 ...
 export const metadata: Metadata = {
-  metadataBase: new URL('https://miguealguacil.com'),
+  metadataBase: new URL(SITE_URL),
   title: 'miguealguacil — AI Engineer',
   description: '...',
 }
```

(El cambio de `viewport.themeColor` se trata en la sección 5 de este plan, grupo 5 de tasks.md.)

---

## 2. `app/sitemap.ts` y `app/robots.ts` (TDD) — grupo 2 de tasks.md

### Contexto leído

- `routing` (`i18n/routing.ts`):
  ```ts
  export const routing = defineRouting({
    locales: ['es', 'en'] as const,
    defaultLocale: 'es',
    localePrefix: 'as-needed',
    pathnames: {
      '/proyectos/[projectId]': {
        es: '/proyectos/[projectId]',
        en: '/projects/[projectId]',
      },
    },
  })
  ```
- `getProjects(locale)` (`lib/content.ts`) hace `import(`@/content/${locale}/projects`)` y
  devuelve `Project[]` (tiene `id: string`). **Es async** — `sitemap.ts` debe ser
  `async function sitemap()`.
- `routing.pathnames['/proyectos/[projectId]']` da `{ es: '/proyectos/[projectId]', en:
  '/projects/[projectId]' }`. Mismo patrón ya usado en
  `app/[locale]/proyectos/[projectId]/page.tsx` (`generateMetadata`):
  ```ts
  const localizedPath = pathnamesForRoute[loc].replace('[projectId]', projectId)
  languages[loc] = loc === routing.defaultLocale ? localizedPath : `/${loc}${localizedPath}`
  ```

### 2.1/2.2 — `app/sitemap.ts`

**Tipo de retorno**: `MetadataRoute.Sitemap` (importado de `next`, tipo `Array<{ url, lastModified?,
changeFrequency?, priority?, alternates?: { languages?: Languages<string> } }>` según
`node_modules/next/dist/docs/.../sitemap.md`).

**IMPORTANTE Next.js 16**: el `id` de `generateSitemaps` ahora es una `Promise<string>` (breaking
change v16.0.0), pero **no usamos `generateSitemaps`** — un solo `sitemap.ts` es suficiente (pocas
URLs: 2 home + N proyectos × 2 locales). No hay impacto de ese breaking change aquí.

**Esqueleto**:

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getProjects } from '@/lib/content'
import { SITE_URL, getLocalizedHomePath, getAbsoluteUrl } from '@/lib/seo'

const PROJECT_DETAIL_PATHNAME = '/proyectos/[projectId]' as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  const now = new Date()

  // 1. Home de cada locale
  for (const locale of routing.locales) {
    const languages: Record<string, string> = {}
    for (const loc of routing.locales) {
      languages[loc] = getAbsoluteUrl(getLocalizedHomePath(loc))
    }

    entries.push({
      url: getAbsoluteUrl(getLocalizedHomePath(locale)),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
      alternates: { languages },
    })
  }

  // 2. Cada proyecto, para cada locale
  const pathnamesForRoute = routing.pathnames[PROJECT_DETAIL_PATHNAME]

  for (const locale of routing.locales) {
    const projects = await getProjects(locale)

    for (const project of projects) {
      const languages: Record<string, string> = {}
      for (const loc of routing.locales) {
        const localizedPath = pathnamesForRoute[loc].replace('[projectId]', project.id)
        const path = loc === routing.defaultLocale ? localizedPath : `/${loc}${localizedPath}`
        languages[loc] = getAbsoluteUrl(path)
      }

      const currentPath = pathnamesForRoute[locale].replace('[projectId]', project.id)
      const url =
        locale === routing.defaultLocale ? currentPath : `/${locale}${currentPath}`

      entries.push({
        url: getAbsoluteUrl(url),
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.7,
        alternates: { languages },
      })
    }
  }

  return entries
}
```

**Notas**:
- `SITE_URL` se importa pero puede no usarse directamente si todo pasa por `getAbsoluteUrl`
  (que internamente usa `SITE_URL`) — si el linter de TS marca import sin uso, quitarlo del
  import de `sitemap.ts` (solo usar `getAbsoluteUrl`/`getLocalizedHomePath`).
- `lastModified: now` (un único `new Date()` calculado una vez al inicio de la función) es
  válido — coincide con el patrón de "Generate a localized Sitemap" de la doc oficial. No se pide
  fecha real de modificación de cada proyecto (no existe ese dato en `content/`), por lo que usar
  la fecha de build es aceptable y no contradice ninguna decisión de `design.md`.
- El requirement de `seo-metadata/spec.md` dice "para cada proyecto devuelto por
  `getProjects('es')` ... y su equivalente `/en/projects/<id>`" — el bucle anidado
  `for (locale of routing.locales) { for (project of getProjects(locale)) }` cubre esto
  asumiendo que `content/es/projects.ts` y `content/en/projects.ts` tienen los mismos `id` (ya
  es invariante asumida, documentada en Risks de `design.md`). **No** se debe iterar solo sobre
  `getProjects('es')` y asumir locale `en` — iterar sobre ambos locales produce el mismo
  resultado y es más robusto/simple de testear.

### 2.1 — Test Vitest: `lib/__tests__/sitemap.test.ts` (o `app/__tests__/sitemap.test.ts`)

Sigue el estilo de `lib/__tests__/navigation.test.ts` (describe/it, sin mocks de Next.js —
`sitemap()` es una función pura async que solo depende de `routing` y `getProjects`, ambos
importables directamente en Vitest gracias al alias `@`).

**Ubicación recomendada**: `app/__tests__/sitemap.test.ts` (colocar tests cerca de las
convenciones de archivo de `app/`, ya que `lib/__tests__/` está reservado para helpers de
`lib/`). Si se prefiere mantener todos los tests bajo `lib/__tests__/`, también es válido —
`vitest.config.ts` incluye `**/__tests__/**/*.{ts,tsx}` en cualquier carpeta. **Recomendación
final: `app/__tests__/sitemap.test.ts`** (co-localiza el test con el archivo `app/sitemap.ts`
que prueba, patrón habitual en App Router).

```ts
// app/__tests__/sitemap.test.ts
import { describe, it, expect } from 'vitest'
import sitemap from '../sitemap'
import { getProjects } from '@/lib/content'

describe('sitemap', () => {
  it('includes the home entry for es and en with alternates', async () => {
    const entries = await sitemap()

    const es = entries.find((e) => e.url === 'https://miguealguacil.com')
    const en = entries.find((e) => e.url === 'https://miguealguacil.com/en')

    expect(es).toBeDefined()
    expect(en).toBeDefined()
    expect(es?.changeFrequency).toBe('monthly')
    expect(es?.priority).toBe(1)
    expect(es?.alternates?.languages?.en).toBe('https://miguealguacil.com/en')
    expect(en?.alternates?.languages?.es).toBe('https://miguealguacil.com')
  })

  it('includes an entry per project for es and en with cross-locale alternates', async () => {
    const entries = await sitemap()
    const esProjects = await getProjects('es')

    for (const project of esProjects) {
      const esEntry = entries.find(
        (e) => e.url === `https://miguealguacil.com/proyectos/${project.id}`
      )
      expect(esEntry).toBeDefined()
      expect(esEntry?.changeFrequency).toBe('yearly')
      expect(esEntry?.priority).toBe(0.7)
      expect(esEntry?.alternates?.languages?.en).toBe(
        `https://miguealguacil.com/en/projects/${project.id}`
      )

      const enEntry = entries.find(
        (e) => e.url === `https://miguealguacil.com/en/projects/${project.id}`
      )
      expect(enEntry).toBeDefined()
      expect(enEntry?.alternates?.languages?.es).toBe(
        `https://miguealguacil.com/proyectos/${project.id}`
      )
    }
  })
})
```

### 2.3/2.4 — `app/robots.ts`

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

Coincide exactamente con Decisión 3 de `design.md` y el ejemplo de
`node_modules/next/dist/docs/.../robots.md`.

### 2.3 — Test Vitest: `app/__tests__/robots.test.ts`

```ts
// app/__tests__/robots.test.ts
import { describe, it, expect } from 'vitest'
import robots from '../robots'
import { SITE_URL } from '@/lib/seo'

describe('robots', () => {
  it('allows all user agents and references the sitemap', () => {
    const result = robots()

    expect(result.rules).toEqual({ userAgent: '*', allow: '/' })
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
  })
})
```

### 2.5 — Verificar que pasan: ejecutar `npm run test` tras 2.2 y 2.4 (no antes).

---

## 3. `lib/security-headers.ts` + `next.config.ts` (TDD) — grupo 3 de tasks.md

### Contexto leído

- `next.config.ts` actual:
  ```ts
  import type { NextConfig } from 'next'
  import createNextIntlPlugin from 'next-intl/plugin'

  const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

  const nextConfig: NextConfig = {}

  export default withNextIntl(nextConfig)
  ```
- Doc oficial (`content-security-policy.md`, sección "Without Nonces") confirma el patrón
  `headers()` async en `next.config.js` con `source: '/(.*)'` y un array de `{ key, value }`.
  El ejemplo oficial usa `cspHeader.replace(/\n/g, '')`; nuestro CSP (Decisión 8) se define
  como **una sola línea** desde el principio en `SECURITY_HEADERS`, así que no se necesita ese
  `replace`.
- `headers` es `async function headers()` que devuelve
  `Array<{ source: string; headers: Array<{ key: string; value: string }> }>` (tipo de
  `next.config.ts`, `NextConfig['headers']`).

### `lib/security-headers.ts` — exports exactos

```ts
// lib/security-headers.ts

/**
 * Directiva Content-Security-Policy en una sola línea (sin saltos de línea),
 * patrón "Without Nonces" — ver
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
 * y Decisión 8 de openspec/changes/seo-security-base/design.md.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ') + ';'

/**
 * Cabeceras de seguridad HTTP estáticas aplicadas a todas las rutas
 * (`source: '/(.*)'` en next.config.ts `headers()`). Sin Proxy/nonces,
 * preserva el SSG. Ver Decisión 8 de design.md.
 */
export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
]
```

**Nota sobre el join**: `["a", "b"].join('; ') + ';'` produce `"a; b;"`. Verificar que el
resultado final sea exactamente:

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;
```

que coincide carácter a carácter con el bloque de Decisión 8 de `design.md` (cada directiva
separada por `; `, terminando en `;`). El test (3.1) debe comprobar la presencia de cada
substring, no necesariamente la igualdad exacta del string completo (más robusto a pequeños
cambios de formato).

### 3.1 — Test Vitest: `lib/__tests__/security-headers.test.ts`

```ts
// lib/__tests__/security-headers.test.ts
import { describe, it, expect } from 'vitest'
import { SECURITY_HEADERS } from '../security-headers'

function getHeader(key: string): string | undefined {
  return SECURITY_HEADERS.find((h) => h.key === key)?.value
}

describe('SECURITY_HEADERS', () => {
  it('includes a Content-Security-Policy with the required directives', () => {
    const csp = getHeader('Content-Security-Policy')
    expect(csp).toBeDefined()

    const expectedDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ]

    for (const directive of expectedDirectives) {
      expect(csp).toContain(directive)
    }
  })

  it('includes X-Frame-Options DENY', () => {
    expect(getHeader('X-Frame-Options')).toBe('DENY')
  })

  it('includes X-Content-Type-Options nosniff', () => {
    expect(getHeader('X-Content-Type-Options')).toBe('nosniff')
  })

  it('includes Referrer-Policy strict-origin-when-cross-origin', () => {
    expect(getHeader('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('includes a Permissions-Policy restricting camera, microphone and geolocation', () => {
    const policy = getHeader('Permissions-Policy')
    expect(policy).toBeDefined()
    expect(policy).toContain('camera=()')
    expect(policy).toContain('microphone=()')
    expect(policy).toContain('geolocation=()')
  })
})
```

### 3.3 — Modificación de `next.config.ts`

Diff conceptual completo:

```diff
 import type { NextConfig } from 'next'
 import createNextIntlPlugin from 'next-intl/plugin'
+import { SECURITY_HEADERS } from '@/lib/security-headers'

 const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

-const nextConfig: NextConfig = {}
+const nextConfig: NextConfig = {
+  poweredByHeader: false,
+  async headers() {
+    return [
+      {
+        source: '/(.*)',
+        headers: SECURITY_HEADERS,
+      },
+    ]
+  },
+}

 export default withNextIntl(nextConfig)
```

**RIESGO/AMBIGÜEDAD — alias `@` en `next.config.ts`**: `next.config.ts` se ejecuta con
`tsx`/loader de Next, no siempre respeta `tsconfig.json` `paths` igual que el código de la app.
En Next.js 16 los `next.config.ts` con TypeScript son soportados de forma nativa (transpilados
internamente), pero **la resolución del alias `@/*` dentro de `next.config.ts` no está
garantizada** (es un archivo de configuración fuera del grafo de módulos de la app). Para evitar
fallos de build:

- **Recomendación**: usar un import **relativo** en `next.config.ts`:
  ```ts
  import { SECURITY_HEADERS } from './lib/security-headers'
  ```
  en lugar de `@/lib/security-headers`. Esto es un patrón seguro y no requiere verificar el
  comportamiento del alias en `next.config.ts`. El archivo `lib/security-headers.ts` en sí
  puede seguir usando el alias `@` libremente en sus propios imports si los tuviera (no los
  tiene — es un módulo sin dependencias internas).
- Si `/opsx:apply` confirma que `@/lib/security-headers` funciona en `next.config.ts` (por
  ejemplo, otro `next.config.ts` del ecosistema ya lo hace), puede usarse el alias; en caso de
  duda, preferir el import relativo `./lib/security-headers` por seguridad y simplicidad.

### 3.4 — Verificar que el test de 3.1 pasa (`npm run test` — no requiere build).

---

## 4. Open Graph / Twitter + imagen social — grupo 4 de tasks.md

### 4.1 — `app/[locale]/opengraph-image.tsx` (nuevo)

**Contexto leído**:
- `app/globals.css` define los tokens "Technical Brutalist": fondo oscuro `--color-background:
  #131314`, acento cian `--color-accent: #00dce5` (modo `.dark`, que es el `defaultTheme` del
  `ThemeProvider` — `attribute="class" defaultTheme="dark" enableSystem={false}` en
  `app/[locale]/layout.tsx`). Para la imagen OG (siempre la misma, sin depender de
  `prefers-color-scheme` del visitante) se usa la paleta oscura como identidad de marca
  consistente: fondo `#131314`, texto `#e5e2e3`, acento `#00dce5`.
- `content/{locale}/personal.ts` → `personal.name` y `personal.title` (p. ej. ES: `"Miguel Á.
  Benítez Alguacil"` / `"AI Engineer | GenAI, Agentes y Desarrollo de Producto"`).
- `getPersonal(locale)` en `lib/content.ts` (async, `import(`@/content/${locale}/personal`)`).

**RIESGO resuelto — fuentes `.ttf` para `ImageResponse`** (Open Question 1 de `design.md`):

`node_modules/next/dist/docs/.../image-response.md` confirma: *"Only `ttf`, `otf`, and `woff`
font formats are supported"*. `next/font/google` (usado en `layout.tsx` para Space Grotesk/Inter/
JetBrains Mono) **no expone directamente los binarios `.ttf`** de forma trivial reutilizable
dentro de `ImageResponse` (serían módulos CSS/JS, no archivos de fuente accesibles vía
`readFile`). El proyecto **no tiene** ningún `.ttf`/`.otf`/`.woff` en `public/` ni en `content/`
(`Glob **/*.ttf` solo encontró el `Geist-Regular.ttf` interno de `node_modules/next/dist/compiled/
@vercel/og`, que es la fuente fallback que usa Satori/`@vercel/og` cuando no se provee `fonts:`).

**Recomendación (resuelve la Open Question)**: **no añadir binarios de fuente custom**. Usar
`fontFamily` genérica (`'ui-monospace, monospace'` para el título/nombre, que casa con la
identidad "Technical Brutalist" y el token `--font-mono: 'JetBrains Mono', ui-monospace,
monospace`, y `'ui-sans-serif, sans-serif'` para el subtítulo). `ImageResponse` sin `fonts:`
usa la fuente `Geist-Regular.ttf` empaquetada por Next como fallback para `sans-serif`; para
`monospace` Satori usa una fuente monoespaciada del sistema/genérica de Resvg. El resultado
visual será un texto monoespaciado simple sobre fondo oscuro con acento cian — coherente con la
identidad "Technical Brutalist" sin necesidad de gestionar binarios de fuente en el repo. Si en
verificación visual (paso 6) el resultado no es satisfactorio, una mejora futura (fuera de
alcance) sería añadir `.ttf` de Space Grotesk/JetBrains Mono a `public/fonts/` y cargarlos con
`readFile`.

**Exports y firma exactos** (convención de archivo, ver doc oficial):

```tsx
// app/[locale]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getPersonal } from '@/lib/content'

export const alt = 'miguealguacil — AI Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const personal = await getPersonal(locale)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: '#131314',
          color: '#e5e2e3',
          padding: '80px',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: '#00dce5',
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          miguealguacil.com
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          {personal.name}
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#9aacae',
            fontFamily: 'ui-sans-serif, sans-serif',
            maxWidth: 900,
          }}
        >
          {personal.title}
        </div>
      </div>
    ),
    { ...size }
  )
}
```

**Notas**:
- `export const alt` es un literal estático (no localizado dinámicamente porque las config
  exports no pueden ser `async`/depender de `params` — solo el default export recibe `params`).
  Un único `alt` en inglés genérico ("miguealguacil — AI Engineer") es aceptable; si se quiere
  localizar el `alt`, no es posible con esta convención de archivo sin `generateImageMetadata`
  (fuera de alcance, Decisión 4 ya descarta complejidad adicional).
- Aplicado por convención de archivo a **todas las rutas bajo `app/[locale]/`**: home y
  `proyectos/[projectId]` (y `projects/[projectId]` en `en`), por locale — exactamente lo que
  pide Decisión 4 y el requirement "Imagen Open Graph dinámica por locale".
- `params` en Next 16 es `Promise<{ locale: string }>` (ver Version History de
  `opengraph-image.md`: *"v16.0.0 — params is now a promise"*) — el `await params` es
  obligatorio.
- Por defecto la imagen es estáticamente optimizada (generada en build, cacheada) — no usa
  `fetch` ni APIs request-time, por lo que **no afecta el SSG** de las páginas (cumple Decisión 8
  / requirement "El sitio sigue siendo estático").

### 4.2 — `app/[locale]/page.tsx`: `generateMetadata` con `openGraph`/`twitter`

**Estado actual** (relevante):
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    languages[loc] = loc === routing.defaultLocale ? '/' : `/${loc}`
  }

  return {
    title: t('home_title'),
    description: t('home_description'),
    alternates: { languages },
  }
}
```

**Diff conceptual**:

```diff
+import { getAbsoluteUrl, getLocalizedHomePath } from '@/lib/seo'
 ...
   return {
     title: t('home_title'),
     description: t('home_description'),
     alternates: { languages },
+    openGraph: {
+      title: t('home_title'),
+      description: t('home_description'),
+      url: getAbsoluteUrl(getLocalizedHomePath(locale)),
+      siteName: 'miguealguacil',
+      locale: locale === 'es' ? 'es_ES' : 'en_US',
+      type: 'profile',
+    },
+    twitter: {
+      card: 'summary_large_image',
+      title: t('home_title'),
+      description: t('home_description'),
+    },
   }
```

**Notas**:
- `og:locale` valores `es_ES`/`en_US`: el requirement de `seo-metadata/spec.md` pide
  `og:locale content="es_ES"` para `es` y `en_US` (o equivalente) para `en`. Un mapeo simple
  `locale === 'es' ? 'es_ES' : 'en_US'` es suficiente — **no** crear un nuevo helper en
  `lib/seo.ts` para esto salvo que se repita ≥3 veces (aquí se repite 2 veces: home y detalle de
  proyecto — considerar extraer un pequeño helper `getOgLocale(locale)` en `lib/seo.ts` si se
  prefiere DRY; opcional, no bloqueante).
- `siteName: 'miguealguacil'` — string literal, no requiere i18n (es el nombre del sitio/dominio,
  igual en ambos locales). No hardcodear en `messages/` (no es un string de UI traducible).
- **Sin `images`** — Decisión 5: la convención de archivo `opengraph-image.tsx` (4.1) ya genera
  `og:image`/`twitter:image` automáticamente para esta ruta.
- `type: 'profile'` es un tipo válido de `openGraph` en `next`'s `Metadata` (Open Graph
  Protocol `profile` type) — verificar que TypeScript no se queje; si el tipo `OpenGraph` de
  `next` no incluye `'profile'` directamente en el discriminated union, puede requerir el shape
  `{ type: 'profile', ... }` que Next tipa explícitamente (Next soporta `profile` desde hace
  varias versiones — confirmar en `node_modules/next/dist/lib/metadata/types/opengraph-types.d.ts`
  si el editor marca error; no se anticipa problema).

### 4.3 — `app/[locale]/proyectos/[projectId]/page.tsx`: `generateMetadata` con `openGraph` (`type: 'article'`) + `twitter`

**Estado actual** (relevante):
```ts
return {
  title: project.name,
  description: project.description,
  alternates: { languages },
}
```

**Diff conceptual**:

```diff
+import { getAbsoluteUrl } from '@/lib/seo'
 ...
   return {
     title: project.name,
     description: project.description,
     alternates: { languages },
+    openGraph: {
+      title: project.name,
+      description: project.description,
+      url: getAbsoluteUrl(languages[locale]),
+      siteName: 'miguealguacil',
+      locale: locale === 'es' ? 'es_ES' : 'en_US',
+      type: 'article',
+    },
+    twitter: {
+      card: 'summary_large_image',
+      title: project.name,
+      description: project.description,
+    },
   }
```

**Notas**:
- `languages[locale]` ya contiene el path localizado actual (calculado justo arriba en el
  bloque existente: `languages[loc] = loc === routing.defaultLocale ? localizedPath :
  '/${loc}${localizedPath}'`), por lo que `getAbsoluteUrl(languages[locale])` da la URL absoluta
  de la página actual sin recalcular nada.
- `title`/`description` reutilizan `project.name`/`project.description` de
  `content/{locale}/projects.ts` — **no** se necesitan nuevas claves de `messages/` para esto
  (son contenido, no strings de UI).
- Sin `images` (igual que 4.2, Decisión 5).

### 4.4 — Revisión de `messages/{es,en}.json` namespace `metadata`

**Resuelve la Open Question 2 de `design.md`**:

Tras 4.2 y 4.3, los únicos textos `openGraph`/`twitter` nuevos son los de la **home**
(`t('home_title')`, `t('home_description')`, namespace `metadata`, ya existentes) — el detalle
de proyecto usa `project.name`/`project.description` de `content/`, no `messages/`.

`home_title`/`home_description` actuales:
- ES: `"miguealguacil — AI Engineer | GenAI, Agentes y Desarrollo de Producto"` /
  `"Portfolio de Miguel Á. Benítez Alguacil, AI Engineer especializado en GenAI, agentes LLM y
  desarrollo de producto."`
- EN: equivalentes en inglés.

Ambos están dentro de los límites recomendados para `og:title` (~60 caracteres ideal, hasta ~95
sin truncar en la mayoría de plataformas) y `og:description` (~155-200 caracteres). El
`home_title` ES tiene 67 caracteres, el `home_description` ES tiene 142 caracteres — **dentro de
límites razonables**, sin truncamiento severo esperado.

**Decisión del plan (no se reabre design.md, se resuelve la pregunta abierta)**: **reutilizar
`home_title`/`home_description` tal cual, sin añadir claves nuevas a `messages/{es,en}.json`**.
Justificación:
- Los textos actuales ya son razonablemente concisos y están en el rango aceptado por
  Facebook/Twitter/LinkedIn sin truncamiento severo.
- Añadir `metadata.og_description`/`metadata.twitter_description` solo para tener una versión
  "ligeramente más corta" del mismo mensaje introduce mantenimiento doble (dos textos casi
  idénticos por locale) sin beneficio claro de SEO/SERP — el requirement de
  `seo-metadata/spec.md` solo exige que `og:title`/`og:description`/`twitter:title`/
  `twitter:description` existan y estén localizados, no que sean textos distintos de
  `title`/`description`.
- Si en verificación E2E (grupo 7) se observa que el texto se trunca de forma fea en el preview
  de alguna red social, **entonces** se puede añadir una clave corta — pero no de antemano.

**Conclusión**: tarea 4.4 se completa **sin cambios en `messages/{es,en}.json`** — documentar
esta decisión en el informe de verificación (paso 8.1/8.3) tal como exige el checklist (la
"actualización de `content/`/`messages/`" en este caso es "no aplica, documentado").

---

## 5. JSON-LD `Person` + `theme-color` adaptativo (TDD) — grupo 5 de tasks.md

### 5.1 — Test Vitest: `lib/__tests__/seo.test.ts`

Cubre `buildPersonJsonLd` (y opcionalmente `getLocalizedHomePath`/`getAbsoluteUrl` como tests
auxiliares, aunque tasks.md solo pide explícitamente el helper de `Person`).

```ts
// lib/__tests__/seo.test.ts
import { describe, it, expect } from 'vitest'
import { buildPersonJsonLd, getAbsoluteUrl, getLocalizedHomePath, SITE_URL } from '../seo'
import { getPersonal } from '@/lib/content'

describe('getLocalizedHomePath', () => {
  it('returns "/" for the default locale (es)', () => {
    expect(getLocalizedHomePath('es')).toBe('/')
  })

  it('returns "/en" for non-default locales', () => {
    expect(getLocalizedHomePath('en')).toBe('/en')
  })
})

describe('getAbsoluteUrl', () => {
  it('returns SITE_URL without trailing slash for "/"', () => {
    expect(getAbsoluteUrl('/')).toBe(SITE_URL)
  })

  it('concatenates SITE_URL with the given path', () => {
    expect(getAbsoluteUrl('/en')).toBe(`${SITE_URL}/en`)
    expect(getAbsoluteUrl('/proyectos/minecraft-butler-ai')).toBe(
      `${SITE_URL}/proyectos/minecraft-butler-ai`
    )
  })
})

describe('buildPersonJsonLd', () => {
  it('builds a schema.org Person from content/es/personal.ts', async () => {
    const personal = await getPersonal('es')
    const jsonLd = buildPersonJsonLd('es', personal)

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('Person')
    expect(jsonLd.name).toBe(personal.name)
    expect(jsonLd.jobTitle).toBe(personal.title)
    expect(jsonLd.description).toBe(personal.bio)
    expect(jsonLd.email).toBe(`mailto:${personal.email}`)
    expect(jsonLd.url).toBe(SITE_URL)
    expect(jsonLd.sameAs).toEqual([personal.linkedin, personal.github])
  })

  it('builds a Person for en with the /en home URL', async () => {
    const personal = await getPersonal('en')
    const jsonLd = buildPersonJsonLd('en', personal)

    expect(jsonLd.jobTitle).toBe(personal.title)
    expect(jsonLd.description).toBe(personal.bio)
    expect(jsonLd.url).toBe(`${SITE_URL}/en`)
  })
})
```

### 5.2 — Render del JSON-LD en `app/[locale]/page.tsx`

**Contexto**: `HomePage` actual:
```tsx
export default async function HomePage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [personal, projects, experience, educationData, skills] = await Promise.all([...])

  return (
    <>
      <Hero personal={personal} />
      ...
    </>
  )
}
```

**Diff conceptual**:

```diff
+import { buildPersonJsonLd } from '@/lib/seo'
 ...
 export default async function HomePage({ params }) {
   const { locale } = await params
   setRequestLocale(locale)

   const [personal, projects, experience, educationData, skills] = await Promise.all([...])

+  const personJsonLd = buildPersonJsonLd(locale, personal)

   return (
     <>
+      <script
+        type="application/ld+json"
+        // eslint-disable-next-line react/no-danger
+        dangerouslySetInnerHTML={{
+          __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c'),
+        }}
+      />
       <Hero personal={personal} />
       ...
     </>
   )
 }
```

**Notas**:
- El `<script type="application/ld+json">` se renderiza en el Server Component `HomePage`
  (sigue siendo `async function`, sin `"use client"`). Esto es exactamente el patrón
  recomendado por la guía oficial de Next.js para JSON-LD (Decisión 6 de `design.md`).
- `.replace(/</g, '\\u003c')` escapa `<` para evitar que un `</script>` dentro del JSON (p. ej.
  si `personal.bio` contuviera `</script>`) rompa el HTML — coincide exactamente con el patrón
  pedido en tasks.md 5.2.
- Si ESLint (`eslint-config-next`) marca `react/no-danger` como error (no solo warning),
  mantener el comentario `// eslint-disable-next-line react/no-danger`; si es solo warning, el
  comentario es opcional pero recomendable por claridad. Verificar con `npm run lint` en el
  paso 6.1 — si falla, añadir el disable comment.
- Colocación: como primer hijo del fragmento `<>...</>`, antes de `<Hero />` — no afecta el LCP
  visual (un `<script type="application/ld+json">` no renderiza nada ni bloquea pintado).

### 5.3 — `viewport.themeColor` en `app/[locale]/layout.tsx`

**Diff conceptual**:

```diff
 export const viewport: Viewport = {
-  themeColor: '#131314',
+  themeColor: [
+    { media: '(prefers-color-scheme: light)', color: '#f6f9fc' },
+    { media: '(prefers-color-scheme: dark)', color: '#131314' },
+  ],
 }
```

Coincide exactamente con Decisión 7 de `design.md` y con los valores de `--color-background` en
`app/globals.css` (claro `#f6f9fc`, oscuro `#131314`).

**Nota — tipo `Viewport`**: `Viewport['themeColor']` en Next.js soporta
`string | ThemeColorDescriptor | ThemeColorDescriptor[]` donde `ThemeColorDescriptor = { color:
string; media?: string }`. El array de dos objetos `{ media, color }` es la forma documentada
para múltiples `<meta name="theme-color">` según `prefers-color-scheme` — no requiere imports
adicionales, `Viewport` ya está importado en `layout.tsx`.

### 5.4 — Verificar que el test de 5.1 pasa (`npm run test`).

---

## 6. Verificación (grupo 6 de tasks.md) — notas para `/opsx:apply`

No se detalla aquí paso a paso (son comandos, no diseño), pero notas relevantes:

- **6.1** `npm run lint && npm run test && npm run build` — el `build` ejecutará también
  `app/sitemap.ts`, `app/robots.ts` y `app/[locale]/opengraph-image.tsx` como parte de la
  generación estática. Si `opengraph-image.tsx` falla en build (p. ej. por límite de 500KB de
  `ImageResponse` o por un error de Satori con alguna propiedad CSS no soportada — recordar que
  `ImageResponse`/Satori **no soporta** todas las propiedades CSS, solo flexbox + subset), revisar
  el esqueleto de 4.1: evitar `gap`, `borderRadius` complejos si dan problemas; usar solo
  `display: flex`, `flexDirection`, `alignItems`, `justifyContent`, `padding`, `margin`,
  `fontSize`, `fontWeight`, `color`, `backgroundColor`, `lineHeight`, `letterSpacing`,
  `textTransform`, `maxWidth` — todas usadas en el esqueleto propuesto son soportadas por Satori.
- **6.2** Verificar `.next/prerender-manifest.json` (o salida `next build`, columna `○`/`●` para
  estático) — `/`, `/en`, `/proyectos/[id]`, `/en/projects/[id]` deben seguir como `●` (SSG, con
  `generateStaticParams`). `app/sitemap.ts`/`app/robots.ts`/`opengraph-image.tsx` aparecerán como
  rutas adicionales generadas estáticamente (`/sitemap.xml`, `/robots.txt`,
  `/opengraph-image` por locale) — esto es esperado y correcto.
- **6.3** `npm run start` + `curl -I` — las cabeceras de `SECURITY_HEADERS` deben aparecer en
  **todas** las rutas (incluida `/sitemap.xml`, `/robots.txt`, assets `_next/static/...` por el
  `source: '/(.*)'`). Esto es aceptable y esperado por el patrón "Without Nonces" — no se filtra
  por extensión.
- **6.4** `curl http://localhost:3000/sitemap.xml` y `/robots.txt` — comprobar URLs absolutas
  `https://miguealguacil.com...` (vienen de `SITE_URL`, fijo en producción — Riesgo ya aceptado
  en `design.md`, sin acción).

---

## 7. E2E Playwright MCP (grupo 7) — notas

- **7.1**: extraer `<head>` con `browser_snapshot`/evaluación de `document.head.innerHTML` (o
  `page.locator('script[type="application/ld+json"]')`) en `/` y `/en`. Verificar
  `JSON.parse(...)` no lanza, `@type === 'Person'`, y que `jobTitle`/`description`/`name`
  coinciden con `content/{es,en}/personal.ts`.
- **7.2**: comprobar **dos** `<meta name="theme-color">` en el `<head>` (uno por
  `prefers-color-scheme`), con los `content` `#f6f9fc` y `#131314` respectivamente — Playwright
  puede emular `prefers-color-scheme` con `page.emulateMedia({ colorScheme: 'light' | 'dark' })`
  pero **ambas** etiquetas `<meta>` están presentes en el HTML simultáneamente (el navegador
  decide cuál aplicar) — el test debe verificar presencia de ambas en el DOM, no que cambien
  dinámicamente.
- **7.3**: smoke test general — cargar `/` y `/en`, toggle de tema (`ThemeToggle`), toggle de
  idioma (`LocaleToggle`), scroll (Lenis), comprobar `console` sin errores de
  `Content-Security-Policy` (CSP violations aparecen como `console.error` con mensaje
  `Refused to ...`). Con `script-src 'self' 'unsafe-inline'` y `style-src 'self'
  'unsafe-inline'`, el script inline de `next-themes` y los `style={{...}}` de Framer Motion
  **no** deberían generar violaciones.
- **7.4**: verificar `<meta property="og:image">` y `<meta name="twitter:image">` apuntan a
  `/[locale]/opengraph-image` (o la URL generada por Next, típicamente algo como
  `/es/opengraph-image` o con hash) en `/`, `/proyectos/<id>` y `/en/projects/<id>`.

---

## 8. Cierre (grupo 8) — notas

- **8.1**: dado lo decidido en §4.4 de este plan, no hay cambios en `content/`/`messages/` que
  aplicar — documentar explícitamente "sin cambios, ver developer.md §4.4" en el informe.
- **8.2**: marcar 2.1, 2.2, 3.1, 3.2, 3.4, 3.5 como resueltos en `openspec/AUDIT-2026-06-13.md`.
- **8.3**: informe en `openspec/changes/seo-security-base/reports/2026-06-13-verification.md` (o
  fecha real de ejecución).
- **8.4**: PR con `gh` + skill `write-pr-report`.

---

## Orden de implementación recomendado

1. **Grupo 1**: `lib/seo.ts` (`SITE_URL`, `getLocalizedHomePath`, `getAbsoluteUrl`,
   `buildPersonJsonLd` — todo de una vez, ya que es un solo archivo pequeño; el test de 5.1
   puede escribirse ahora aunque tasks.md lo numere en el grupo 5) + actualizar `metadataBase`
   en `layout.tsx`.
2. **Grupo 2** (TDD): test `app/__tests__/sitemap.test.ts` (falla) → `app/sitemap.ts` → test
   `app/__tests__/robots.test.ts` (falla) → `app/robots.ts` → verificar ambos tests en verde.
3. **Grupo 3** (TDD): test `lib/__tests__/security-headers.test.ts` (falla) →
   `lib/security-headers.ts` → `next.config.ts` (`poweredByHeader: false` + `headers()`) →
   verificar test en verde.
4. **Grupo 4**: `app/[locale]/opengraph-image.tsx` → `generateMetadata` en `page.tsx` →
   `generateMetadata` en `proyectos/[projectId]/page.tsx` → revisar `messages/` (sin cambios,
   §4.4).
5. **Grupo 5** (TDD): test `lib/__tests__/seo.test.ts` (si no se escribió en el paso 1, escribirlo
   ahora y verificar que pasa con `buildPersonJsonLd` ya implementado) → render JSON-LD en
   `page.tsx` → `viewport.themeColor` en `layout.tsx` → verificar test en verde.
6. **Grupo 6**: `npm run lint && npm run test && npm run build`, verificación manual
   (`prerender-manifest`, `curl -I`, `/sitemap.xml`, `/robots.txt`).
7. **Grupo 7**: E2E Playwright MCP (ES/EN, tema claro/oscuro, idioma, JSON-LD, theme-color,
   og:image).
8. **Grupo 8**: cierre — AUDIT, informe, PR.

---

## Riesgos / ambigüedades detectados (resumen)

1. **Alias `@` en `next.config.ts`** — usar import relativo `./lib/security-headers` por
   seguridad (no verificado que el alias funcione fuera del grafo de la app en Next 16).
2. **Fuentes `.ttf` para `opengraph-image.tsx`** — resuelto: no añadir binarios, usar
   `ui-monospace, monospace` / `ui-sans-serif, sans-serif` genéricas (Open Question 1 de
   design.md resuelta).
3. **`messages/{es,en}.json` para OG/Twitter** — resuelto: reutilizar `home_title`/
   `home_description` sin nuevas claves (Open Question 2 de design.md resuelta); detalle de
   proyecto usa `content/` directamente.
4. **Ubicación de tests de `app/sitemap.ts`/`app/robots.ts`** — recomendado
   `app/__tests__/sitemap.test.ts` y `app/__tests__/robots.test.ts` (co-localizados con las
   convenciones de archivo que prueban), distinto de `lib/__tests__/` (reservado para helpers de
   `lib/`). `vitest.config.ts` ya incluye `**/__tests__/**/*.{ts,tsx}` en cualquier ruta.
5. **`type: 'profile'` en `openGraph`** — verificar que el tipo `Metadata['openGraph']` de
   Next 16 acepta `'profile'` sin error de TS; no se anticipa problema (Open Graph Protocol
   estándar, soportado por Next desde hace tiempo), pero si `npm run lint`/`tsc` falla, revisar
   `node_modules/next/dist/lib/metadata/types/opengraph-types.d.ts`.
6. **`getLocalizedHomePath`/lógica de `alternates.languages` duplicada** — se mantiene el
   cálculo existente en `generateMetadata` de `page.tsx`/`proyectos/[projectId]/page.tsx` tal
   cual (no refactorizado a `lib/seo.ts`) para minimizar diff; `getLocalizedHomePath` se usa solo
   en los sitios nuevos (`sitemap.ts`, JSON-LD, `openGraph.url`).
