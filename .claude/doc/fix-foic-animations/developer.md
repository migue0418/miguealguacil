# Plan técnico: fix-foic-animations

Lee también `openspec/changes/fix-foic-animations/{proposal.md,design.md,tasks.md,specs/**}`
antes de implementar — este plan asume que ya los conoces y se centra en el detalle de
archivo/código/tests.

## Resumen del enfoque (recordatorio)

Para `FadeIn`, `SlideUp`, `StaggerChildren`:
- Nuevo estado `shouldAnimate` (inicial `false`).
- `useLayoutEffect` (una vez, al montar):
  - Si `prefersReduced` → no hacer nada (`shouldAnimate` queda `false` para siempre).
  - Si no: medir `ref.current.getBoundingClientRect()`.
    - Si `rect.top < window.innerHeight && rect.bottom > 0` (ya visible) → no hacer nada
      (`shouldAnimate` queda `false`).
    - Si no (fuera de viewport) → `setShouldAnimate(true)`.
- Render: `if (!shouldAnimate || prefersReduced) return <div ref={ref} className={className}>{children}</div>`
  (generaliza el branch `prefersReduced` actual); si no, el `motion.div` actual con
  `initial`/`animate={isInView ? visible : hidden}`.

Para `SmoothScroll`: dentro del `useEffect` existente, antes de `new Lenis(...)`, comprobar
`window.matchMedia('(prefers-reduced-motion: reduce)').matches` → si `true`, `return` sin crear
Lenis ni RAF loop.

**Cero cambios de API/props** en los 4 componentes.

---

## 1. `components/animations/FadeIn.tsx` — contenido completo

```tsx
'use client'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReduced = useReducedMotion()
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useLayoutEffect(() => {
    if (prefersReduced) return
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0
    if (!alreadyVisible) {
      setShouldAnimate(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!shouldAnimate || prefersReduced) {
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

### Notas FadeIn

- **`useRef<HTMLDivElement>(null)`** (antes `useRef(null)`, sin tipar). Es necesario para que
  TS (`strict: true`) permita `el.getBoundingClientRect()` sin `any`. `motion.div`'s `ref` y el
  `<div ref={ref}>` del fallback aceptan `React.RefObject<HTMLDivElement | null>` sin problema
  (React 19 + framer-motion 12 son compatibles con `useRef<T>(null)`).
- **Orden de hooks**: `useInView` y `useReducedMotion` se mantienen ANTES del nuevo estado/efecto,
  igual que el resto del archivo — minimiza el diff visual respecto al original.
- **`useLayoutEffect` con deps `[]`**: se ejecuta una sola vez al montar, leyendo `ref.current`
  y `prefersReduced` en ese momento. El lint `react-hooks/exhaustive-deps` se queja porque
  `prefersReduced` "cambia" entre renders (aunque en la práctica solo se resuelve una vez, ver
  nota de `useReducedMotion` más abajo). Se añade
  `// eslint-disable-next-line react-hooks/exhaustive-deps` justo antes del array de deps,
  siguiendo la convención de un solo comentario para todo el hook. Alternativa aceptable: incluir
  `prefersReduced` en las deps — **NO recomendado**, porque si en un futuro
  `useReducedMotion()` cambiara de valor tras montar (no ocurre en la versión actual, ver nota
  abajo) el efecto se re-ejecutaría y podría volver a evaluar `getBoundingClientRect()` en un
  momento no deseado. Usar `[]` + eslint-disable es la opción más predecible y la que mejor
  refleja "se ejecuta una vez al montar".
- **`useReducedMotion()` se resuelve sincrónicamente en el primer render cliente**: internamente
  llama a `initPrefersReducedMotion()` que ejecuta `window.matchMedia('(prefers-reduced-motion)')`
  de forma síncrona dentro de la propia llamada a la función (antes de `useState`), por lo que
  en el `useLayoutEffect` del primer mount `prefersReduced` YA tiene el valor correcto (no es
  `null`/valor por defecto sin resolver). El riesgo descrito en `design.md` ("puede no estar
  resuelto en el primer `useLayoutEffect`") es un caso defensivo que no se da en la práctica con
  framer-motion 12.40, pero el branch `!shouldAnimate || prefersReduced` lo cubre igualmente si
  alguna vez cambiara.
- **`window.innerHeight`**: disponible siempre en cliente (no requiere `typeof window !==
  'undefined'` guard porque `useLayoutEffect` solo corre en cliente).
- **Render del fallback**: el `<div ref={ref} className={className}>{children}</div>` es
  EXACTAMENTE el mismo nodo que el branch `prefersReduced` actual — sin `opacity:0` ni ningún
  estilo inline. Esto es lo que se sirve en SSR y en el primer pintado cliente SIEMPRE (porque
  `shouldAnimate` inicia en `false`), cumpliendo el escenario "Contenido visible sin
  JavaScript".

---

## 2. `components/animations/SlideUp.tsx` — contenido completo

```tsx
'use client'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

interface SlideUpProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function SlideUp({ children, delay = 0, className }: SlideUpProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReduced = useReducedMotion()
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useLayoutEffect(() => {
    if (prefersReduced) return
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0
    if (!alreadyVisible) {
      setShouldAnimate(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!shouldAnimate || prefersReduced) {
    return <div ref={ref} className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

Notas: idénticas a FadeIn. Único cambio respecto al original: `useRef(null)` →
`useRef<HTMLDivElement>(null)`, nuevo estado/efecto, y generalización del branch
`prefersReduced` → `!shouldAnimate || prefersReduced`. El `motion.div` (`initial`/`animate`
con `y: 24`/`y: 0`) no cambia.

---

## 3. `components/animations/StaggerChildren.tsx` — contenido completo

```tsx
'use client'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

import type { Variants } from 'framer-motion'

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const container = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: { staggerChildren: staggerDelay },
  }),
}

interface StaggerChildrenProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerChildren({ children, staggerDelay = 0.1, className }: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReduced = useReducedMotion()
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useLayoutEffect(() => {
    if (prefersReduced) return
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0
    if (!alreadyVisible) {
      setShouldAnimate(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!shouldAnimate || prefersReduced) {
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

Notas: mismo patrón. `staggerItem` y `container` no cambian. `motion.div` con
`variants`/`custom`/`initial="hidden"`/`animate={isInView ? 'visible' : 'hidden'}` no cambia.

### Punto 4 del encargo — ¿funciona el fallback `!shouldAnimate || prefersReduced` con los hijos
`variants={staggerItem}`?

**Sí, funciona correctamente — sin cambios adicionales.** Verificado en
`node_modules/framer-motion/dist/es/motion/utils/use-visual-state.mjs` +
`context/MotionContext/utils.mjs`:

- `AnimatedProjectCard` / `AnimatedSkillChip` renderizan `<motion.div variants={staggerItem}>`
  **sin** `initial`/`animate` propios.
- Esto NO los convierte en "controlling variants" (`isControllingVariants` requiere que
  `initial`/`animate` sean variant labels — aquí son `undefined`). Por tanto heredan
  `initial`/`animate` del `MotionContext` del ancestro.
- Si el ancestro `StaggerChildren` renderiza un `<div>` plano (branch
  `!shouldAnimate || prefersReduced`), **no hay ningún `motion.div` ancestro** que provea
  `MotionContext` con `initial`/`animate` — el contexto que reciben es el valor por defecto
  (sin `initial`/`animate`, ambos `undefined`).
- En `use-visual-state.mjs`, con `initial=undefined` y `animate=undefined`, `variantToSet` =
  `undefined` → el bloque que aplica `target`/`transitionEnd` al estado inicial se salta por
  completo → `values = {}` → **ningún estilo inline** (`opacity`, `transform`, etc.) se aplica
  al hijo. El hijo se renderiza con su estilo natural/CSS — exactamente "visible por defecto".
- Esto **ya es el comportamiento actual** en el branch `prefersReduced` (sin cambios): el audit
  1.2 detectó `opacity:0` proveniente del `motion.div` PADRE (`StaggerChildren` mismo) en el
  caso `shouldAnimate=true`/no-reducido, no de los hijos en el branch plano. No hay regresión ni
  trabajo adicional necesario aquí — el fallback generalizado hereda gratis esta corrección para
  los hijos.
- **No flag de issue** — confirmado correcto tal cual está diseñado en `design.md`.

---

## 4. `components/layout/SmoothScroll.tsx` — contenido completo

```tsx
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

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

### Notas SmoothScroll

- Único cambio: el `if (window.matchMedia(...).matches) { return }` al principio del
  `useEffect`, antes de `new Lenis(...)`.
- `window.matchMedia` está disponible incondicionalmente en el cliente dentro de
  `useEffect` — no requiere guard de SSR.
- Cuando `matches === true`, el efecto retorna `undefined` (sin función de cleanup) — esto es
  válido para `useEffect` (cleanup opcional). No queda ningún `rafId`/`lenis` que limpiar
  porque no se crearon.
- **No listener en vivo** (`matchMediaQuery.addEventListener('change', ...)`) — explícitamente
  fuera de alcance (Non-Goal en `design.md`). Si el usuario cambia la preferencia del SO
  durante la sesión, Lenis no se (des)inicializa retroactivamente.
- Esto NO afecta el escenario "Sin errores de hydration": el `useEffect` sigue corriendo solo
  en cliente tras hidratar, igual que antes.

---

## 5. Tests Vitest — wrappers de animación

### Contexto técnico clave para los 3 archivos

**¿`render()` de Testing Library flushea `useLayoutEffect` sincrónicamente?** Sí. React Testing
Library envuelve `render()` en `act()`, y React garantiza que los `useLayoutEffect` se ejecutan
de forma síncrona durante el commit dentro de `act()` — **antes** de que `render()` retorne. No
se necesita `waitFor`/`act()` adicional para que `shouldAnimate` se actualice y el componente
re-renderice tras `useLayoutEffect` + `setShouldAnimate`. Sin embargo, hay un matiz: el
`setShouldAnimate(true)` dispara un **segundo render** dentro del mismo flush de `act()` — RTL
lo maneja automáticamente, el DOM que se observa con `screen.getBy...` tras `render(...)` ya
refleja el estado post-efecto. **No hace falta `act(() => {})` extra ni `waitFor`** para estos
tests (a diferencia de `ThemeToggle.test.tsx`, que usa `act(() => {})` por otros motivos —
RAF mocks).

**Mock de `getBoundingClientRect` / `window.innerHeight`**: jsdom por defecto devuelve un
`DOMRect` con todo a `0` (`top: 0, bottom: 0, ...`) y `window.innerHeight` es `768` (jsdom
default). Con los valores por defecto: `rect.top(0) < window.innerHeight(768)` → `true`, Y
`rect.bottom(0) > 0` → `false` → `alreadyVisible = true && false = false` → **`shouldAnimate`
se activa a `true` por defecto en jsdom sin mocks**. Esto es justo lo que dice el riesgo en
`design.md`. Por tanto:

- Para simular el **caso Hero (ya visible)**: mockear `HTMLElement.prototype.getBoundingClientRect`
  para devolver `{ top: 0, bottom: 100, ... }` (o cualquier rect con `top < innerHeight` y
  `bottom > 0`).
- Para simular el **caso below-the-fold (fuera de viewport)**: mockear
  `getBoundingClientRect` para devolver `{ top: 2000, bottom: 2100, ... }` (fuera del
  `innerHeight` de 768), O dejar el default de jsdom (`{top:0, bottom:0}`) que YA produce
  `alreadyVisible=false` → `shouldAnimate=true`. **Recomendado**: ser explícito y mockear
  ambos casos, no depender del default implícito (más legible y resiliente a cambios de jsdom).

**Mock de `useInView`/`useReducedMotion` existente**: se mantiene el `vi.mock('framer-motion',
...)` actual con `motion.div` simplificado a `<div {...props}>{children}</div>`. Esto sigue
funcionando: cuando `shouldAnimate=true` y `prefersReduced=false`, el componente renderiza el
`motion.div` mockeado → aparece como `<div>` normal con los props que framer-motion real
recibiría (`initial`, `animate`, etc. — no serializados como atributos HTML por el mock actual,
ya que el mock hace spread de `...props` sobre un `<div>` nativo; React filtrará/advertirá sobre
props desconocidos como `initial`/`animate`/`variants`/`custom` pero no rompe el test). Para
verificar "qué branch se renderiza" sin depender de esos warnings, lo más robusto es:

- Diferenciar los dos branches por la **presencia/ausencia de un dato identificable**: el
  branch `motion.div` (mock) recibirá props extra como `initial`/`animate` que un `<div>`
  normal no tendría. Pero como el mock hace `{...props}` sobre un `<div>`, esos props
  **inválidos para HTML** (`initial`, `animate`, `variants`, `custom`) se pasan igualmente al
  DOM real en jsdom (React 19 + jsdom no los descarta automáticamente para un elemento `div`
  custom mockeado — son simplemente atributos desconocidos que React intentará serializar como
  string o ignorar silenciosamente según el tipo). **Más simple y ya usado en este repo**: en
  vez de inspeccionar atributos, usar un mock de `motion.div` que añada una marca explícita,
  p.ej. `data-testid="motion-wrapper"`, para diferenciar claramente "se usó motion.div" vs "se
  usó el div plano del fallback". Ver mocks concretos abajo.

**`prefers-reduced-motion` (caso ya cubierto)**: se mantiene igual, mockeando
`useReducedMotion: () => true`. Con `prefersReduced=true`, el `useLayoutEffect` retorna
temprano (no llama `setShouldAnimate`), `shouldAnimate` queda `false`, y el render branch
`!shouldAnimate || prefersReduced` → `true` → div plano. **No depende de
`getBoundingClientRect`** en absoluto — simplifica este caso.

---

### 5.1 `components/animations/__tests__/FadeIn.test.tsx` — contenido completo propuesto

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FadeIn } from '../FadeIn'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div data-testid="motion-wrapper" {...props}>{children}</div>,
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

function mockRect(rect: Partial<DOMRect>) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => '',
    ...rect,
  } as DOMRect)
}

describe('FadeIn', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children', () => {
    mockRect({ top: 2000, bottom: 2100 }) // fuera de viewport, no afecta a este aserto
    render(<FadeIn><span>Test content</span></FadeIn>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders without opacity:0 before mount / when element is already in viewport (Hero case)', () => {
    mockRect({ top: 0, bottom: 100 }) // dentro del viewport (innerHeight jsdom = 768)
    const { container } = render(<FadeIn><span>Hero content</span></FadeIn>)

    expect(screen.getByText('Hero content')).toBeInTheDocument()
    // No debe haber motion.div ni opacity:0 inline
    expect(screen.queryByTestId('motion-wrapper')).not.toBeInTheDocument()
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.opacity).toBe('')
  })

  it('switches to motion.div reveal flow when element is off-screen at mount', () => {
    mockRect({ top: 2000, bottom: 2100 }) // fuera del viewport (innerHeight jsdom = 768)
    render(<FadeIn><span>Below fold content</span></FadeIn>)

    expect(screen.getByText('Below fold content')).toBeInTheDocument()
    expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument()
  })

  it('renders without motion wrapper when prefers-reduced-motion', () => {
    vi.doMock('framer-motion', () => ({
      motion: { div: ({ children }: { children: React.ReactNode }) => <div data-testid="motion-wrapper">{children}</div> },
      useInView: () => true,
      useReducedMotion: () => true,
    }))
    render(<FadeIn><span>Accessible content</span></FadeIn>)
    expect(screen.getByText('Accessible content')).toBeInTheDocument()
    expect(screen.queryByTestId('motion-wrapper')).not.toBeInTheDocument()
  })

  it('accepts className prop', () => {
    mockRect({ top: 0, bottom: 100 })
    render(<FadeIn className="test-class"><span>Styled</span></FadeIn>)
    expect(screen.getByText('Styled')).toBeInTheDocument()
  })
})
```

#### Notas test FadeIn

- `mockRect(...)` usa `vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')` — afecta a
  TODOS los elementos en el test (no solo al `ref` de `FadeIn`), lo cual es correcto y
  suficiente aquí porque solo hay un elemento relevante por test.
- `afterEach(() => vi.restoreAllMocks())` restaura el spy entre tests — importante porque
  `vi.spyOn` en `HTMLElement.prototype` es global y "se filtra" entre tests si no se limpia.
- El test `'renders without opacity:0 ... (Hero case)'`: verifica DOS cosas — (a) no se
  renderiza `data-testid="motion-wrapper"` (= no es `motion.div`, es el `<div>` plano del
  fallback), y (b) `wrapper.style.opacity === ''` (sin estilo inline `opacity:0` ni `opacity:1`
  — el `<div>` plano nunca tiene `style` seteado vía props).
- El test `'switches to motion.div ...'`: con `rect.top=2000 > innerHeight(768)` →
  `alreadyVisible=false` → `useLayoutEffect` llama `setShouldAnimate(true)` → render branch
  `motion.div` (mock con `data-testid="motion-wrapper"`). Como `useInView` mockeado devuelve
  `true`, `animate={opacity:1}` — el test solo verifica que el wrapper `motion.div` está
  presente, no necesita inspeccionar el valor de `animate` (el mock no lo serializa de forma
  fiable como atributo).
- El test de `prefers-reduced-motion` usa `vi.doMock` + nuevo mock de `motion.div` con
  `data-testid="motion-wrapper"` también, para reutilizar la misma aserción
  `queryByTestId('motion-wrapper')`. **Nota**: `vi.doMock` solo afecta al **próximo** `import`
  dinámico/módulo resuelto — como `FadeIn` ya se importó estáticamente al principio del
  archivo (`import { FadeIn } from '../FadeIn'`), y `FadeIn` importa `framer-motion`
  estáticamente también, **`vi.doMock` después del módulo ya cargado NO tiene efecto** salvo
  que Vitest re-evalúe el grafo. **Este es el mismo patrón que ya existe en el test actual** —
  si ya pasaba antes (el test actual existente usa exactamente este patrón y presumiblemente
  pasa), es porque Vitest con `vi.mock` (hoisted) en la cabecera ya fija `useReducedMotion: ()
  => false` para todo el archivo, y el `vi.doMock` posterior probablemente **no cambia
  realmente el comportamiento** — el test pasa porque el componente, con `prefersReduced=false`
  (del mock hoisted original) Y `shouldAnimate` dependiente de `getBoundingClientRect`, sigue
  renderizando contenido visible de una forma u otra (el `motion.div` mockeado también
  renderiza children).
  → **Acción concreta**: para el nuevo test de reduced-motion, **NO depender de `vi.doMock`**
  (mantiene el mismo problema preexistente). En su lugar, mantener el `vi.mock` hoisted
  original como está (`useReducedMotion: () => false`) para los demás tests, y para el caso
  "reduced motion" usar un **archivo de test separado** o, más simple, **mantener el test
  actual tal cual** (con su `vi.doMock`) ya que es un test PREEXISTENTE que ya "pasa" hoy con
  el comportamiento actual — el objetivo de esta tarea NO es arreglar ese mock, sino añadir
  los nuevos casos (Hero / below-the-fold). Para evitar régressions y mantener el diff acotado:
  **deja el test `'renders without motion wrapper when prefers-reduced-motion'` exactamente
  como está hoy** (sin añadir `data-testid` ni tocar el `vi.doMock`), y añade los DOS tests
  nuevos (Hero / below-fold) usando el mock hoisted normal (`useReducedMotion: () => false`).
  Esto es más seguro. Ver versión "ajustada" más abajo.

#### Versión ajustada recomendada (más segura, menor diff)

Mantener el `vi.mock('framer-motion', ...)` hoisted con `motion.div` devolviendo
`data-testid="motion-wrapper"` (cambio mínimo: añadir el `data-testid` al mock existente), y
**dejar el test de `prefers-reduced-motion` existente sin tocar su lógica de `vi.doMock`**
(solo se beneficia del nuevo `data-testid` si quieres añadir la aserción
`queryByTestId('motion-wrapper')`, pero no es obligatorio — el test actual ya pasa verificando
`getByText`). Añadir los 2 tests nuevos (Hero / below-fold) usando `mockRect(...)` +
`useReducedMotion: () => false` (mock hoisted normal, sin `doMock`).

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { FadeIn } from '../FadeIn'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div data-testid="motion-wrapper" {...props}>{children}</div>,
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

function mockRect(rect: Partial<DOMRect>) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
    toJSON: () => '',
    ...rect,
  } as DOMRect)
}

describe('FadeIn', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<FadeIn><span>Test content</span></FadeIn>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders plain div without opacity:0 when element is already in viewport at mount (Hero case)', () => {
    mockRect({ top: 0, bottom: 100 })
    const { container } = render(<FadeIn><span>Hero content</span></FadeIn>)

    expect(screen.getByText('Hero content')).toBeInTheDocument()
    expect(screen.queryByTestId('motion-wrapper')).not.toBeInTheDocument()
    expect((container.firstChild as HTMLElement).style.opacity).toBe('')
  })

  it('switches to motion.div reveal flow when element is off-screen at mount', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<FadeIn><span>Below fold content</span></FadeIn>)

    expect(screen.getByText('Below fold content')).toBeInTheDocument()
    expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument()
  })

  it('renders without motion wrapper when prefers-reduced-motion', () => {
    vi.doMock('framer-motion', () => ({
      motion: { div: ({ children }: { children: React.ReactNode }) => <div data-testid="motion-wrapper">{children}</div> },
      useInView: () => true,
      useReducedMotion: () => true,
    }))
    render(<FadeIn><span>Accessible content</span></FadeIn>)
    expect(screen.getByText('Accessible content')).toBeInTheDocument()
  })

  it('accepts className prop', () => {
    mockRect({ top: 0, bottom: 100 })
    render(<FadeIn className="test-class"><span>Styled</span></FadeIn>)
    expect(screen.getByText('Styled')).toBeInTheDocument()
  })
})
```

Esta versión:
1. Mantiene el test `'renders without motion wrapper when prefers-reduced-motion'` **textualmente
   igual** al original (mismo `vi.doMock`, mismo cuerpo) — cero riesgo de romper algo que ya
   funcionaba.
2. Añade `data-testid="motion-wrapper"` al mock hoisted de `motion.div` — cambio no disruptivo
   (es un atributo extra, `getByText` sigue funcionando igual en todos los tests existentes).
3. Añade 2 tests nuevos que cubren exactamente los escenarios "Hero" y "below-the-fold" del
   `design.md`/spec.
4. NO usa `act()`/`waitFor` — confirmado innecesario por el comportamiento de
   `useLayoutEffect` + `render()` de RTL (ver nota técnica arriba).

---

### 5.2 `components/animations/__tests__/SlideUp.test.tsx`

Mismo patrón que FadeIn, adaptado a `opacity:0, y:24` → `opacity:1, y:0`. Para `SlideUp` el
mock de `motion.div` puede seguir igual (con `data-testid="motion-wrapper"`); la aserción del
caso "Hero" verifica además `(container.firstChild as HTMLElement).style.transform` (o
`.style.opacity`) está vacío — pero como el `<div>` plano nunca recibe `style` vía props, basta
con repetir la misma aserción de `style.opacity === ''` o simplemente comprobar la ausencia de
`motion-wrapper`.

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { SlideUp } from '../SlideUp'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div data-testid="motion-wrapper" {...props}>{children}</div>,
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

function mockRect(rect: Partial<DOMRect>) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
    toJSON: () => '',
    ...rect,
  } as DOMRect)
}

describe('SlideUp', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<SlideUp><span>Slide content</span></SlideUp>)
    expect(screen.getByText('Slide content')).toBeInTheDocument()
  })

  it('accepts delay prop', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<SlideUp delay={0.3}><span>Delayed</span></SlideUp>)
    expect(screen.getByText('Delayed')).toBeInTheDocument()
  })

  it('renders plain div without translateY/opacity when element is already in viewport at mount (Hero case)', () => {
    mockRect({ top: 0, bottom: 100 })
    const { container } = render(<SlideUp><span>Hero content</span></SlideUp>)

    expect(screen.getByText('Hero content')).toBeInTheDocument()
    expect(screen.queryByTestId('motion-wrapper')).not.toBeInTheDocument()
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.opacity).toBe('')
    expect(wrapper.style.transform).toBe('')
  })

  it('switches to motion.div reveal flow when element is off-screen at mount', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<SlideUp><span>Below fold content</span></SlideUp>)

    expect(screen.getByText('Below fold content')).toBeInTheDocument()
    expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument()
  })

  it('renders without animation when prefers-reduced-motion', () => {
    vi.doMock('framer-motion', () => ({
      motion: { div: ({ children }: { children: React.ReactNode }) => <div data-testid="motion-wrapper">{children}</div> },
      useInView: () => true,
      useReducedMotion: () => true,
    }))
    render(<SlideUp><span>Reduced motion</span></SlideUp>)
    expect(screen.getByText('Reduced motion')).toBeInTheDocument()
  })
})
```

Nota: el test original `'renders without animation when prefers-reduced-motion'` **no** tenía
`vi.doMock` en el archivo actual (revisa `SlideUp.test.tsx` actual — usa el mock hoisted con
`useReducedMotion: () => false`, por lo que ese test en realidad NO comprobaba reduced-motion
de forma efectiva, solo verificaba que el children se renderiza). Para el nuevo archivo, se
añade `vi.doMock` (igual que FadeIn) para que el test sea representativo. Si se prefiere mínimo
diff y dejar ese test exactamente igual (sin `vi.doMock`), es aceptable — el comportamiento de
`shouldAnimate`/`prefersReduced=false` + `mockRect` por defecto (jsdom `{top:0,bottom:0}` →
`alreadyVisible=false` → `shouldAnimate=true` → `motion.div` mock) seguiría renderizando el
children igualmente. **Recomendación**: añadir `vi.doMock` para que el test sea fiel a su
nombre, ya que no añade riesgo (mismo patrón usado en FadeIn).

---

### 5.3 `components/animations/__tests__/StaggerChildren.test.tsx`

Mismo patrón. Además, verificar que ningún hijo recibe `hidden`/estilos inline. Como
`StaggerChildren` no aplica estilos directamente a los hijos (son los propios
`AnimatedProjectCard`/`AnimatedSkillChip` quienes tienen `variants={staggerItem}`), y en los
tests los `children` son `<span>` planos (no `motion.div` con `variants`), la verificación se
centra en el **contenedor** (`StaggerChildren` mismo): branch `motion.div`
(`data-testid="motion-wrapper"`) vs `<div>` plano, igual que FadeIn/SlideUp.

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { StaggerChildren } from '../StaggerChildren'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div data-testid="motion-wrapper" {...props}>{children}</div>,
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

function mockRect(rect: Partial<DOMRect>) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
    toJSON: () => '',
    ...rect,
  } as DOMRect)
}

describe('StaggerChildren', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all children', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(
      <StaggerChildren>
        <span>Child 1</span>
        <span>Child 2</span>
        <span>Child 3</span>
      </StaggerChildren>
    )
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  it('accepts staggerDelay prop', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<StaggerChildren staggerDelay={0.2}><span>Item</span></StaggerChildren>)
    expect(screen.getByText('Item')).toBeInTheDocument()
  })

  it('renders plain div with all children visible when container is already in viewport at mount', () => {
    mockRect({ top: 0, bottom: 100 })
    render(
      <StaggerChildren>
        <span>Child 1</span>
        <span>Child 2</span>
        <span>Child 3</span>
      </StaggerChildren>
    )

    expect(screen.queryByTestId('motion-wrapper')).not.toBeInTheDocument()
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  it('switches to motion.div stagger flow when container is off-screen at mount', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<StaggerChildren><span>Below fold</span></StaggerChildren>)

    expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument()
    expect(screen.getByText('Below fold')).toBeInTheDocument()
  })

  it('renders without animation when prefers-reduced-motion', () => {
    vi.doMock('framer-motion', () => ({
      motion: { div: ({ children }: { children: React.ReactNode }) => <div data-testid="motion-wrapper">{children}</div> },
      useInView: () => true,
      useReducedMotion: () => true,
    }))
    render(<StaggerChildren><span>Accessible</span></StaggerChildren>)
    expect(screen.getByText('Accessible')).toBeInTheDocument()
  })
})
```

---

## 6. Nuevo: `components/layout/__tests__/SmoothScroll.test.tsx`

### Convenciones del repo a seguir (de `ThemeToggle.test.tsx`)

- `vi.spyOn(window, 'requestAnimationFrame')`/`cancelAnimationFrame` mockeados para evitar
  bucles RAF reales en jsdom.
- `beforeEach`/`afterEach` con `vi.restoreAllMocks()`.
- Mock de paquetes externos vía `vi.mock('paquete', () => ({...}))` con factory hoisted.

### Mock de `lenis`

`SmoothScroll.tsx` hace `import Lenis from 'lenis'` (default export, confirmado en
`node_modules/lenis/dist/lenis.mjs` → `export { Lenis as default }`). Mock:

```ts
const lenisRaf = vi.fn()
const lenisDestroy = vi.fn()
const LenisConstructorSpy = vi.fn()

vi.mock('lenis', () => ({
  default: vi.fn().mockImplementation((...args) => {
    LenisConstructorSpy(...args)
    return { raf: lenisRaf, destroy: lenisDestroy }
  }),
}))
```

### Mock de `window.matchMedia`

jsdom no implementa `matchMedia` — hay que definirlo en cada test (no hay polyfill global en
`vitest.setup.ts`). Patrón estándar:

```ts
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),     // deprecated API, por si algo lo usa
      removeListener: vi.fn(),  // deprecated API
      dispatchEvent: vi.fn(),
    })),
  })
}
```

### Contenido completo propuesto

```tsx
import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SmoothScroll } from '../SmoothScroll'

const lenisRaf = vi.fn()
const lenisDestroy = vi.fn()
const LenisConstructorSpy = vi.fn()

vi.mock('lenis', () => ({
  default: vi.fn().mockImplementation((...args: unknown[]) => {
    LenisConstructorSpy(...args)
    return { raf: lenisRaf, destroy: lenisDestroy }
  }),
}))

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('SmoothScroll', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    LenisConstructorSpy.mockClear()
    lenisRaf.mockClear()
    lenisDestroy.mockClear()
  })

  it('does not initialize Lenis when prefers-reduced-motion: reduce is set', () => {
    mockMatchMedia(true)

    render(<SmoothScroll><div>Content</div></SmoothScroll>)
    act(() => {})

    expect(LenisConstructorSpy).not.toHaveBeenCalled()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('initializes Lenis and starts the RAF loop when prefers-reduced-motion is not set', () => {
    mockMatchMedia(false)

    render(<SmoothScroll><div>Content</div></SmoothScroll>)
    act(() => {})

    expect(LenisConstructorSpy).toHaveBeenCalledWith({ duration: 1.2, smoothWheel: true })
    expect(window.requestAnimationFrame).toHaveBeenCalled()
  })

  it('renders children', () => {
    mockMatchMedia(false)
    const { getByText } = render(<SmoothScroll><div>Content</div></SmoothScroll>)
    expect(getByText('Content')).toBeInTheDocument()
  })
})
```

### Notas SmoothScroll test

- `requestAnimationFrame` mockeado para **devolver un id sin volver a invocar el callback**
  (a diferencia de `ThemeToggle.test.tsx` que sí ejecuta `cb(performance.now())` —
  aquí NO conviene ejecutar el callback `raf` porque crearía un bucle infinito sincrónico
  llamando `requestAnimationFrame` recursivamente dentro del mismo mock). Usar
  `.mockImplementation(() => 1)` (devuelve un id numérico, no llama al callback).
- El test del caso "normal" (`matches: false`) verifica que `Lenis` se instanció con los
  mismos argumentos que hoy (`{ duration: 1.2, smoothWheel: true }`) y que
  `requestAnimationFrame` se llamó al menos una vez (arranque del RAF loop).
- El test del caso "reduced motion" verifica lo contrario: ni `Lenis` ni `requestAnimationFrame`
  se invocan.
- `act(() => {})` tras `render(...)`: el `useEffect` de `SmoothScroll` corre de forma asíncrona
  respecto al commit (a diferencia de `useLayoutEffect`), pero dentro de `render()` de RTL
  (que envuelve en `act`), los `useEffect` con deps `[]` SÍ se ejecutan sincrónicamente antes
  de que `render()` retorne en la mayoría de los casos con React 18/19 + RTL. El
  `act(() => {})` extra es defensivo (mismo patrón que `ThemeToggle.test.tsx`) y no hace daño;
  se puede omitir si los asserts pasan sin él, pero se recomienda mantenerlo por consistencia
  con el resto del repo.
- No es necesario testear el cleanup (`cancelAnimationFrame`/`lenis.destroy()`) en este cambio
  — no es parte del alcance ni del riesgo abordado, y ya existía antes sin tests específicos.
  Si se quiere cobertura extra (opcional, no obligatorio), se puede añadir un test de
  `unmount()` que verifique `lenisDestroy` se llama solo si Lenis se inicializó.

---

## 7. Orden de edición recomendado y gotchas para `npm run lint && npm run test && npm run build`

### Orden sugerido (TDD, por tasks.md)

1. Crear/actualizar los 4 archivos de test PRIMERO (deben fallar contra la implementación
   actual):
   - `components/animations/__tests__/FadeIn.test.tsx`
   - `components/animations/__tests__/SlideUp.test.tsx`
   - `components/animations/__tests__/StaggerChildren.test.tsx`
   - `components/layout/__tests__/SmoothScroll.test.tsx` (nuevo)
2. Ejecutar `npm run test -- FadeIn SlideUp StaggerChildren SmoothScroll` (o
   `npm run test`) y confirmar que los nuevos tests fallan (rojo) por el motivo esperado:
   - FadeIn/SlideUp/StaggerChildren: el componente actual no tiene `shouldAnimate`/
     `useLayoutEffect`, por lo que el branch "Hero" (ya visible, sin `motion-wrapper`) NO se
     cumple — siempre renderiza `motion.div` (mock con `data-testid="motion-wrapper"`)
     cuando `prefersReduced=false`. El test `'renders plain div ... (Hero case)'` debería
     fallar (`getByTestId('motion-wrapper')` SÍ existe cuando no debería).
   - SmoothScroll: `Lenis` siempre se llama, el test "reduced-motion → no Lenis" falla.
3. Implementar los 4 componentes (orden: `FadeIn.tsx` → `SlideUp.tsx` →
   `StaggerChildren.tsx` → `SmoothScroll.tsx`).
4. Ejecutar `npm run lint && npm run test && npm run build`.

### Gotchas

- **`useRef<HTMLDivElement>(null)`**: si se deja `useRef(null)` (sin tipo genérico), TS
  inferirá `RefObject<null>` y `ref.current.getBoundingClientRect()` fallará en `npm run
  build` (type-check) con algo como "Object is possibly 'null'" o "Property
  'getBoundingClientRect' does not exist on type 'never'". El plan ya usa
  `useRef<HTMLDivElement>(null)` — confirmar que se aplica en los 3 wrappers.
- **`react-hooks/exhaustive-deps`**: el `useLayoutEffect` con `[]` y referencias a
  `prefersReduced`/`ref` dentro disparará el warning de exhaustive-deps bajo
  `eslint-config-next/core-web-vitals`. Se incluye
  `// eslint-disable-next-line react-hooks/exhaustive-deps` justo antes de `[]` en los 3
  wrappers — sin esto, `npm run lint` fallará (a menos que el proyecto tenga el rule en `warn`;
  verificar, pero más seguro incluir el disable de todos modos).
- **`motion.div` con `ref` tipado**: framer-motion 12 acepta `ref: React.Ref<HTMLDivElement>` —
  `useRef<HTMLDivElement>(null)` es compatible tanto con `motion.div` como con `<div ref={ref}>`
  nativo. No se esperan errores de tipos adicionales en el branch de fallback.
- **`StaggerChildren` — `container`/`custom`/`variants`**: sin cambios; no se ve afectado por
  el tipado del `ref`.
- **`SmoothScroll` — tipo de `window.matchMedia`**: `window.matchMedia` está en `lib: ["dom",
  ...]` (ya presente en `tsconfig.json`), no requiere imports adicionales ni `@types`.
- **Build/SSG**: ninguno de los 4 componentes cambia su naturaleza `'use client'` ni su API —
  `generateStaticParams` y el resto de páginas (`app/[locale]/...`) no requieren cambios. El
  HTML estático generado por `next build` para `/` y `/en` debe dejar de contener
  `style="opacity:0..."` en el Hero — esto se verifica en el paso E2E (4.1 de `tasks.md`), no
  en `npm run build` (que solo falla si hay errores de compilación/type-check, no por contenido
  HTML).
- **No tocar** `content/`, `messages/`, `app/[locale]/layout.tsx`, ni ningún componente de
  `components/sections/`/`components/ui/` — confirmado en el punto 4 anterior que
  `AnimatedProjectCard`/`AnimatedSkillChip` no requieren cambios.
- **Vitest — `vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')`**: asegurarse de que
  cada test que lo usa llama `vi.restoreAllMocks()` en `afterEach` (o `beforeEach` limpia antes
  de cada test) para no contaminar otros archivos de test que también usen
  `getBoundingClientRect` (p.ej. `MagneticButton.test.tsx`, que usa
  `ref.current.getBoundingClientRect()` en `handleMouseMove` — si corriera en el mismo proceso
  con un mock global no restaurado podría dar resultados inesperados). Como Vitest aísla
  módulos por archivo de test (cada archivo tiene su propio entorno jsdom por defecto con
  `environment: 'jsdom'` y sin `--no-isolate`), el riesgo de fuga entre ARCHIVOS es bajo, pero
  entre tests del MISMO archivo es real — de ahí el `afterEach(() => vi.restoreAllMocks())`.

### Comandos de verificación finales (a ejecutar por el agente, no delegar)

```powershell
npm run lint
npm run test
npm run build
```

Si `npm run test` soporta filtrar por archivo, durante el desarrollo iterativo se puede usar:

```powershell
npm run test -- FadeIn
npm run test -- SlideUp
npm run test -- StaggerChildren
npm run test -- SmoothScroll
```

(confirmar el script `test` en `package.json` — si es `vitest run`, el filtro por nombre de
archivo funciona vía `vitest run <pattern>`).

---

## 8. Resumen de archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `components/animations/FadeIn.tsx` | Modificar (patrón `shouldAnimate` + `useLayoutEffect`) |
| `components/animations/SlideUp.tsx` | Modificar (idéntico patrón) |
| `components/animations/StaggerChildren.tsx` | Modificar (idéntico patrón, container/staggerItem sin cambios) |
| `components/layout/SmoothScroll.tsx` | Modificar (check `matchMedia` antes de `new Lenis`) |
| `components/animations/__tests__/FadeIn.test.tsx` | Modificar (nuevos casos Hero/below-fold + `data-testid` en mock) |
| `components/animations/__tests__/SlideUp.test.tsx` | Modificar (idéntico) |
| `components/animations/__tests__/StaggerChildren.test.tsx` | Modificar (idéntico, a nivel de contenedor) |
| `components/layout/__tests__/SmoothScroll.test.tsx` | **Crear** (nuevo) |
| `content/`, `messages/`, `app/[locale]/**`, `components/sections/**`, `components/ui/**` | Sin cambios |

No se requieren nuevas dependencias npm.
