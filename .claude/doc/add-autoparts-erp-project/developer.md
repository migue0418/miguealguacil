# Plan técnico: add-autoparts-erp-project

## Resumen

Cambio **de contenido únicamente**: se añade un cuarto objeto `Project` (`id: 'autoparts-inventory-platform'`) al final del array `projects: Project[]` en `content/es/projects.ts` y `content/en/projects.ts`, con `name`, `description`, `stack`, `featured: true` y `detail.summary` (2 párrafos) + `detail.sections` (4 secciones con `heading` + `paragraphs`). No incluye `repoUrl`/`repoUrls`/`demoUrl` ni `detail.results`/`detail.images`/`detail.links`. No se toca ningún componente, página, `messages/{es,en}.json` ni `lib/`: la sección Proyectos, la página de detalle `/proyectos/[projectId]` (con `generateStaticParams` dinámico sobre `getProjects(locale)`) y el sitemap ya soportan proyectos con este shape "mínimo" sin cambios de código.

## Archivos a modificar

1. `c:\Users\migue\Documents\Proyectos\miguealguacil\content\es\projects.ts`
2. `c:\Users\migue\Documents\Proyectos\miguealguacil\content\en\projects.ts`

No se modifica ningún otro archivo (ver sección "Confirmación: sin cambios de código" más abajo).

---

## Tipos de referencia (`lib/types.ts`, NO modificar)

```ts
export interface ProjectDetailSection {
  heading: string
  paragraphs: string[]
}

export interface ProjectDetail {
  summary: string[]
  sections?: ProjectDetailSection[]
  results?: ProjectDetailResult[]
  images?: ProjectDetailImage[]
  links?: ProjectDetailLink[]
}

export interface Project {
  id: string
  name: string
  description: string
  stack: string[]
  repoUrl?: string
  repoUrls?: { label: string; url: string }[]
  demoUrl?: string
  featured: boolean
  detail?: ProjectDetail
}
```

Puntos críticos de nombres de campos (no inventar otros):
- Las secciones usan `heading` (NO `title`) y `paragraphs` (NO `content`), cada uno `string[]`.
- `detail.summary` es **`string[]`** (array de párrafos), no un string único.
- `repoUrl`, `repoUrls`, `demoUrl`, `detail.results`, `detail.images`, `detail.links` son **opcionales**: simplemente se omiten (no poner `undefined` ni arrays vacíos).
- `featured` es obligatorio (`boolean`): usar `true`.

---

## 1. `content/es/projects.ts`

### Posición de inserción

El array `projects: Project[]` tiene actualmente 3 elementos:
1. `minecraft-butler-ai`
2. `tfm-sexism-classifier`
3. `fastapi-react-template`

Insertar el nuevo objeto **como 4º elemento, justo después del objeto `fastapi-react-template`** (después de su `},` de cierre en la línea 226 del fichero actual, y antes del `]` de cierre del array en la línea 227). Es decir, el nuevo bloque va entre:

```ts
    },
  },
  // <-- AQUÍ: nuevo objeto Project (autoparts-inventory-platform)
]
```

### Objeto a insertar (ES)

```ts
  {
    id: 'autoparts-inventory-platform',
    name: 'Plataforma de gestión e inventario para tienda de recambios de automóvil',
    description:
      'Plataforma full-stack de gestión e inventario para una tienda de recambios de automóvil: sincroniza y amplía la API de Factusol/SDELsol, automatiza la lectura de facturas de proveedores con OCR, relaciona artículos equivalentes de distintas marcas para encontrar alternativas, y convierte los móviles de la tienda en PDAs conectadas en tiempo real.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'PostgreSQL', 'SQLAlchemy', 'OCR', 'Docker', 'Caddy'],
    featured: true,
    detail: {
      summary: [
        'Aplicación interna de gestión para una tienda de recambios de automóvil, construida sobre Factusol Cloud (SDELsol), el ERP que usa el negocio para facturación y contabilidad. El proyecto se llevó de extremo a extremo —como desarrollador y como product manager—: desde decidir qué partes del flujo de trabajo merecía la pena automatizar hasta diseñar la migración desde el sistema anterior, la capa de integración con Factusol y el despliegue final en la red local del negocio.',
        'Factusol expone una API de administración limitada (leer/escribir tablas, lanzar consultas), sin conceptos como la relación entre artículos equivalentes de distintas marcas, lectura automática de facturas o uso del móvil como terminal de almacén. El proyecto añade esa capa por encima: sincronización con PostgreSQL, un índice de equivalencias entre marcas para encontrar alternativas con el mismo uso, un pipeline de OCR para facturas de proveedores que escribe directamente en Factusol, y una app web servida en HTTPS dentro de la red local que cualquier móvil puede usar como PDA.',
      ],
      sections: [
        {
          heading: 'Sincronización y capa de negocio sobre Factusol',
          paragraphs: [
            'Un cliente HTTP asíncrono se autentica contra la API de Factusol (token JWT cacheado y renovado automáticamente) y expone operaciones genéricas —leer tablas, lanzar consultas SQL, y escribir/actualizar/borrar registros— sobre las tablas del ERP (artículos, proveedores, tarifas, stock, facturas...). Sobre ese cliente se construyó un sincronizador que replica esas tablas en PostgreSQL de forma incremental (solo registros modificados desde la última sincronización) o completa, programable por tabla con un scheduler en segundo plano.',
            'Tener una copia local en PostgreSQL permite construir herramientas de análisis que Factusol no ofrece: un análisis de márgenes por familia de artículos (comparando precio de tarifa y precio de coste) y una comparación de tarifas de proveedor (ficheros Excel de tarifa frente al catálogo, clasificando coincidencias por referencia o código de barras).',
            'La pieza más valiosa de esta capa es la relación entre artículos equivalentes de distintas marcas: un mismo recambio (por ejemplo, una pastilla de freno o un filtro para un modelo de coche concreto) lo fabrican varios proveedores con referencias propias distintas, y Factusol guarda un \'código equivalente\' por artículo pero no ofrece ninguna forma de explotarlo. Se construyó un índice de equivalencias que, dado un artículo, muestra de un vistazo las alternativas de otras marcas que cubren el mismo uso, junto a su stock, precio y margen — útil tanto para ofrecer una alternativa cuando el artículo solicitado no hay en stock como para elegir, entre varias opciones válidas, la de mejor margen.',
          ],
        },
        {
          heading: 'OCR de facturas de proveedores',
          paragraphs: [
            'Las facturas de compra que llegan de los proveedores (PDF o imagen) se procesan con un pipeline OCR que extrae cabecera y líneas: referencia, descripción, cantidad, precio de coste y descuentos. Cada línea se cruza contra el catálogo usando la referencia del proveedor o el código de barras del artículo.',
            'Las líneas reconocidas se escriben directamente en Factusol a través de su API —actualizando precios de coste y, si procede, dando de alta el artículo—, de forma que el coste de compra queda al día sin teclear nada. Las líneas que no se reconocen automáticamente quedan en una cola de revisión manual, donde se asocian a un artículo existente o se crean como nuevos.',
            'Antes de esto, cada factura de proveedor implicaba teclear manualmente artículo por artículo en Factusol; ahora ese trabajo se reduce a revisar las pocas líneas que el sistema no reconoce.',
          ],
        },
        {
          heading: 'Migración desde el sistema anterior',
          paragraphs: [
            'El negocio venía de un sistema de gestión anterior (no Factusol) cuya base de datos se migró por completo a Factusol Cloud: catálogo de artículos, proveedores, clientes, tarifas y el histórico de facturas y albaranes emitidos y recibidos.',
            'Los datos del sistema anterior se volcaron a PostgreSQL como zona de staging, se limpiaron y normalizaron (incluyendo una clasificación asistida con IA para completar descripciones y familias de artículos que llegaban incompletas), se revisaron manualmente para control de calidad y finalmente se exportaron a las plantillas Excel que la herramienta de importación de Factusol Cloud espera.',
            'Como el negocio siguió operando durante toda la preparación de la migración, el proceso se diseñó de forma incremental: los nuevos movimientos (facturas, albaranes, tarifas) que se iban generando mientras se depuraba el resto del catálogo se incorporaban a la misma zona de staging en sucesivas pasadas, de modo que el volcado final a Factusol Cloud reflejara el catálogo y el histórico completos hasta el último día de actividad con el sistema anterior.',
          ],
        },
        {
          heading: 'Despliegue local: Caddy y móviles como PDA',
          paragraphs: [
            'Toda la aplicación —backend FastAPI sirviendo el build de React, y PostgreSQL— se ejecuta en contenedores con Docker Compose, detrás de Caddy como proxy inverso. Caddy emite y renueva automáticamente certificados TLS para un dominio interno de la red local del negocio, sin depender de un dominio público.',
            'Con esos certificados instalados como de confianza en los móviles de la tienda, cualquier empleado puede abrir la app desde el navegador del teléfono por HTTPS y usar la cámara como lector de códigos de barras (API BarcodeDetector con polyfill WASM para que funcione también en iOS), convirtiendo el móvil en una PDA conectada en tiempo real tanto a la API de Factusol como a la base de datos PostgreSQL sincronizada.',
            'El resultado es que el almacén dispone de consulta de stock, precios e inventario en tiempo real desde cualquier móvil, sin instalar nada y sin comprar hardware dedicado.',
          ],
        },
      ],
    },
  },
```

**Notas de sintaxis:**
- Usar comillas simples consistentes con el resto del fichero. El párrafo 3 de la sección 1 contiene un apóstrofe (`'código equivalente'`); en el snippet de arriba está escapado con `\'...\'` dentro de comillas simples — alternativamente usar comillas dobles para ese string concreto (`"...la relación entre artículos equivalentes... \"código equivalente\"..."` con comillas dobles externas y escapando las internas), pero **mantener consistencia con el estilo Prettier del proyecto** (revisar `.prettierrc`/ESLint: si el proyecto usa `singleQuote: true`, usar `\'` escapado como en el snippet; si el formateador prefiere comillas dobles para strings con apóstrofes, dejar que `npm run lint`/Prettier lo autoformatee — no es bloqueante, pero el snippet ya es válido TS).
- No añadir coma final extra ni claves adicionales (`repoUrl`, `results`, `images`, `links`, `demoUrl`) — deben estar ausentes, no `undefined`.

---

## 2. `content/en/projects.ts`

### Posición de inserción

Misma posición relativa: **4º elemento, tras el objeto `fastapi-react-template`**, manteniendo el mismo orden/índice que en `content/es/projects.ts` (ambos arrays deben tener `autoparts-inventory-platform` en la posición 4, índice 3).

### Objeto a insertar (EN)

```ts
  {
    id: 'autoparts-inventory-platform',
    name: 'Inventory & Operations Platform for an Auto Parts Store',
    description:
      'Full-stack inventory and operations platform for an auto parts store: syncs and extends the Factusol/SDELsol API, automates supplier invoice processing with OCR, cross-references equivalent products across brands to surface alternatives, and turns staff phones into real-time connected PDAs.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'PostgreSQL', 'SQLAlchemy', 'OCR', 'Docker', 'Caddy'],
    featured: true,
    detail: {
      summary: [
        'Internal management application for an auto parts store, built on top of Factusol Cloud (SDELsol), the ERP the business uses for invoicing and accounting. The project was driven end to end — as both developer and product manager — from deciding which parts of the daily workflow were worth automating, to designing the migration from the previous system, the Factusol integration layer, and the final deployment on the business\'s local network.',
        'Factusol exposes a narrow admin API (read/write tables, run queries) with no concept of cross-brand product equivalence, automatic invoice reading, or using a phone as a warehouse terminal. The project adds that layer on top: a PostgreSQL sync layer, a cross-brand equivalence index for finding alternatives with the same use, an OCR pipeline for supplier invoices that writes straight back into Factusol, and a web app served over HTTPS on the local network that any phone can use as a PDA.',
      ],
      sections: [
        {
          heading: 'Sync layer & business logic on top of Factusol',
          paragraphs: [
            'An async HTTP client authenticates against the Factusol API (a JWT token cached and refreshed automatically) and exposes generic operations — reading tables, running SQL-like queries, and writing/updating/deleting records — over the ERP\'s tables (articles, suppliers, price lists, stock, invoices...). On top of that client, a syncer mirrors those tables into PostgreSQL either incrementally (only records modified since the last sync) or in full, schedulable per table with a background scheduler.',
            'Having a local PostgreSQL copy enables analysis tools Factusol doesn\'t offer: a margin analysis by product family (comparing list price against cost price) and a supplier rate-sheet comparison (matching tariff Excel files against the catalog by reference or barcode).',
            'The most valuable piece of this layer is the cross-brand equivalent-articles relationship: the same part (say, a brake pad or a filter for a specific car model) is manufactured by several suppliers under their own different references, and Factusol stores an \'equivalent code\' per article but offers no way to make use of it. An equivalence index was built that, given an article, shows at a glance the alternatives from other brands covering the same use, along with their stock, price and margin — useful both for offering an alternative when the requested article is out of stock and for picking the best-margin option among several valid alternatives.',
          ],
        },
        {
          heading: 'Supplier invoice OCR',
          paragraphs: [
            'Purchase invoices arriving from suppliers (PDF or image) are processed through an OCR pipeline that extracts header and line items: reference, description, quantity, unit cost and discounts. Each line is matched against the catalog using the supplier\'s reference or the article\'s barcode.',
            'Recognized lines are written directly into Factusol through its API — updating cost prices and, where needed, creating the article — so purchase costs stay up to date without any manual typing. Lines that aren\'t recognized automatically fall into a manual review queue, where staff link them to an existing article or create a new one.',
            'Before this, every supplier invoice meant typing each line item into Factusol by hand; now that work is reduced to reviewing the handful of lines the system doesn\'t recognize.',
          ],
        },
        {
          heading: 'Migration from the previous system',
          paragraphs: [
            'The business came from a previous management system (not Factusol), whose database was fully migrated to Factusol Cloud: article catalog, suppliers, customers, price lists, and the history of issued and received invoices and delivery notes.',
            'Data from the previous system was staged in PostgreSQL, cleaned and normalized (including AI-assisted classification to fill in incomplete article descriptions and families), manually reviewed for quality, and finally exported to the Excel templates Factusol Cloud\'s import tool expects.',
            'Because the business kept operating while the migration was being prepared, the process was designed to be incremental: new transactions (invoices, delivery notes, price lists) generated while the rest of the catalog was being cleaned up were folded into the same staging area over successive passes, so the final dump into Factusol Cloud reflected the full catalog and history up to the last day of activity on the previous system.',
          ],
        },
        {
          heading: 'Local deployment: Caddy & mobile devices as PDAs',
          paragraphs: [
            'The whole application — a FastAPI backend serving the React build, plus PostgreSQL — runs in containers via Docker Compose, behind Caddy as a reverse proxy. Caddy automatically issues and renews TLS certificates for an internal hostname on the business\'s local network, with no public domain required.',
            'With those certificates trusted on the store\'s phones, any employee can open the app from their phone\'s browser over HTTPS and use the camera as a barcode scanner (the BarcodeDetector API with a WASM polyfill so it also works on iOS), turning the phone into a PDA connected in real time to both the Factusol API and the synced PostgreSQL database.',
            'The result is real-time stock, pricing and inventory lookups from any phone on the shop floor, with no app to install and no dedicated hardware to buy.',
          ],
        },
      ],
    },
  },
```

**Notas de sintaxis:** el texto en inglés contiene varios apóstrofes en contracciones (`doesn't`, `isn't`, `business's`, `store's`, `phone's`) y comillas simples para `'equivalent code'` / `'code'`. El fichero `content/en/projects.ts` ya usa el patrón `\'...\'` dentro de strings con comillas simples para casos similares (ver `tfm-sexism-classifier`: `"As a proof of concept, the University of Granada's main portal..."` usa comillas dobles cuando hay apóstrofes). **Recomendación**: para los párrafos con muchos apóstrofes, envolver el string en comillas dobles `"..."` y no escapar nada (igual que ya hace el fichero en la línea 99 con `"As a proof of concept..."`); para los párrafos sin apóstrofes, mantener comillas simples `'...'`. Ajustar caso por caso para minimizar escapes — el formateador (`npm run lint` con `--fix` / Prettier) normalizará el estilo si hace falta, así que no es crítico acertar a la primera, pero el código debe ser TS válido.

---

## 3. Tests — revisión y conclusión

He revisado:
- `components/sections/__tests__/ProjectsGrid.test.tsx`
- `components/ui/__tests__/ProjectCard.test.tsx`
- `components/sections/__tests__/ProjectDetail.test.tsx`
- `app/__tests__/sitemap.test.ts`

**Ninguno necesita cambios:**

- `ProjectsGrid.test.tsx` y `ProjectDetail.test.tsx` y `ProjectCard.test.tsx` definen sus propios `mockProject`/`mockProjects`/`fullProject`/`baseProject` inline (objetos `Project` ad-hoc), **no importan** `content/{es,en}/projects.ts`. No hay `toHaveLength` sobre el array real de proyectos ni snapshots que dependan del número de proyectos.
- `app/__tests__/sitemap.test.ts` itera dinámicamente con `for (const project of esProjects)` sobre `await getProjects('es')` — añadir un 4º proyecto solo añade más iteraciones, el test sigue pasando igual (siempre que `id` coincida en ambos locales, que es el caso).
- No existe ningún `content/{es,en}/projects.test.ts`.
- Los únicos `toHaveLength` en tests (`MobileNav.test.tsx`, `Nav.test.tsx` con `toHaveLength(5)`, `ProjectsGrid.test.tsx` con `toHaveLength(2)`, `ProjectDetail.test.tsx` con `toHaveLength(3)` para imágenes) son sobre datos mock locales o sobre nav links, no sobre el array de proyectos real. No requieren cambios.

**Conclusión paso 3 de `tasks.md`**: no hay tests que ajustar. El paso 3.1/3.2 de `tasks.md` se completa simplemente ejecutando la suite (`npm run test`) y confirmando que sigue en verde sin tocar nada — documentar esto en el informe de verificación.

---

## 4. Confirmación: sin cambios de código

- **`messages/{es,en}.json`**: no se añade ningún string de UI nuevo. El `name`/`description`/`detail.*` del proyecto son contenido (`content/`), no strings de `next-intl`. **No tocar.**
- **Componentes** (`components/sections/ProjectsGrid.tsx`, `components/ui/ProjectCard.tsx`, `components/sections/ProjectDetail.tsx`, `components/ui/AnimatedProjectCard.tsx`): ya renderizan cualquier `Project` del array de forma genérica. `ProjectCard`/`ProjectsGrid` no muestran enlaces de repo/demo si `repoUrl`/`repoUrls`/`demoUrl` están ausentes (igual que otros proyectos sin esos campos no existen actualmente, pero el spec `project-detail-page` ya cubre explícitamente los escenarios "Sin cabecera de enlaces externos" y "Sin secciones de resultados, capturas ni enlaces adicionales"). `ProjectDetail` ya tiene lógica condicional para `detail.results`/`detail.images`/`detail.links` (ver tests `falls back to description as overview when detail is missing` y `does not render a screenshots section when detail.images is missing`). **No tocar.**
- **Páginas** (`app/[locale]/page.tsx`, `app/[locale]/proyectos/[projectId]/page.tsx`, `app/sitemap.ts`): `generateStaticParams` en `[projectId]/page.tsx` itera dinámicamente sobre `getProjects(locale)` para cada `locale` de `routing.locales` — el nuevo `id` `autoparts-inventory-platform` generará automáticamente las rutas estáticas `/proyectos/autoparts-inventory-platform` y `/en/proyectos/autoparts-inventory-platform` en `npm run build`, sin tocar el archivo. **No tocar.**
- **`lib/content.ts` / `lib/types.ts`**: sin cambios — `getProjects` ya hace `import('@/content/${locale}/projects')` genérico, y el tipo `Project`/`ProjectDetail` ya soporta el shape del nuevo proyecto (campos opcionales ausentes). **No tocar.**
- **Animaciones**: ninguna nueva — el nuevo proyecto usa los mismos wrappers (`AnimatedProjectCard`, etc.) ya aplicados a todo el array. **No tocar.**

---

## 5. Pasos de verificación (a ejecutar por el agente que implemente)

1. `npm run lint && npm run test && npm run build` — debe pasar en verde. El `build` generará las páginas estáticas para `/proyectos/autoparts-inventory-platform` y `/en/proyectos/autoparts-inventory-platform` (revisar el output de `next build` para confirmar que aparecen ambas rutas en el listado de páginas SSG).
2. E2E con Playwright MCP (`npm run dev` primero):
   - `/` (ES): scroll a `#proyectos`, comprobar que aparece la fila "Plataforma de gestión e inventario para tienda de recambios de automóvil" con los chips de stack (`Python`, `FastAPI`, `React`, `TypeScript`, `PostgreSQL`, `SQLAlchemy`, `OCR`, `Docker`, `Caddy`) y sin enlaces externos ↗.
   - `/proyectos/autoparts-inventory-platform`: comprobar resumen (2 párrafos) y las 4 secciones en orden ("Sincronización y capa de negocio sobre Factusol", "OCR de facturas de proveedores", "Migración desde el sistema anterior", "Despliegue local: Caddy y móviles como PDA"), sin "Resultados"/"Capturas"/"Enlaces".
   - Repetir en `/en` y `/en/proyectos/autoparts-inventory-platform` con la traducción EN.
   - Toggle de tema claro/oscuro en la página de detalle (ES y EN).
3. Guardar el informe en `openspec/changes/add-autoparts-erp-project/reports/2026-06-14-verification.md` (paso 6.2 de `tasks.md`).

---

## 6. Resumen de archivos tocados (paso 6.1 de `tasks.md`)

- `content/es/projects.ts` — añadir objeto `autoparts-inventory-platform` como 4º elemento (índice 3) del array, tras `fastapi-react-template`.
- `content/en/projects.ts` — añadir el mismo objeto traducido, misma posición (índice 3).
- Ningún otro archivo (componentes, páginas, `messages/`, `lib/`, tests) requiere cambios.
