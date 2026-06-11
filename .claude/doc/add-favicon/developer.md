# Plan técnico — `add-favicon`

> Lee primero (ya hecho en esta sesión, pero el implementador debe releer):
> - `openspec/changes/add-favicon/proposal.md`
> - `openspec/changes/add-favicon/design.md`
> - `openspec/changes/add-favicon/specs/site-favicon/spec.md`
> - `openspec/changes/add-favicon/tasks.md`
> - `app/layout.tsx`, `app/globals.css`
> - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md` (ya leído, resumen abajo)
> - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md` (ya leído, resumen abajo — **crítico para el punto 3**)

---

## 0. Resumen de hallazgos clave de Next.js 16 (NO asumir conocimiento previo)

Fuente: `node_modules/next/dist/docs/.../app-icons.md` (Next 16.2.7, instalado en este repo).

| Convención | Tipos soportados | Ubicación válida | `<head>` generado |
|---|---|---|---|
| `favicon` | **solo `.ico`** | **únicamente** en el **root** `app/` (no en `app/[locale]/`) | `<link rel="icon" href="/favicon.ico" sizes="any" />` |
| `icon` | `.ico`, `.jpg`, `.jpeg`, `.png`, `.svg` | `app/**/*` (pero para favicon global, va en `app/`) | `<link rel="icon" href="/icon.svg?<hash>" type="image/svg+xml" sizes="any">` (para SVG, `sizes="any"`) |
| `apple-icon` | `.jpg`, `.jpeg`, `.png` (NO svg) | `app/**/*` | `<link rel="apple-touch-icon" href="/apple-icon.png?<hash>" type="image/png" sizes="180x180">` |

Notas importantes:
- Solo se necesitan los **ficheros estáticos** `app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`. Next genera los `<link>` automáticamente, **sin** tocar `metadata.icons`. Esto coincide con D2 del design — **NO añadir `metadata.icons`**.
- `favicon.ico` SOLO puede ir en el `app/` raíz (no en `app/[locale]/`). El proyecto ya tiene `app/favicon.ico` (placeholder de Next) — se **sustituye in-place**.
- `icon.svg` y `apple-icon.png` también deben ir en `app/` raíz (mismo nivel que `favicon.ico`), porque el favicon es un recurso global del sitio, no específico de `[locale]`. Esto es coherente con el Impact del proposal ("Layout: app/layout.tsx").
- El nombre exacto del fichero apple es **`apple-icon.png`** (no `apple-touch-icon.png`) — confirmado en la tabla de la doc. Resuelve la Open Question del design.

### `theme-color` — CRÍTICO: API distinta a `metadata.icons`

Fuente: `node_modules/next/dist/docs/.../generate-viewport.md` + `generate-metadata.md` línea 654:

> **Deprecated**: The `themeColor` option in `metadata` is deprecated as of Next.js 14. Please use the `viewport` configuration (`generateViewport`) instead.

Por tanto, **NO** se debe añadir `themeColor: '#131314'` dentro de `export const metadata: Metadata = {...}` (eso generaría warning/sería ignorado en Next 16). Si se implementa D4 (opcional), debe ser un **export `viewport` separado** tipado como `Viewport`:

```ts
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = { /* ... existing ... */ }

export const viewport: Viewport = {
  themeColor: '#131314',
}
```

`viewport` y `generateViewport` solo pueden exportarse desde Server Components (`app/layout.tsx` ya lo es — no tiene `'use client'`). No se puede exportar `viewport` Y `generateViewport` desde el mismo segmento — aquí solo se añade `viewport` (objeto estático), no hay `generateViewport`.

Esto se añade en **`app/layout.tsx`** (root layout), igual que `metadata` ya vive ahí. **No** tocar `app/[locale]/layout.tsx` (no exporta metadata actualmente).

---

## 1. Generación de `app/icon.svg` — monograma `ma` como paths vectoriales

### 1.1 Especificación visual (de design.md + spec.md)

- **viewBox**: `0 0 64 64` (cuadrado, mismo sistema de coordenadas que usa el preview validado en `.claude/doc/favicon-preview/preview.html`, concepto B).
- **Fondo**: `<rect width="64" height="64" fill="#1c1b1c"/>` — esquinas rectas, sin `rx`. Token `--color-surface` (dark, de `app/globals.css` línea 25).
- **Glifo**: `ma` en minúsculas, Space Grotesk weight 700, color `#00dce5` (token `--color-accent` dark, `app/globals.css` línea 30).
- **Tamaño/posición del glifo dentro del viewBox 64×64**: en el preview de concepto B (`svgMAg`), el `<text>` usaba `font-size="34"`, `text-anchor="middle"`, `dominant-baseline="central"`, `letter-spacing="-2"`, posicionado en `x=32 y=34`. Al convertir a paths, el glifo resultante debe ocupar aproximadamente esa caja óptica: ancho del conjunto `ma` ≈ 40-46px de los 64px totales, centrado horizontal y verticalmente con un ligero offset hacia abajo del baseline (los descendientes/ascendentes de Space Grotesk son simétricos, pero el centrado óptico del preview usa `dominant-baseline="central"` que NO es lo mismo que centrar el bounding box del glifo — ver verificación 1.5).
- Sin `rx`/`ry` en el `<rect>` — esquinas rectas (Technical Brutalist).
- Sin `<text>`, sin `font-family` — solo `<path>` (D1 del design, y Requirement "Render nítido e independiente de la fuente").

### 1.2 Método reproducible para extraer los paths del glifo `ma` (Space Grotesk 700)

**Pre-requisito**: el implementador debe tener acceso de red normal (este sandbox de planificación NO tiene acceso a internet — `fetch`/`npm view` fallan con `UNABLE_TO_VERIFY_LEAF_SIGNATURE` / `fetch failed`. Verificar conectividad antes de empezar: `node -e "fetch('https://fonts.google.com').then(r=>console.log(r.status))"`. Si falla en el entorno real, usar el **Método B (fallback sin red)** de 1.2.3).

#### Método A (preferido) — `opentype.js` vía `npx` puntual, sin tocar `package.json`

1. **Descargar el TTF de Space Grotesk 700** (fuente OFL, descarga directa, no requiere `npm`):
   ```powershell
   New-Item -ItemType Directory -Force -Path .\.tmp-favicon | Out-Null
   Invoke-WebRequest -Uri "https://github.com/floriankarsten/space-grotesk/raw/master/fonts/ttf/SpaceGrotesk-Bold.ttf" -OutFile ".\.tmp-favicon\SpaceGrotesk-Bold.ttf"
   ```
   - Alternativa si el repo de GitHub cambia de ruta: descargar manualmente desde [Google Fonts — Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (botón "Download family"), descomprimir y copiar `static/SpaceGrotesk-Bold.ttf` a `.tmp-favicon\`.
   - Verificar que el fichero pesa > 0 bytes y es un TTF válido (`Get-Item .\.tmp-favicon\SpaceGrotesk-Bold.ttf | Select Length`).

2. **Ejecutar `opentype.js` vía `npx` puntual** (no añade nada a `package.json` porque `npx` instala en una caché temporal de npm, no en `node_modules` del proyecto — confirmar con `npx --yes` para evitar prompt interactivo):
   ```powershell
   npx --yes opentype.js@1.3.4 --version
   ```
   Si esto falla por el mismo error de certificado visto en el sandbox de planificación (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`), **NO** usar `npm config set strict-ssl false` (riesgo de seguridad, no autorizado). En su lugar:
   - Probar `npm install --no-save opentype.js@1.3.4` (instala en `node_modules/` local SIN escribir en `package.json` gracias a `--no-save`; sigue sin tocar `package.json`/`package-lock.json` de forma persistente — **eliminar `node_modules/opentype.js` al terminar**, paso 1.4).
   - Si el problema de certificados persiste en la máquina del implementador (puede ser un proxy corporativo), usar `node --use-system-ca` como sugiere el propio mensaje de error de npm.

3. **Script de extracción** — crear `.tmp-favicon\extract-glyphs.mjs` (fichero temporal, fuera de `app/`, `components/`, `content/` — NO debe quedar en el repo final, ver paso 1.4):

   ```js
   // .tmp-favicon/extract-glyphs.mjs
   import opentype from 'opentype.js' // o ruta a node_modules/opentype.js/dist/opentype.module.js si --no-save
   import fs from 'node:fs'

   const font = opentype.loadSync('./.tmp-favicon/SpaceGrotesk-Bold.ttf')

   // Tamaño de fuente en unidades del viewBox 64x64.
   // Probar primero con 34 (igual que el preview), ajustar tras verificación visual.
   const fontSize = 34
   const text = 'ma'

   const path = font.getPath(text, 0, 0, fontSize)
   const bbox = path.getBoundingBox()

   const glyphWidth = bbox.x2 - bbox.x1
   const glyphHeight = bbox.y2 - bbox.y1

   // Centrar el bounding box del glifo en el viewBox 64x64
   const VIEWBOX = 64
   const dx = (VIEWBOX - glyphWidth) / 2 - bbox.x1
   const dy = (VIEWBOX - glyphHeight) / 2 - bbox.y1

   // Re-generar el path ya trasladado
   const centeredPath = font.getPath(text, dx, dy + glyphHeight, fontSize)
   // Nota: opentype.js dibuja desde la baseline hacia arriba (eje Y invertido
   // respecto a SVG); ajustar el signo de `y` según resultado — verificar con
   // el bbox impreso abajo y corregir `dy` si el glifo aparece invertido o
   // desplazado. Iterar visualmente (paso 1.5) hasta que coincida con el preview.

   const d = centeredPath.toPathData(2) // 2 = decimales de precisión

   console.log('bbox original:', bbox)
   console.log('glyphWidth/Height:', glyphWidth, glyphHeight)
   console.log('path d=', d)

   fs.writeFileSync('./.tmp-favicon/ma-path.txt', d)
   ```

   Ejecutar:
   ```powershell
   node .\.tmp-favicon\extract-glyphs.mjs
   ```

4. **Construir `app/icon.svg`** combinando el `d` extraído con el fondo:

   ```xml
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
     <rect width="64" height="64" fill="#1c1b1c"/>
     <path d="<<<PATH_D_AQUI>>>" fill="#00dce5"/>
   </svg>
   ```

   - **kerning del `ma`**: Space Grotesk 700 tiene un kerning par "ma" relativamente neutro (sin par de kerning especial conocido), por lo que `font.getPath('ma', ...)` con el tracking por defecto debería ser fiel. El preview usaba `letter-spacing="-2"` sobre `font-size="34"` para un viewBox 64 — si el ancho del glifo extraído (`glyphWidth`) resulta visualmente más ancho/separado que el preview, aplicar un tracking negativo manual: generar cada letra por separado (`font.getPath('m', 0, y, fontSize)` y `font.getPath('a', advanceWidth_m - 2, y, fontSize)`) y concatenar los `d` en un único `<path>` (un `<path>` puede tener múltiples subpaths).

#### Método B (fallback sin red / sin `npx` funcional) — herramienta online + trazado manual

Si `npx`/`npm install` fallan por completo en el entorno del implementador:

1. Abrir https://fonts.google.com/specimen/Space+Grotesk en el navegador, descargar la familia.
2. Usar una herramienta web de "texto a path SVG" que acepte upload de fuente custom, p. ej. https://danmarshall.github.io/google-font-to-svg-path/ (sube `SpaceGrotesk-Bold.ttf`, escribe `ma`, ajusta tamaño de fuente hasta que el bounding box quepa en ~44×30 dentro de un lienzo 64×64, copia el `d` resultante).
3. Pegar el `d` en `app/icon.svg` con la misma plantilla del paso 1.2.A.4.
4. Documentar en el PR qué herramienta se usó (para reproducibilidad futura), ya que no es un comando local.

### 1.3 `app/icon.svg` final — plantilla

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#1c1b1c"/>
  <path d="..." fill="#00dce5"/>
</svg>
```

Reglas:
- Sin `<text>`, sin `font-family`, sin `style` con fuentes externas.
- Sin `width`/`height` fijos en el `<svg>` (dejar que `viewBox` escale) — Next.js detecta `sizes="any"` para SVG automáticamente.
- `fill="#1c1b1c"` y `fill="#00dce5"` como **valores hex literales** (no usar `var(--color-surface)` — los favicons SVG no garantizan que se evalúen custom properties CSS de la página anfitriona; usar siempre valores resueltos).
- Mantener el SVG minimal (sin metadata de Inkscape/Illustrator, sin `<defs>` innecesarios) — limpiar con un editor de texto tras exportar si la herramienta añade bloat.

### 1.4 Limpieza de artefactos temporales

- Eliminar `.tmp-favicon/` completo al finalizar (incluye el TTF descargado, el script `.mjs`, y `node_modules/opentype.js` si se instaló con `--no-save`).
- Verificar `git status` no muestra `.tmp-favicon/`, `node_modules/opentype.js`, ni cambios en `package.json`/`package-lock.json`.
- Si se usó `npm install --no-save`, ejecutar `npm install` al final (sin argumentos) para asegurar que `node_modules` vuelve a coincidir exactamente con `package-lock.json` (opcional pero recomendable — verificar que no quedan paquetes huérfanos que afecten `npm run build`).

### 1.5 Verificación visual contra el preview validado

1. Abrir `.claude/doc/favicon-preview/preview.html` en un navegador (doble clic o `Start-Process`). Esto renderiza el **Concepto B** (`svgMAg`, líneas 108-114) con `<text>` Space Grotesk a 16/32/48/64/128px y en pestañas simuladas claras/oscuras.
2. Crear un fichero temporal `.tmp-favicon\compare.html` que renderice el **`app/icon.svg` recién generado** (con los paths) en los mismos tamaños (16/32/48/64/128) y en las mismas pestañas simuladas dark/light, para comparación lado a lado con el paso 1.
3. Comparar:
   - **Forma de las letras** `m` y `a` — deben coincidir con Space Grotesk 700 (terminaciones rectas características de Space Grotesk, `a` de doble piso).
   - **Kerning**: el espacio entre `m` y `a` no debe ser ni excesivo (se ven como dos letras separadas) ni nulo (se solapan). Referencia: preview usa `letter-spacing="-2"` sobre `font-size="34"`.
   - **Tamaño relativo / padding**: el glifo no debe tocar los bordes del cuadro 64×64; debe haber un margen similar al del preview (aprox. 8-10px de margen en cada lado a escala 64px).
   - **Legibilidad a 16px**: el caso más crítico — renderizar `app/icon.svg` a 16×16 y confirmar que `ma` se distingue (no se convierte en una mancha cyan).
4. Si el resultado no coincide, ajustar `fontSize`/`dx`/`dy`/tracking en el script de extracción (1.2.A.3) e iterar.
5. Eliminar `.tmp-favicon\compare.html` junto con el resto de temporales (1.4).

---

## 2. Generación de `favicon.ico` (16/32/48 multi-resolución) y `apple-icon.png` (180×180)

### 2.1 Herramienta: `sharp` — YA INSTALADO, sin tocar `package.json`

Hallazgo de esta sesión: `sharp@0.34.5` (con binario nativo `@img/sharp-win32-x64`) **ya está presente en `node_modules/`** como dependencia transitiva (probablemente de Next.js para optimización de imágenes). Se puede `require('sharp')` directamente desde un script Node ad-hoc **sin instalar nada**. Verificado en este sandbox:

```powershell
node -e "console.log(require('sharp/package.json').version)"
# -> 0.34.5
```

y rasteriza SVG → PNG correctamente (probado con un SVG mínimo, devuelve PNG válido).

> Riesgo: `sharp` es una dependencia transitiva no declarada — `npm ci`/`npm install` en otra máquina/CI **podría no instalarla** si ningún paquete de primer nivel la requiere de forma determinista. **Mitigación**: el script de generación (paso 2.2) se ejecuta **una sola vez, localmente**, para producir los ficheros binarios finales (`favicon.ico`, `apple-icon.png`), que se commitean como assets estáticos. El build de producción (`npm run build`) **no** necesita `sharp` en runtime — solo sirve los ficheros ya generados. Si `sharp` no estuviera disponible al ejecutar el script, fallback: usar Método B de 2.4.

### 2.2 Script de generación — `.tmp-favicon\generate-icons.mjs`

```js
// .tmp-favicon/generate-icons.mjs
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const svgPath = path.resolve('app/icon.svg')
const svgBuffer = fs.readFileSync(svgPath)

// --- apple-icon.png (180x180) ---
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(path.resolve('app/apple-icon.png'))

// --- PNGs intermedios para el .ico (16/32/48) ---
const sizes = [16, 32, 48]
const pngBuffers = await Promise.all(
  sizes.map((size) => sharp(svgBuffer).resize(size, size).png().toBuffer())
)

// --- ensamblar favicon.ico (formato ICO con frames PNG embebidos, soportado
//     por Windows Vista+ y todos los navegadores modernos) ---
function buildIco(images) {
  // images: [{ size, buffer }]
  const headerSize = 6
  const dirEntrySize = 16
  const numImages = images.length

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: 1 = icon
  header.writeUInt16LE(numImages, 4)

  let offset = headerSize + dirEntrySize * numImages
  const dirEntries = []
  const imageBuffers = []

  for (const { size, buffer } of images) {
    const entry = Buffer.alloc(dirEntrySize)
    entry.writeUInt8(size === 256 ? 0 : size, 0) // width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1) // height (0 = 256)
    entry.writeUInt8(0, 2) // color palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(buffer.length, 8) // image data size
    entry.writeUInt32LE(offset, 12) // offset
    dirEntries.push(entry)
    imageBuffers.push(buffer)
    offset += buffer.length
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers])
}

const icoImages = sizes.map((size, i) => ({ size, buffer: pngBuffers[i] }))
const icoBuffer = buildIco(icoImages)
fs.writeFileSync(path.resolve('app/favicon.ico'), icoBuffer)

console.log('OK: app/apple-icon.png (180x180) y app/favicon.ico (16/32/48) generados')
```

Ejecutar (desde la raíz del proyecto, después de tener `app/icon.svg` listo):

```powershell
node .\.tmp-favicon\generate-icons.mjs
```

**Notas sobre el formato ICO con frames PNG embebidos**:
- Es el formato "PNG-in-ICO" (BMP-in-ICO también existe pero es más complejo de generar a mano y peor soportado a tamaños pequeños). PNG-in-ICO es válido desde Windows Vista y soportado por todos los navegadores actuales (Chrome, Firefox, Safari, Edge).
- Verificar que `sharp().resize(16,16).png()` produce PNGs con canal alpha correcto (RGBA) — el rect de fondo `#1c1b1c` cubre todo el viewBox así que no debería haber transparencia, pero confirmar visualmente (paso 2.5).

### 2.3 Verificación de los assets generados

1. Abrir `app/favicon.ico` y `app/apple-icon.png` con el visor de imágenes de Windows o `Start-Process` para confirmar que se ven correctamente (no corruptos).
2. Confirmar dimensiones:
   ```powershell
   node -e "require('sharp')('app/apple-icon.png').metadata().then(m => console.log(m.width, m.height, m.format))"
   # esperado: 180 180 png
   ```
3. Para el `.ico`, verificar que el fichero no está vacío y que el header es correcto (primeros bytes `00 00 01 00` + número de imágenes = `03 00`):
   ```powershell
   node -e "const b=require('fs').readFileSync('app/favicon.ico'); console.log(b.subarray(0,6))"
   # esperado: <Buffer 00 00 01 00 03 00>
   ```
4. Comparar visualmente contra `.claude/doc/favicon-preview/preview.html` (Concepto B) a 16/32/48/64px (paso 1.5, mismo procedimiento pero con los PNGs/ICO finales).

### 2.4 Método B (fallback si `sharp` no funciona en el entorno del implementador)

- ImageMagick (si está instalado: `magick -version`): `magick app/icon.svg -resize 180x180 app/apple-icon.png` y `magick app/icon.svg -define icon:auto-resize=16,32,48 app/favicon.ico`.
- Si ni `sharp` ni ImageMagick están disponibles y no se puede instalar nada: usar una herramienta online de conversión SVG→ICO/PNG (p. ej. https://realfavicongenerator.net/ o https://cloudconvert.com/svg-to-ico configurado a 16/32/48), subiendo `app/icon.svg` y descargando los resultados a `app/favicon.ico` / `app/apple-icon.png`. Documentar en el PR si se usó esta vía.

### 2.5 Limpieza

- Eliminar `.tmp-favicon\generate-icons.mjs` junto con el resto de `.tmp-favicon/` (paso 1.4). Solo quedan en el repo: `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`.

---

## 3. `app/layout.tsx` — qué tocar (y qué NO tocar)

### 3.1 NO tocar

- **NO** añadir `metadata.icons` (ni `icon`, ni `shortcut`, ni `apple`). La convención de ficheros (`app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`) ya genera los `<link>` automáticamente — añadir `metadata.icons` duplicaría/podría entrar en conflicto (D2, Requirement "Inyección automática vía convención de Next.js": *"no existe configuración manual duplicada de iconos en `metadata.icons`"*).
- **NO** tocar `app/[locale]/layout.tsx` — no exporta metadata hoy y el favicon es global, no por locale.

### 3.2 Tocar (solo si se implementa D4, opcional pero recomendado por el proposal)

Editar `app/layout.tsx`:

```diff
 import type { Metadata } from 'next'
+import type { Metadata, Viewport } from 'next'
```

(o añadir `Viewport` al import existente `import type { Metadata } from 'next'` → `import type { Metadata, Viewport } from 'next'`)

Y añadir, junto a `export const metadata`:

```ts
export const viewport: Viewport = {
  themeColor: '#131314',
}
```

Insertar **después** del bloque `export const metadata: Metadata = {...}` (línea 32 actual), antes de `export default function RootLayout`. NO mezclar `themeColor` dentro de `metadata` — sería ignorado/deprecated en Next 16 (ver sección 0).

`#131314` es el token `--color-background` dark de `app/globals.css` (línea 25) — coincide con el "fondo de página" mencionado en design.md.

Resultado esperado en `<head>`:
```html
<meta name="theme-color" content="#131314" />
```

### 3.3 Resultado final esperado en `<head>` (todas las páginas, ES y EN)

```html
<link rel="icon" href="/icon.svg?<hash>" type="image/svg+xml" sizes="any" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="/apple-icon.png?<hash>" type="image/png" sizes="180x180" />
<meta name="theme-color" content="#131314" /> <!-- solo si se implementa 3.2 -->
```

(El orden exacto y el query-string `?<hash>` los decide Next.js internamente; no hardcodear el hash en ningún test.)

---

## 4. Lista ordenada de archivos a crear/modificar

| # | Archivo | Acción | Propósito |
|---|---|---|---|
| 1 | `app/icon.svg` | **crear** | Favicon SVG principal, monograma `ma` como paths, fondo `#1c1b1c`, glifo `#00dce5` |
| 2 | `app/favicon.ico` | **sustituir** (placeholder existente) | Fallback multi-resolución 16/32/48 para navegadores sin soporte SVG |
| 3 | `app/apple-icon.png` | **crear** | Icono 180×180 para iOS/Safari "Add to Home Screen" |
| 4 | `app/layout.tsx` | **modificar** (opcional, D4) | Añadir `export const viewport: Viewport = { themeColor: '#131314' }` |
| — | `.tmp-favicon/*` (TTF, scripts, comparativas) | **crear y luego eliminar** | Artefactos temporales de generación, no se commitean |
| — | `.claude/doc/favicon-preview/`, `favicon-compare.png` (raíz) | **eliminar** (tarea 6.2 de tasks.md) | Limpieza de artefactos de exploración previos, ya no necesarios |

No se tocan: `content/{es,en}/`, `messages/{es,en}.json`, `app/[locale]/layout.tsx`, `app/globals.css`, `package.json`, `package-lock.json`.

---

## 5. Verificación en build + E2E Playwright MCP

### 5.1 Build estático — confirmar `<link>` de iconos

```powershell
npm run lint
npm run test
npm run build
```

Tras `npm run build` (Next 16, App Router, SSG/SSG export):

- Si el proyecto genera HTML estático exportado (revisar `next.config.ts`/`.mjs` para `output: 'export'` u otro), inspeccionar el HTML generado para `/es/index.html` y `/en/index.html` (o las rutas equivalentes en `.next/server/app/[locale]/...` si no hay export estático puro):
  ```powershell
  Select-String -Path ".next\server\app\[locale]\page.html" -Pattern 'rel="icon"|rel="apple-touch-icon"|theme-color'
  ```
  (ajustar la ruta exacta según lo que genere `next build` — comprobar primero con `Get-ChildItem -Recurse .next\server\app -Filter *.html` o `.next\server\app\[locale]\**\*.rsc`/`*.html`).
- Confirmar que aparecen:
  - `<link rel="icon" href="/icon.svg..." type="image/svg+xml" sizes="any">`
  - `<link rel="icon" href="/favicon.ico" sizes="any">`
  - `<link rel="apple-touch-icon" href="/apple-icon.png..." type="image/png" sizes="180x180">`
  - (si D4) `<meta name="theme-color" content="#131314">`
- Confirmar que **no** hay metadata de iconos duplicada/manual.

> **Nota AGENTS.md**: si la estructura de `.next/server/app/` difiere de lo esperado en Next 16.2.7 (puede haber cambiado respecto a versiones anteriores — Cache Components, RSC payloads, etc.), usar `Get-ChildItem -Recurse .next -Filter "*.html"` para localizar el HTML real antes de hacer `Select-String`. Alternativamente, confiar en la verificación E2E (5.2) que es más robusta porque inspecciona el DOM renderizado real, independientemente de los detalles internos del build.

### 5.2 E2E Playwright MCP (el agente lo ejecuta)

1. `npm run dev` (esperar a que el servidor esté listo, p. ej. `http://localhost:3000`).
2. Con Playwright MCP:
   - `browser_navigate` a `http://localhost:3000/es`.
   - `browser_evaluate`: ejecutar
     ```js
     () => {
       const iconLink = document.querySelector('link[rel="icon"][type="image/svg+xml"]')
       const icoLink = document.querySelector('link[rel="icon"]:not([type])') // o el segundo <link rel="icon">
       const appleLink = document.querySelector('link[rel="apple-touch-icon"]')
       return {
         iconHref: iconLink?.href,
         icoHref: icoLink?.href,
         appleHref: appleLink?.href,
       }
     }
     ```
   - Hacer un `fetch` (vía `browser_evaluate` con `fetch(href).then(r => r.status)`) a `iconHref` y confirmar **HTTP 200** y `content-type: image/svg+xml`.
   - Repetir fetch/200 para `app/favicon.ico` (`/favicon.ico`) y `app/apple-icon.png` (`appleHref`).
   - `browser_take_screenshot` para documentar la pestaña con el favicon visible (si el navegador headless lo soporta; si no, capturar al menos la página cargada).
3. Repetir todo en `http://localhost:3000/en`.
4. Verificar que el toggle de tema claro/oscuro (`ThemeToggle`) sigue funcionando con normalidad — el favicon es independiente del tema de la página (caja oscura sólida fija), pero hay que confirmar que no se ha roto nada en `app/layout.tsx` al añadir `viewport` (si se hizo el paso 3.2). Hacer click en el toggle y verificar que la clase `.dark` en `<html>` cambia correctamente.
5. Confirmar visualmente que el LCP del Hero no se ve afectado (el favicon no bloquea el render — es un recurso `<link>` no bloqueante por naturaleza, pero confirmar que no hay errores de red 404 en consola que retrasen nada).
6. Documentar pasos, comandos `browser_evaluate` exactos y resultado (200/200/200) + capturas en `openspec/changes/add-favicon/reports/YYYY-MM-DD-verification.md` (paso 5.1 de `tasks.md`).

---

## 6. Riesgos concretos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Sin acceso a red en el entorno de implementación** (este sandbox de planificación no tiene `fetch`/`npm registry` funcional — `UNABLE_TO_VERIFY_LEAF_SIGNATURE` y `fetch failed`). | Verificar conectividad ANTES de empezar (`node -e "fetch('https://fonts.google.com').then(r=>console.log(r.status))"`). Si el entorno real de implementación tampoco tiene red, usar Método B de 1.2 (herramienta online desde una máquina con navegador) para obtener el `d` del path, y Método B de 2.4 para los rasters. |
| **`npx opentype.js` falla por certificados** (visto en este sandbox). | No usar `strict-ssl=false`. Probar `npm install --no-save opentype.js@1.3.4` o `node --use-system-ca`. Si nada funciona, Método B (herramienta online `google-font-to-svg-path`). |
| **Extracción imperfecta de paths → kerning/proporción del `ma` distinto al preview validado** (riesgo señalado en design.md). | Paso 1.5: comparación visual sistemática a 16/32/48/64/128px contra `.claude/doc/favicon-preview/preview.html` (Concepto B). Iterar `fontSize`/offsets/tracking hasta que coincida. No dar por bueno sin esta comparación. |
| **`favicon.ico` con una sola resolución se ve borroso a 16px**. | Generar siempre 16/32/48 (script de la sección 2.2) y verificar el `.ico` a 16px específicamente (paso 2.3.4 + 1.5 con el `.ico` final). |
| **`sharp` es dependencia transitiva no declarada** — podría no estar presente en `npm ci` limpio en otra máquina/CI. | El script de generación de iconos (2.2) es **un paso de build-time manual, una sola vez**; los binarios resultantes (`favicon.ico`, `apple-icon.png`) se commitean. `npm run build` de producción no depende de `sharp` para servir estos ficheros estáticos. Si `sharp` falta al ejecutar el script localmente, usar Método B (2.4, ImageMagick u online). |
| **Confundir `metadata.icons` (deprecated/manual) con la convención de ficheros**, o **usar `themeColor` dentro de `metadata` (deprecated desde Next 14)**. | Sección 0 y 3 de este plan documentan explícitamente la API correcta (`viewport: Viewport` separado). Revisar `node_modules/next/dist/docs/.../generate-viewport.md` antes de tocar `app/layout.tsx`. |
| **`favicon.ico` solo es válido en `app/` raíz, no en `app/[locale]/`** — error común sería colocarlo (o `icon.svg`/`apple-icon.png`) dentro de `app/[locale]/`, lo que NO generaría el `<link>` global esperado o generaría duplicados por locale. | Todos los assets van en `app/` raíz (mismo nivel que el `app/favicon.ico` placeholder actual), confirmado en sección 0 y 4. |
| **Caché agresiva de favicons en navegadores** (riesgo ya identificado en design.md, no bloqueante). | Verificar en ventana de incógnito durante E2E (5.2). No requiere acción de código — Next.js versiona el recurso vía query-string hash. |
| **Artefactos temporales (`.tmp-favicon/`, TTF descargado, `node_modules/opentype.js` con `--no-save`) acaban commiteados por error**. | Paso 1.4/2.5: checklist explícito de limpieza + `git status` antes de commit. Añadir `.tmp-favicon/` a un `.gitignore` temporal local si se prefiere extra seguridad (pero recordar no dejarlo si no aporta valor permanente — o simplemente no commitear esa carpeta y borrarla al final). |
| **SVG con bloat de herramientas de exportación** (metadata de Inkscape/Illustrator, namespaces extra) infla el tamaño y puede incluir referencias no deseadas. | Limpiar manualmente el XML final dejando solo `<svg viewBox="0 0 64 64" xmlns="...">`, `<rect>`, `<path>` (sección 1.3). |
| **Next 16 podría tener un comportamiento distinto al documentado** si la versión instalada difiere ligeramente de lo asumido aquí. | Se ha leído `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md` y `.../04-functions/generate-viewport.md` de la instalación real (`next@16.2.7`) — la tabla de la sección 0 refleja esa versión exacta. Si `npm run build` no genera los `<link>` esperados, re-leer esos docs y verificar nombres de fichero/ubicación exactos antes de cambiar de enfoque. |

---

## 7. Checklist de cierre (alineado con `tasks.md`)

- [ ] `app/icon.svg` creado (paths, sin `<text>`, viewBox 64×64, `#1c1b1c`/`#00dce5`).
- [ ] `app/favicon.ico` sustituido (16/32/48, formato PNG-in-ICO válido).
- [ ] `app/apple-icon.png` creado (180×180 PNG).
- [ ] (Opcional D4) `app/layout.tsx` con `export const viewport: Viewport = { themeColor: '#131314' }`, **sin** `themeColor` dentro de `metadata`.
- [ ] Sin `metadata.icons` manual.
- [ ] `.tmp-favicon/` y artefactos de preview (`.claude/doc/favicon-preview/`, `favicon-compare.png`) eliminados.
- [ ] `npm run lint && npm run test && npm run build` en verde.
- [ ] HTML generado contiene los `<link rel="icon">`, `<link rel="apple-touch-icon">` (y `<meta name="theme-color">` si D4).
- [ ] E2E Playwright MCP en `/es` y `/en`: `link[rel="icon"]` SVG presente y responde 200; `favicon.ico` y `apple-icon.png` responden 200; toggle de tema funcional; capturas documentadas.
- [ ] Sin cambios en `content/` ni `messages/`.
- [ ] Sin nuevas dependencias en `package.json`/`package-lock.json`.
