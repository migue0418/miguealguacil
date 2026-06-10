# Plan técnico — add-cv-download

Cambio pequeño: añadir descarga de CV (PDF según locale) desde el Hero (3er CTA) y el Header (botón "CV" permanente, visible en móvil).

Assets ya confirmados en `public/cv/`:
- `public/cv/cv-miguel-benitez-es.pdf`
- `public/cv/cv-miguel-benitez-en.pdf`

No se necesita consultar `node_modules/next/dist/docs/`: no se usa ninguna API nueva de routing/data-fetching. Solo `getLocale`/`getTranslations` de `next-intl/server` (mismo patrón que ya usa `Header.tsx`/`Nav.tsx`) y `import()` dinámico que ya existe en `lib/content.ts`.

---

## Orden de implementación (importante para no romper el build)

1. `lib/types.ts` → añadir `cvUrl: string` (requerido) a `PersonalInfo`.
2. `content/es/personal.ts` y `content/en/personal.ts` → añadir `cvUrl`.
3. `messages/es.json` y `messages/en.json` → añadir `hero.cta_cv` y `nav.cv`.
4. `components/sections/Hero.tsx` → tercer CTA.
5. `components/layout/Header.tsx` → botón "CV".
6. Arreglar mocks de tests que construyen `PersonalInfo` literal (`Hero.test.tsx`, `Contact.test.tsx`) — si no se hace, `npm run test`/`tsc` fallarán por falta de la propiedad requerida `cvUrl`.
7. (Opcional) test nuevo para el CTA de CV en Hero.
8. `npm run lint && npm run test && npm run build`.

Razón del orden: al hacer `cvUrl` requerido, cualquier objeto `PersonalInfo` literal sin esa propiedad es un error de TypeScript. Por eso tipos+content+messages van primero, y el arreglo de mocks de test va DESPUÉS de tocar los componentes (aunque en la práctica se puede hacer en el mismo commit/paso; el orden lógico es: tipos → contenido → componentes → tests).

---

## 1. `lib/types.ts`

Añadir `cvUrl: string` a `PersonalInfo` (requerido — ambos locales lo tendrán siempre, no hay fallback):

```ts
export interface PersonalInfo {
  name: string
  title: string
  bio: string
  email: string
  linkedin: string
  github: string
  location: string
  cvUrl: string
}
```

---

## 2. `content/es/personal.ts`

Añadir la línea `cvUrl: '/cv/cv-miguel-benitez-es.pdf',` (al final del objeto, tras `location`):

```ts
export const personal: PersonalInfo = {
  name: 'Miguel Á. Benítez Alguacil',
  title: 'AI Engineer | GenAI, Agentes y Desarrollo de Producto',
  bio: 'Data Scientist con perfil de ingeniería, especializado en GenAI y desarrollo de producto. Desarrollo agentes LLM con LangChain/LangGraph e integro IA en productos reales con FastAPI + React.',
  email: 'miguealguacil@gmail.com',
  linkedin: 'https://www.linkedin.com/in/miguealguacil/',
  github: 'https://github.com/migue0418',
  location: 'Granada, España',
  cvUrl: '/cv/cv-miguel-benitez-es.pdf',
}
```

## `content/en/personal.ts`

Añadir `cvUrl: '/cv/cv-miguel-benitez-en.pdf',`:

```ts
export const personal: PersonalInfo = {
  name: 'Miguel Á. Benítez Alguacil',
  title: 'AI Engineer | GenAI, Agents & Product Development',
  bio: 'Data Scientist with an engineering profile, specialized in GenAI and product development. I build LLM agents with LangChain/LangGraph and integrate AI into real products using FastAPI + React.',
  email: 'miguealguacil@gmail.com',
  linkedin: 'https://www.linkedin.com/in/miguealguacil/',
  github: 'https://github.com/migue0418',
  location: 'Granada, Spain',
  cvUrl: '/cv/cv-miguel-benitez-en.pdf',
}
```

---

## 3. `messages/es.json`

Dos cambios:

a) En el objeto `nav`, añadir `"cv": "CV"` (tras `"contact"`):

```json
  "nav": {
    "hero": "Inicio",
    "projects": "Proyectos",
    "stack": "Stack",
    "experience": "Experiencia",
    "education": "Educación",
    "contact": "Contacto",
    "cv": "CV"
  },
```

b) En el objeto `hero`, añadir `"cta_cv": "Descargar CV"` (tras `cta_contact`):

```json
  "hero": {
    "cta_projects": "Ver proyectos",
    "cta_contact": "Contacto",
    "cta_cv": "Descargar CV",
    "bio_label": "BIO"
  },
```

## `messages/en.json`

a) `nav.cv`:

```json
  "nav": {
    "hero": "Home",
    "projects": "Projects",
    "stack": "Stack",
    "experience": "Experience",
    "education": "Education",
    "contact": "Contact",
    "cv": "CV"
  },
```

b) `hero.cta_cv`:

```json
  "hero": {
    "cta_projects": "View projects",
    "cta_contact": "Contact",
    "cta_cv": "Download CV",
    "bio_label": "BIO"
  },
```

---

## 4. `components/sections/Hero.tsx`

Añadir un tercer `MagneticButton` dentro del `<div className="flex gap-4 flex-wrap">`, después del CTA de "Contacto". Es un CTA **secundario** (mismo estilo visual que `cta_contact`: borde `border-default`, sin fondo de relleno), con `download` y `href={personal.cvUrl}`. Label `t('cta_cv')`.

No hace falta tocar imports (ya importa `MagneticButton`, `personal` ya está disponible vía props).

Bloque completo del `<div>` de CTAs resultante (sustituye el bloque actual líneas 43-60):

```tsx
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
            <MagneticButton>
              <a
                href={personal.cvUrl}
                download
                className="inline-flex items-center gap-2 border border-default text-primary font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-surface-hover transition-colors"
              >
                {t('cta_cv')}
              </a>
            </MagneticButton>
          </div>
```

Notas:
- Mismo `className` exacto que `cta_contact` (CTA secundario con borde) — cumple la spec de "lenguaje visual existente".
- `download` sin valor (booleano) — el navegador usará el nombre de archivo original (`cv-miguel-benitez-es.pdf` / `-en.pdf`). Es aceptable y coherente con la decisión 4 de `design.md` (no se especifica un nombre de descarga distinto).
- No se añade `target="_blank"` (decisión 4 del design).

---

## 5. `components/layout/Header.tsx`

Cambios:
- Importar `getLocale` además de (si hiciera falta) `getTranslations` — actualmente `Header.tsx` NO importa `getTranslations` (solo lo usan `Nav` y `Hero`). Hay que añadirlo.
- Importar `getPersonal` desde `@/lib/content`.
- Hacer `const locale = await getLocale()`, `const personal = await getPersonal(locale)`, `const t = await getTranslations('nav')`.
- Añadir `<a href={personal.cvUrl} download>` con label `t('cv')`, **sin** `hidden md:flex` (visible siempre, según decisión 7 del design).

Posición del botón CV: **antes del `LocaleToggle`**, dentro del mismo `div.flex.items-center.gap-1` que agrupa los toggles. Esto agrupa "controles persistentes" (CV + idioma + tema) en un único bloque visual a la derecha, separado del `Nav` de secciones (que ya está oculto en móvil). Es la posición más limpia porque:
- No compite visualmente con el logo/nombre a la izquierda.
- Queda agrupado junto a LocaleToggle/ThemeToggle, que es exactamente "junto a los toggles" como pide la spec.
- Al ser un `<a>` con texto "CV" en mono uppercase, antes de los toggles (que son botones de icono/texto corto) mantiene una lectura natural izquierda→derecha: CV → idioma → tema.

Estilo del botón CV: mono uppercase, igual familia tipográfica que `Nav`/`LocaleToggle` (`font-mono text-xs uppercase tracking-wide`), con un padding similar a los toggles para mantener la altura/alineación de la barra. Usamos `border border-default rounded-none` para darle entidad de "botón" (se diferencia de los links de texto plano del Nav y del botón de icono del ThemeToggle), coherente con `rounded-none` del resto del sitio.

Header.tsx resultante completo:

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { getPersonal } from '@/lib/content'
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
          href="#hero"
          className="font-mono text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          miguealguacil
        </a>
        <div className="flex items-center gap-4">
          <Nav />
          <div className="flex items-center gap-1">
            <a
              href={personal.cvUrl}
              download
              className="font-mono text-xs uppercase tracking-wide text-primary border border-default px-3 py-1.5 rounded-none hover:bg-surface-hover hover:text-accent transition-colors"
            >
              {t('cv')}
            </a>
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
```

Notas:
- `getLocale()` y `getTranslations()` se importan desde `next-intl/server` (mismo paquete que ya usa `Nav.tsx` y `Hero.tsx` — no es una API nueva de Next 16, es de next-intl, ya en uso).
- `getPersonal(locale)` usa `import()` dinámico (`lib/content.ts`); en SSG se resuelve en build time, sin coste en runtime — ya documentado en `design.md` decisión 2.
- El `Header` sigue sin recibir props — coherente con que se renderiza en `app/[locale]/layout.tsx` sin cambios ahí.
- Verificar `app/[locale]/layout.tsx` no necesita tocarse (el Header sigue siendo `<Header />` sin props). No es necesario leerlo para este cambio porque no se modifica su firma ni su uso.

---

## 6. Tests — impacto y cambios necesarios

### Sitios donde se construye `PersonalInfo` literal en tests (búsqueda ya realizada, exhaustiva)

Solo dos archivos:
- `components/sections/__tests__/Hero.test.tsx` — `mockPersonal`
- `components/sections/__tests__/Contact.test.tsx` — `mockPersonal`

Ambos deben añadir `cvUrl` para que TypeScript no falle al compilar el tipo `PersonalInfo` (ahora con `cvUrl: string` requerido).

### `components/sections/__tests__/Hero.test.tsx`

Añadir `cvUrl` al `mockPersonal` (líneas 16-24 actuales):

```ts
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
```

`getTranslations` está mockeado como `async () => (key: string) => key`, por lo que `t('cta_cv')` devolverá el string literal `'cta_cv'`. Esto **no rompe** los tests existentes (`renders the name`, `renders the bio`, `renders the title`) porque usan `getByText` con textos distintos (`'Test User'`, `'Test bio here'`, `'AI Engineer'`), no relacionados con `cta_cv`.

### `components/sections/__tests__/Contact.test.tsx`

Añadir `cvUrl` al `mockPersonal` (líneas 19-27 actuales):

```ts
const mockPersonal: PersonalInfo = {
  name: 'Test User',
  title: 'Dev',
  bio: 'Bio',
  email: 'test@example.com',
  linkedin: 'https://linkedin.com/in/test',
  github: 'https://github.com/test',
  location: 'City',
  cvUrl: '/cv/cv-miguel-benitez-es.pdf',
}
```

Sin más cambios — `Contact.tsx` no usa `cvUrl`, solo necesita que el objeto cumpla el tipo.

### Test nuevo opcional (recomendado, bajo coste): CTA de CV en Hero

Añadir un test en `Hero.test.tsx` que verifique `href` y `download` del nuevo CTA. Como `getTranslations` está mockeado a `(key) => key`, el texto del botón será literalmente `'cta_cv'`:

```ts
  it('renders the CV download CTA with correct href and download attribute', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    const cvLink = screen.getByRole('link', { name: 'cta_cv' })
    expect(cvLink).toHaveAttribute('href', '/cv/cv-miguel-benitez-es.pdf')
    expect(cvLink).toHaveAttribute('download')
  })
```

Notas sobre `toHaveAttribute('download')`: `download` es un atributo booleano (`<a download>` sin valor) → en el DOM se refleja como `download=""`. `toHaveAttribute('download')` (sin segundo argumento) comprueba solo presencia, así que pasa correctamente.

### `Header.tsx` — sin test propio (confirmado)

Búsqueda de tests existentes en `components/layout/__tests__/`: `LocaleToggle.test.tsx`, `Nav.test.tsx`, `ThemeToggle.test.tsx`. **No existe** `Header.test.tsx`. Por tanto:
- No hay ningún test que ejecute el nuevo `Header` async con `getLocale`/`getPersonal`.
- No es necesario mockear `next-intl/server` ni `lib/content` para Header en esta tanda — nada lo invoca en Vitest.
- **No es obligatorio** crear `Header.test.tsx` para este cambio (es opcional y no está en `tasks.md`). Si se quisiera añadir en el futuro, habría que mockear `next-intl/server` (`getLocale`, `getTranslations`) y `@/lib/content` (`getPersonal`), siguiendo el patrón de `Hero.test.tsx`/`Nav.test.tsx`. Fuera del alcance de este cambio — no añadir salvo que se decida ampliar el scope.

### Otros tests no afectados

`Nav.test.tsx`, `LocaleToggle.test.tsx`, `ThemeToggle.test.tsx`, tests de `components/animations/`, `components/ui/`, `ProjectsGrid.test.tsx`, `Timeline.test.tsx`, `Education.test.tsx`, `TechStack.test.tsx`: ninguno construye `PersonalInfo`, ninguno se ve afectado por `cvUrl`.

---

## 7. Verificación (OBLIGATORIO, según `.claude/rules/openspec-tasks-mandatory-steps.md`)

```powershell
npm run lint && npm run test && npm run build
```

Puntos a vigilar durante el build:
- `tsc`/`next build` fallará si queda algún `PersonalInfo` literal sin `cvUrl` (cubierto en el punto 6).
- El build SSG (`generateStaticParams` en `app/[locale]/page.tsx` y `app/[locale]/layout.tsx`) generará ambas rutas (`es`, `en`); el `Header` ahora hace `import()` dinámico de `content/{locale}/personal` en cada locale — mismo patrón que ya usa `getPersonal` en `page.tsx`, sin riesgo adicional.

---

## 8. E2E Playwright MCP (lo ejecuta el agente en `/opsx:apply`, no aquí)

Solo como referencia para quien implemente — comprobar:
- `/`: CTA "Descargar CV" en Hero → `href="/cv/cv-miguel-benitez-es.pdf"`, atributo `download` presente.
- `/`: botón "CV" en Header → mismo `href` y `download`.
- `/en`: ambos → `href="/cv/cv-miguel-benitez-en.pdf"`.
- Botón "CV" del Header visible en viewport móvil (sin `hidden`/`md:flex`).
- Tab + Enter activa la descarga en ambos.
- Toggle de tema y de locale siguen funcionando (no deben quedar tapados/desplazados de forma rota por el nuevo botón CV).

---

## Resumen de archivos a tocar

| Archivo | Cambio |
|---|---|
| `lib/types.ts` | añadir `cvUrl: string` a `PersonalInfo` |
| `content/es/personal.ts` | añadir `cvUrl: '/cv/cv-miguel-benitez-es.pdf'` |
| `content/en/personal.ts` | añadir `cvUrl: '/cv/cv-miguel-benitez-en.pdf'` |
| `messages/es.json` | añadir `nav.cv: "CV"`, `hero.cta_cv: "Descargar CV"` |
| `messages/en.json` | añadir `nav.cv: "CV"`, `hero.cta_cv: "Download CV"` |
| `components/sections/Hero.tsx` | tercer `MagneticButton` con CTA de descarga |
| `components/layout/Header.tsx` | `getLocale` + `getTranslations` + `getPersonal`, botón "CV" antes de `LocaleToggle` |
| `components/sections/__tests__/Hero.test.tsx` | añadir `cvUrl` a `mockPersonal`; test opcional nuevo |
| `components/sections/__tests__/Contact.test.tsx` | añadir `cvUrl` a `mockPersonal` |

No se toca: `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, `lib/content.ts`, `Nav.tsx`, `LocaleToggle.tsx`, `ThemeToggle.tsx`, `i18n/*`, `middleware.ts`.
