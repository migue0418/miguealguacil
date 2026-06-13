# Plan técnico — mobile-navigation

Plan a nivel de archivos para implementar el menú de navegación móvil descrito en:
- `openspec/changes/mobile-navigation/proposal.md`
- `openspec/changes/mobile-navigation/design.md`
- `openspec/changes/mobile-navigation/specs/site-layout/spec.md`
- `openspec/changes/mobile-navigation/tasks.md`

No implementar nada todavía. Este documento es la referencia para `/opsx:apply`.

---

## 0. Resumen de archivos afectados

| Archivo | Acción |
|---|---|
| `messages/es.json` | Modificar — añadir `nav.openMenu` / `nav.closeMenu` |
| `messages/en.json` | Modificar — añadir `nav.openMenu` / `nav.closeMenu` |
| `components/layout/MobileNav.tsx` | Crear — Server Component |
| `components/layout/MobileMenuToggle.tsx` | Crear — Client Component |
| `components/layout/Header.tsx` | Modificar — integrar el nuevo control |
| `components/layout/__tests__/MobileNav.test.tsx` | Crear — tests Vitest (fallan primero) |
| `components/layout/__tests__/MobileMenuToggle.test.tsx` | Crear — tests Vitest (fallan primero) |

No se toca `lib/navigation.ts`, `components/layout/Nav.tsx` (excepto que `Header.tsx` lo sigue usando exactamente igual), ni `content/`.

---

## 1. `messages/{es,en}.json` — nuevas claves de i18n

### Convención de naming a seguir

El namespace `nav` actual usa claves "planas" en `camelCase`/lowercase simples (`hero`, `projects`, `cv`, etc.), sin sub-objetos anidados. Otros namespaces (`theme`) usan el patrón `toggle_light` / `toggle_dark` con snake_case para acciones con dos estados. Para mantenerse dentro de `nav` (como pide proposal.md: "namespace `nav`") y a la vez seguir el patrón de "par de claves para un control con dos estados" de `theme`, se proponen:

```
nav.openMenu   -> "Abrir menú" / "Open menu"
nav.closeMenu  -> "Cerrar menú" / "Close menu"
```

Justificación: `nav` ya tiene claves simples en camelCase implícito (de hecho son todas minúsculas de una palabra, pero `cv` también es una palabra). `openMenu`/`closeMenu` es camelCase, consistente con el estilo de nombres de archivo/props TS del proyecto (`isOpen`, `getSectionHref`, etc.) y más legible que `menu_open`/`open_menu`. Se descarta `nav.menu.open` / `nav.menu.close` (anidar un sub-objeto) porque rompería la "planitud" actual del namespace `nav` sin necesidad — el spec solo pide 2 strings, no justifica una nueva agrupación.

### Cambios exactos

**`messages/es.json`** — dentro de `"nav": { ... }`, añadir tras `"cv": "CV"`:

```json
  "nav": {
    "hero": "Inicio",
    "projects": "Proyectos",
    "stack": "Stack",
    "experience": "Experiencia",
    "education": "Educación",
    "contact": "Contacto",
    "cv": "CV",
    "openMenu": "Abrir menú",
    "closeMenu": "Cerrar menú"
  },
```

**`messages/en.json`** — dentro de `"nav": { ... }`, añadir tras `"cv": "CV"`:

```json
  "nav": {
    "hero": "Home",
    "projects": "Projects",
    "stack": "Stack",
    "experience": "Experience",
    "education": "Education",
    "contact": "Contact",
    "cv": "CV",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
  },
```

No tocar el resto de namespaces. Recordar que no hay validación de esquema de mensajes automática en este proyecto más allá de TypeScript (`next-intl` con `messages/es.json` como tipo de referencia si está configurado en `global.d.ts` — comprobar si existe, pero no es bloqueante: añadir las claves en ambos locales es suficiente).

---

## 2. `components/layout/MobileNav.tsx` (Server Component nuevo)

Mismo patrón exacto que `components/layout/Nav.tsx` (ver `C:\Users\migue\Documents\Proyectos\miguealguacil\components\layout\Nav.tsx`), cambiando solo la clase del `<nav>` (de horizontal `hidden md:flex` a vertical para el panel) y los estilos de cada `<a>`.

### Contenido propuesto completo

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { getSectionHref } from '@/lib/navigation'
import type { SectionKey } from '@/lib/navigation'

const NAV_ITEMS: SectionKey[] = ['projects', 'stack', 'experience', 'education', 'contact']

export async function MobileNav() {
  const t = await getTranslations('nav')
  const locale = await getLocale()

  return (
    <nav className="flex flex-col">
      {NAV_ITEMS.map((key) => (
        <a
          key={key}
          href={getSectionHref(locale, key)}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-accent hover:bg-surface-hover transition-colors px-5 py-3 border-b border-default last:border-b-0"
        >
          {t(key)}
        </a>
      ))}
    </nav>
  )
}
```

### Notas

- `NAV_ITEMS` es una copia deliberada del array de `Nav.tsx` (Decisión 2 del design.md: no extraer a `lib/navigation.ts`). Mantener el mismo orden y los mismos 5 `SectionKey` (`'projects' | 'stack' | 'experience' | 'education' | 'contact'`) — **no** incluir `'hero'` (el logo del Header ya cubre ese enlace, igual que en `Nav.tsx`).
- `getTranslations('nav')` y `getLocale()` son las mismas funciones `async` de `next-intl/server` ya usadas en `Nav.tsx` y `Header.tsx`. No requieren ningún cambio de configuración.
- Las clases Tailwind:
  - `flex flex-col` → panel vertical (vs `hidden md:flex items-center gap-6` horizontal de `Nav`).
  - Cada `<a>` ocupa el ancho completo del panel (`block` implícito por ser hijo de `flex-col` sin `w-full` explícito — pero como el contenedor padre del dropdown tendrá `w-full`, conviene añadir `block`/dejar que el flex-col estire los hijos; **recomendado añadir `w-full`** a cada `<a>` para asegurar área de toque completa en móvil. Ver bloque "Ajuste recomendado" abajo).
  - `px-5 py-3` → padding generoso para área táctil (mínimo recomendado ~44px de alto; `py-3` con `text-xs` + `leading` por defecto da ~44-48px con el font-mono, pero conviene verificar visualmente).
  - `border-b border-default last:border-b-0` → separadores horizontales entre enlaces, tokens "Technical Brutalist" (`--color-border` vía `.border-default`), sin redondeados (no se usa `rounded-*` en ningún momento, cumpliendo `rounded-none` implícito al no declarar radius).
  - `hover:bg-surface-hover` → feedback visual en hover/touch, usando el token `--color-surface-hover` ya definido en `app/globals.css`.

**Ajuste recomendado para área de toque completa** (añadir `w-full block` y opcionalmente quitar `flex` del `<nav>` si los `<a>` ya son `block`):

```tsx
        <a
          key={key}
          href={getSectionHref(locale, key)}
          className="block w-full font-mono text-xs uppercase tracking-wide text-muted hover:text-accent hover:bg-surface-hover transition-colors px-5 py-3 border-b border-default last:border-b-0"
        >
          {t(key)}
        </a>
```

Y el `<nav>` puede quedar simplemente `className="flex flex-col"` (los `<a>` con `block w-full` ya ocupan el ancho).

---

## 3. `components/layout/MobileMenuToggle.tsx` (Client Component nuevo)

### Contrato de props

```tsx
'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface MobileMenuToggleProps {
  /** Contenido del panel desplegable — `<MobileNav />` ya renderizado en servidor */
  children: ReactNode
  /** aria-label traducido para el estado cerrado, p.ej. t('openMenu') */
  openLabel: string
  /** aria-label traducido para el estado abierto, p.ej. t('closeMenu') */
  closeLabel: string
}
```

**Por qué recibe los labels como props y no usa `useTranslations` en cliente**: el componente padre (`Header.tsx`) ya es un Server Component con `getTranslations('nav')` resuelto (`t`). Pasar `t('openMenu')` y `t('closeMenu')` como strings evita:
- enviar el diccionario de mensajes completo al cliente (next-intl client requiere `NextIntlClientProvider` con los mensajes, que puede no estar configurado a nivel granular aquí),
- duplicar la resolución de `locale`.

Esto sigue exactamente la misma filosofía que Decisión 1 del design.md ("Server Components por defecto; `'use client'` solo cuando hay estado/efectos cliente").

### Estado y refs

```tsx
const [isOpen, setIsOpen] = useState(false)
const buttonRef = useRef<HTMLButtonElement>(null)
const panelRef = useRef<HTMLDivElement>(null)
```

### Efectos

**1) Escape cierra el panel y devuelve el foco al botón** (con cleanup):

```tsx
useEffect(() => {
  if (!isOpen) return

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [isOpen])
```

**2) Mover el foco al primer enlace del panel al abrir**:

```tsx
useEffect(() => {
  if (isOpen) {
    const firstLink = panelRef.current?.querySelector<HTMLAnchorElement>('a')
    firstLink?.focus()
  }
}, [isOpen])
```

> Nota: ambos efectos reaccionan a `isOpen`. Pueden fusionarse en un único `useEffect` o mantenerse separados por claridad (separados es más legible y cada uno tiene una única responsabilidad — preferible para tests que verifican comportamientos independientes). Recomiendo **mantenerlos separados**.

### Handlers

**Toggle del botón**:

```tsx
function handleToggle() {
  setIsOpen((prev) => !prev)
}
```

**Delegación de click en el panel** (cierra si el click fue en un `<a>`):

```tsx
function handlePanelClick(event: React.MouseEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement
  if (target.closest('a')) {
    setIsOpen(false)
  }
}
```

`target.closest('a')` cubre el caso de que el `<a>` tenga hijos (p. ej. un `<span>` con el texto) — más robusto que `target.tagName === 'A'`.

### JSX completo propuesto

```tsx
'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface MobileMenuToggleProps {
  children: ReactNode
  openLabel: string
  closeLabel: string
}

export function MobileMenuToggle({ children, openLabel, closeLabel }: MobileMenuToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const firstLink = panelRef.current?.querySelector<HTMLAnchorElement>('a')
      firstLink?.focus()
    }
  }, [isOpen])

  function handlePanelClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('a')) {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label={isOpen ? closeLabel : openLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-none text-muted hover:text-accent transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {isOpen ? (
            <>
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </>
          ) : (
            <>
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          onClick={handlePanelClick}
          className="absolute top-full left-0 right-0 z-50 bg-surface border border-default border-t-0 rounded-none shadow-sm"
        >
          {children}
        </div>
      )}
    </div>
  )
}
```

### Notas sobre el JSX

- **`w-9 h-9 rounded-none ... transition-colors`** replica exactamente las clases del botón de `ThemeToggle.tsx` (`flex items-center justify-center w-9 h-9 rounded-none text-muted hover:text-accent transition-colors`) para mantener consistencia visual entre los botones-icono del Header.
- **Icono hamburguesa/cerrar**: SVG inline con `viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth="2"`, mismo estilo que los SVG de `ThemeToggle` (sol/luna). Se alterna entre 3 líneas horizontales (hamburguesa) y una "X" (cerrar) según `isOpen`. Esto NO es obligatorio por el spec (que solo exige `aria-expanded`/`aria-controls`/`aria-label` correctos), pero da feedback visual consistente con el cambio de `aria-label`. Si se prefiere simplicidad máxima, se puede usar un único icono de hamburguesa fijo — pero cambiar el icono es trivial y mejora UX sin coste de rendimiento.
- **`aria-controls="mobile-nav-panel"`**: requiere que el `<div>` del panel tenga `id="mobile-nav-panel"` — coincide en el JSX. Importante: el `id` debe ser literal/estático (no generado con `useId()` salvo que se prevea más de una instancia de `MobileMenuToggle` en la página — no es el caso, solo se renderiza una vez en `Header`). Si en el futuro se reutiliza el componente más de una vez en la misma página, **entonces sí** habría que usar `useId()` para evitar IDs duplicados; por ahora con un único `Header` por página, el `id` fijo es seguro y más simple, y permite que los tests lo localicen por `getByRole('button')` + `aria-controls` sin generar valores aleatorios impredecibles en jsdom.
- **Renderizado condicional `{isOpen && (...)}`**: el panel solo se monta en el DOM cuando está abierto. Esto es importante para:
  - el test de "Escape cierra y devuelve foco" — `panelRef.current` será `null` cuando `isOpen === false`, pero el efecto de Escape solo se registra cuando `isOpen === true`, así que no hay problema de orden.
  - el test de "foco al primer link al abrir" — el `querySelector('a')` solo se ejecuta cuando el panel ya está en el DOM (el efecto corre después del render, cuando `isOpen` ya es `true` y el panel ya está montado).
  - **riesgo de orden de efectos**: en React, cuando `setIsOpen(true)` causa un re-render, el `<div ref={panelRef}>` se monta en el mismo commit donde corre el `useEffect` de foco — esto es seguro porque los effects corren *después* de que el DOM está actualizado (después del commit). No requiere `useLayoutEffect`.
- **`relative md:hidden`** en el contenedor raíz: el `md:hidden` asegura que tanto el botón como el panel desaparecen completamente en desktop (≥768px), dejando intacto el layout de `Nav` (`hidden md:flex`). `relative` es necesario porque el panel usa `absolute top-full left-0 right-0` posicionado respecto a este contenedor — **no** respecto al `<header>` completo. Ver sección 5 "Riesgos" sobre el ancho del dropdown.

---

## 4. `components/layout/Header.tsx` — integración

### Estado actual (referencia)

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { getPersonal } from '@/lib/content'
import { getSectionHref } from '@/lib/navigation'
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
          href={getSectionHref(locale, 'hero')}
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

### Diff conceptual propuesto

1. Añadir imports de `MobileNav` y `MobileMenuToggle`.
2. Insertar `<MobileMenuToggle openLabel={t('openMenu')} closeLabel={t('closeMenu')}><MobileNav /></MobileMenuToggle>` dentro del `<div className="flex items-center gap-1">` que ya agrupa CV/LocaleToggle/ThemeToggle — **antes** de `LocaleToggle`/`ThemeToggle`, o al final. Recomiendo colocarlo **al principio** de ese grupo (antes del enlace CV) para que en móvil el orden visual sea: logo — [hamburguesa] — CV — LocaleToggle — ThemeToggle. Esto respeta el orden de tabulación del spec ("Nav links → ThemeToggle → LocaleToggle" en desktop; en móvil el botón de menú debe ser alcanzable antes de los demás controles, ya que es el control de navegación principal).

   Alternativa igualmente válida: colocarlo justo después de `<Nav />` y antes del `<div className="flex items-center gap-1">`. Cualquiera de las dos posiciones es correcta funcionalmente porque `MobileMenuToggle` tiene `md:hidden` (no afecta el layout desktop). **Recomiendo la posición "antes del grupo CV/Locale/Theme"** porque agrupa visualmente todos los "controles" del Header en un solo contenedor flex, consistente con la estructura actual.

3. `MobileNav` se invoca como **Server Component async dentro de otro Server Component** (`Header`) y se pasa como `children` a `MobileMenuToggle` (Client Component). Esto es válido en Next.js 16 App Router: un Server Component puede renderizarse en el árbol del servidor y su resultado (JSX ya resuelto) pasarse como `children`/prop a un Client Component, siempre que el Client Component no necesite re-ejecutar lógica de servidor sobre ese `children` — solo lo posiciona/oculta vía CSS. Esto coincide exactamente con el patrón "Server Component como children de Client Component" documentado para composición Server/Client.

### Contenido completo propuesto de `Header.tsx`

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { getPersonal } from '@/lib/content'
import { getSectionHref } from '@/lib/navigation'
import { Nav } from './Nav'
import { MobileNav } from './MobileNav'
import { MobileMenuToggle } from './MobileMenuToggle'
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
          href={getSectionHref(locale, 'hero')}
          className="font-mono text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          miguealguacil
        </a>
        <div className="flex items-center gap-4">
          <Nav />
          <div className="flex items-center gap-1">
            <MobileMenuToggle openLabel={t('openMenu')} closeLabel={t('closeMenu')}>
              <MobileNav />
            </MobileMenuToggle>
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

### Cambios resumidos respecto al actual

- `+ import { MobileNav } from './MobileNav'`
- `+ import { MobileMenuToggle } from './MobileMenuToggle'`
- `+` nuevo bloque `<MobileMenuToggle ...><MobileNav /></MobileMenuToggle>` insertado como primer hijo de `<div className="flex items-center gap-1">`.
- **Nada más cambia**: `Nav`, el enlace de logo, CV, `LocaleToggle`, `ThemeToggle` permanecen idénticos en JSX y posición relativa entre ellos.

### Por qué `MobileNav` se invoca como `<MobileNav />` (JSX) y no `await MobileNav()`

En el test de `Nav.test.tsx` se ve el patrón `const navOutput = await Nav(); render(navOutput)` porque se está testeando a `Nav` de forma aislada e invocándolo como función async. Pero **dentro de `Header.tsx`** (que es a su vez un Server Component async renderizado por el framework), `<MobileNav />` se usa como elemento JSX normal — Next.js/React resuelve los Server Components async automáticamente cuando aparecen en el árbol de JSX de otro Server Component. Esto es exactamente lo que ya hace `Header.tsx` actualmente con `<Nav />` (JSX, no `await Nav()`). **No cambiar este patrón.**

---

## 5. Riesgos técnicos detectados

### 5.1 Ancho del dropdown (`absolute top-full left-0 right-0`)

El contenedor `relative md:hidden` de `MobileMenuToggle` tiene el ancho del propio botón (`w-9`, ~36px), porque es un `<div>` sin `flex-1` ni `w-full` dentro del `<div className="flex items-center gap-1">`. Si el panel usa `absolute top-full left-0 right-0` **relativo a ese contenedor de 36px**, `left-0 right-0` lo estirará... pero solo si el contenedor padre tiene `position: relative` y el `right-0`/`left-0` se calculan respecto a ese padre de 36px — el resultado sería un panel de 36px de ancho, no de ancho completo de pantalla.

**Esto es un problema real.** Opciones:

- **Opción A (recomendada)**: cambiar el posicionamiento del panel a `fixed left-0 right-0` (en vez de `absolute`). `position: fixed` se posiciona respecto al viewport, ignorando el contenedor `relative` de 36px. Combinarlo con `top-16` (altura del header, `h-16` = 4rem = 64px) para que el panel aparezca justo debajo del Header sticky:

  ```tsx
  className="fixed top-16 left-0 right-0 z-40 bg-surface border-b border-default ..."
  ```

  Ventaja: ancho de viewport completo, no depende del padre. `z-40` (por debajo del `z-50` del header) o `z-50` también vale ya que no se superponen verticalmente.

- **Opción B**: hacer que el contenedor `relative` de `MobileMenuToggle` tenga `w-full` y mover el `<div className="relative md:hidden">` para que envuelva **todo el grupo de controles** o se posicione de otra forma — demasiado invasivo para `Header.tsx`, se descarta.

- **Opción C**: usar `absolute` pero anclado al `<header>` en lugar de al botón — requeriría que `Header` tenga `position: relative` (ya tiene `sticky`, que crea un contexto de posicionamiento) y que el panel use `left-0 right-0` con un `<div>` adicional fuera del flujo del `<div className="flex items-center justify-between">`. Más invasivo.

**Decisión recomendada**: **Opción A** — `position: fixed`, `top-16` (coincide con `h-16` del header), `left-0 right-0`. Es la más simple, no requiere tocar la estructura de `Header.tsx` más allá de insertar `MobileMenuToggle`, y el `design.md` ya menciona "el panel usa `position: fixed`/`absolute` respecto al Header (que ya es `sticky`)" como mitigación aceptada.

**Ajuste al JSX de `MobileMenuToggle` (sección 3) — reemplazar la clase del panel**:

```tsx
className="fixed top-16 left-0 right-0 z-40 bg-surface border-b border-default rounded-none shadow-sm"
```

(quitar `absolute top-full ... border ... border-t-0`, usar `fixed top-16 ... border-b`).

Si el alto del Header cambiara en el futuro (`h-16` → otro valor), habría que actualizar `top-16` en consonancia — es un acoplamiento implícito a documentar con un comentario en el código:

```tsx
{/* top-16 coincide con la altura h-16 del Header (ver Header.tsx) */}
```

### 5.2 z-index

`Header` usa `z-50`. El panel móvil con `fixed top-16 ... z-40` queda **por debajo** del header en el eje z pero **debajo verticalmente** (no se superponen), así que no hay conflicto real de apilamiento visual. Si se prefiere garantizar que el panel se superponga a cualquier contenido de la página (Hero, secciones) al hacer scroll con el panel abierto, `z-40` es suficiente siempre que el resto del contenido no use z-index ≥ 40. Verificar rápidamente que no hay otros `z-*` altos en `components/sections/` — si los hubiera, subir a `z-50` (mismo nivel que el header) no causa problema porque no se solapan en el mismo punto vertical.

### 5.3 Pasar Server Component (`MobileNav`) como `children` de Client Component

Válido en Next.js 16 App Router (mismo patrón usado por ejemplo para `<ClientWrapper><ServerChild /></ClientWrapper>`). Restricciones:
- `MobileMenuToggle` **no debe** intentar clonar, inspeccionar props internas, ni re-renderizar `children` condicionalmente de forma que React necesite "recrear" el árbol server — solo debe **mostrar/ocultar** vía el `{isOpen && <div>{children}</div>}` ya propuesto. Esto es exactamente lo que hace el plan: `children` se renderiza una sola vez (cuando `isOpen` es `true`) dentro de un `<div>` controlado por estado cliente — el contenido de `MobileNav` ya viene resuelto desde el servidor como árbol de elementos React serializado (RSC payload), no se re-ejecuta en cliente.
- No pasar funciones, refs, ni clases no serializables desde `Header.tsx` (Server) a `MobileMenuToggle` (Client) — en este plan solo se pasan `children` (JSX resuelto) y dos `string` (`openLabel`, `closeLabel`), ambos serializables. Cumple la restricción de Next.js sobre props de Server → Client.

### 5.4 `id="mobile-nav-panel"` fijo vs `useId()`

Como se indica en la sección 3, un `id` literal es seguro mientras `MobileMenuToggle` se use una sola vez por página (es el caso: solo en `Header`, y `Header` se renderiza una vez por layout). Si en el futuro se reutiliza, cambiar a `useId()` y interpolar en `aria-controls`/`id`.

### 5.5 Listener global de `keydown` y limpieza

El `useEffect` de Escape se registra/desregistra condicionado a `isOpen` (con `return () => document.removeEventListener(...)`). Esto es el patrón estándar de React y ya cubierto en el plan. **Importante para el test**: el test debe simular `isOpen === true` (clickeando el botón primero) antes de disparar `keydown`, y verificar que tras Escape:
  - el panel ya no está en el DOM (`queryByRole('link')` → `null`, o `aria-expanded="false"`),
  - `document.activeElement === button` (foco devuelto).

### 5.6 Foco al abrir — jsdom y `:focus`

`firstLink?.focus()` en jsdom funciona y actualiza `document.activeElement`, pero **no** dispara estilos `:focus-visible` reales (no relevante para los tests, que verifican `document.activeElement` directamente, no estilos).

### 5.7 Orden de los efectos en el primer render

En el primer render, `isOpen === false`, por lo que:
- el efecto de Escape hace `return` temprano sin registrar el listener — correcto.
- el efecto de foco no hace nada (`if (isOpen)` es `false`) — correcto.

Cuando el usuario hace click y `isOpen` pasa a `true`, React re-renderiza, el panel se monta, y **después** corren ambos efectos: el de Escape registra el listener, el de foco mueve el foco al primer `<a>`. Orden correcto sin necesidad de `useLayoutEffect`.

### 5.8 Interacción con Lenis (scroll suave)

El design.md ya descarta cambios a Lenis. Con `position: fixed`, el panel no se ve afectado por el scroll suave (los elementos `fixed` no se desplazan con el scroll del contenido). No se requiere `scroll lock` (no es un overlay a pantalla completa, es un dropdown corto).

---

## 6. Tests Vitest — esqueletos

### 6.1 `components/layout/__tests__/MobileNav.test.tsx`

Replica exactamente el patrón de `Nav.test.tsx` (mismo mock de `next-intl/server`):

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))

describe('MobileNav', () => {
  it('renders 5 nav links', async () => {
    const { MobileNav } = await import('../MobileNav')
    const output = await MobileNav()
    render(output)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })

  it('links point to home anchors for the default locale (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { MobileNav } = await import('../MobileNav')
    const output = await MobileNav()
    render(output)
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
    const { MobileNav } = await import('../MobileNav')
    const output = await MobileNav()
    render(output)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toEqual([
      '/en#projects',
      '/en#stack',
      '/en#experience',
      '/en#education',
      '/en#contact',
    ])
  })
})
```

Nota: igual que `Nav.test.tsx`, el mock `getTranslations: async () => (key: string) => key` hace que `t(key)` devuelva la clave literal (`projects`, `stack`, etc.) en lugar del texto traducido — suficiente para verificar conteo y `href`, no se verifica el texto visible aquí (igual que en `Nav.test.tsx`).

### 6.2 `components/layout/__tests__/MobileMenuToggle.test.tsx`

No requiere mocks de `next-intl` (recibe los labels como props simples). Usa `userEvent` o `fireEvent` de Testing Library — verificar cuál usa el resto del proyecto: ninguno de los tests existentes usa `userEvent` (`ThemeToggle.test.tsx`, `LocaleToggle.test.tsx` usan solo `render`/`screen`, sin interacción). Para clicks y keydown, usar `fireEvent` de `@testing-library/react` (ya disponible, no requiere instalar `@testing-library/user-event` — **no añadir dependencias nuevas sin confirmación**, y `fireEvent` es suficiente para click/keydown sintéticos).

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MobileMenuToggle } from '../MobileMenuToggle'

function renderToggle() {
  return render(
    <MobileMenuToggle openLabel="Open menu" closeLabel="Close menu">
      <nav>
        <a href="/#proyectos">PROYECTOS</a>
        <a href="/#stack">STACK</a>
      </nav>
    </MobileMenuToggle>,
  )
}

describe('MobileMenuToggle', () => {
  it('starts closed and opens/closes the panel on button click', () => {
    renderToggle()
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'PROYECTOS' })).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-label', 'Close menu')
    expect(screen.getByRole('link', { name: 'PROYECTOS' })).toBeInTheDocument()

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'PROYECTOS' })).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the button', () => {
    renderToggle()
    const button = screen.getByRole('button', { name: 'Open menu' })

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'PROYECTOS' })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(button)
  })

  it('closes the panel when clicking an internal link', () => {
    renderToggle()
    const button = screen.getByRole('button', { name: 'Open menu' })

    fireEvent.click(button)
    const link = screen.getByRole('link', { name: 'PROYECTOS' })
    fireEvent.click(link)

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'PROYECTOS' })).not.toBeInTheDocument()
  })
})
```

#### Notas sobre los tests

- **Test 1 (toggle)**: cubre tarea `2.1` del `tasks.md`. Verifica `aria-expanded` inicial `"false"`, cambio a `"true"` tras click, presencia/ausencia del panel (`getAllByRole('link')` o `queryByRole`), y el `aria-label` cambiando de `openLabel` a `closeLabel`.
- **Test 2 (Escape)**: cubre tarea `2.2`. Usa `fireEvent.keyDown(document, { key: 'Escape' })` porque el listener se registra en `document` (no en un elemento concreto). Verifica `document.activeElement === button` tras Escape.
- **Test 3 (click en link)**: cubre tarea `2.3`. Verifica que el click en un `<a>` dentro del panel (delegación de evento sobre el contenedor) cierra el panel.
- **jsdom y `focus()`**: jsdom soporta `.focus()` y actualiza `document.activeElement` de forma síncrona — no se necesita `await` ni `act()` extra para los asserts de foco, pero si aparecen warnings de "not wrapped in act", envolver el `fireEvent` correspondiente no es necesario porque `fireEvent` ya hace flush de actualizaciones de React de forma síncrona en Testing Library. Si surgieran warnings de efectos asíncronos, usar `act(() => {...})` igual que en `ThemeToggle.test.tsx`.
- **No es necesario mockear `next-intl`** en este archivo porque `MobileMenuToggle` no usa `useTranslations`/`useLocale` — recibe `openLabel`/`closeLabel` como props string planas, según el contrato decidido (sección 3).

---

## 7. Orden de implementación recomendado (alineado con `tasks.md`)

1. `messages/es.json` + `messages/en.json` → añadir `nav.openMenu` / `nav.closeMenu` (sección 1).
2. Tests que fallan: `components/layout/__tests__/MobileMenuToggle.test.tsx` (3 casos, sección 6.2) y `components/layout/__tests__/MobileNav.test.tsx` (sección 6.1). Ejecutar `npm run test` y confirmar que fallan por "Cannot find module '../MobileNav'" / `'../MobileMenuToggle'`.
3. Crear `components/layout/MobileNav.tsx` (sección 2).
4. Crear `components/layout/MobileMenuToggle.tsx` (sección 3, con el ajuste de posicionamiento `fixed top-16` de la sección 5.1).
5. Ejecutar `npm run test` de nuevo — los 5 tests nuevos deben pasar (2 de `MobileNav`, 3 de `MobileMenuToggle`; nota: el esqueleto de `MobileNav.test.tsx` tiene 3 `it()` igual que `Nav.test.tsx`).
6. Modificar `components/layout/Header.tsx` (sección 4) — integrar `MobileMenuToggle` + `MobileNav` + `t('openMenu')`/`t('closeMenu')`.
7. Ejecutar `npm run test` completo — verificar que `Header.test.tsx` sigue pasando (no testea `MobileMenuToggle`/`MobileNav` directamente porque los mockea solo parcialmente; revisar si `Header.test.tsx` necesita mocks adicionales — ver nota abajo).
8. `npm run lint && npm run test && npm run build`.
9. E2E Playwright MCP (viewport móvil 375px, ES/EN, abrir/cerrar, Escape, click en enlace, toggles tema/idioma) según tareas 5.1-5.8 de `tasks.md`.

### Nota sobre `Header.test.tsx` y los nuevos imports

`Header.test.tsx` actualmente mockea `../Nav`, `../ThemeToggle`, `../LocaleToggle` con `vi.mock(...)`, pero **no** mockea `../MobileNav` ni `../MobileMenuToggle` (no existían). Tras la integración:

- `Header.test.tsx` importará (transitivamente) `MobileNav.tsx` y `MobileMenuToggle.tsx` reales si no se mockean.
- `MobileNav` usa `getTranslations`/`getLocale` de `next-intl/server`, que **ya está mockeado globalmente** en `Header.test.tsx` (`vi.mock('next-intl/server', ...)` con `mockLocale`), así que `MobileNav` debería renderizar sin problema con ese mock existente (mismo patrón que usa `Nav` real... aunque `Nav` está mockeado allí).
- `MobileMenuToggle` es un Client Component con `useState`/`useEffect` — en el entorno jsdom de Vitest debería renderizar sin problema (no requiere `next-themes` ni nada externo, a diferencia de `ThemeToggle`).

**Recomendación**: añadir también mocks para `../MobileNav` y `../MobileMenuToggle` en `Header.test.tsx`, siguiendo el mismo patrón que los mocks existentes de `../Nav`/`../ThemeToggle`/`../LocaleToggle`:

```tsx
vi.mock('../MobileNav', () => ({
  MobileNav: () => <nav data-testid="mobile-nav-mock" />,
}))
vi.mock('../MobileMenuToggle', () => ({
  MobileMenuToggle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mobile-menu-toggle-mock">{children}</div>
  ),
}))
```

Esto mantiene `Header.test.tsx` enfocado en lo que ya testea (el `href` del logo) sin acoplarlo a los detalles internos de los nuevos componentes (que ya tienen sus propios tests dedicados). **Modificar `Header.test.tsx` para añadir estos dos mocks** es parte del paso 3.2 de `tasks.md` ("Verificar que `Nav` no cambia de comportamiento ni de markup") — aunque técnicamente es un cambio en el test, no en `Nav` ni en su comportamiento.

---

## 8. Checklist de verificación final (recordatorio de `tasks.md` / `openspec-tasks-mandatory-steps.md`)

- [ ] `npm run lint && npm run test && npm run build` en verde.
- [ ] Tests nuevos (`MobileNav.test.tsx`, `MobileMenuToggle.test.tsx`) pasan; tests existentes (`Nav.test.tsx`, `Header.test.tsx`, `ThemeToggle.test.tsx`, `LocaleToggle.test.tsx`) siguen pasando.
- [ ] E2E Playwright MCP en viewport móvil (375px) y desktop (≥768px), ES y EN — pasos 5.1-5.8 de `tasks.md`.
- [ ] `messages/es.json` y `messages/en.json` con `nav.openMenu`/`nav.closeMenu` sincronizados.
- [ ] Informe de verificación en `openspec/changes/mobile-navigation/reports/<fecha>-verification.md`.
- [ ] Marcar resuelto el hallazgo 1.3 en `openspec/AUDIT-2026-06-13.md`.
- [ ] PR con `gh` + skill `write-pr-report`.
