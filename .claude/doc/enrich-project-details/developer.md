# Plan técnico — `enrich-project-details`

Este plan es la referencia exacta para `/opsx:apply`. Está organizado por los mismos grupos
que `openspec/changes/enrich-project-details/tasks.md` (0–8). **No crear rama ni PR nuevos**:
este cambio se implementa sobre `feature/project-detail-pages` (ya existente, con upstream) y
se integra en el PR #3 ya abierto.

---

## 0. Setup

- Verificar `git status` / `git branch --show-current` → debe ser `feature/project-detail-pages`,
  sin cambios pendientes (o solo los de este cambio si ya se empezó). **No** ejecutar
  `git checkout -b` ni crear ninguna rama nueva.

---

## 1. Modelo de datos e i18n

### 1.1 `lib/types.ts`

Añadir la interfaz `ProjectDetailImage` justo después de `ProjectDetailLink` (o antes de
`ProjectDetail`, da igual el orden relativo mientras esté definida antes de usarse) y el campo
opcional `images` en `ProjectDetail`. Archivo completo tras el cambio (solo se muestran las
líneas relevantes; el resto de `lib/types.ts` permanece igual):

```ts
export interface ProjectDetailSection {
  heading: string
  paragraphs: string[]
}

export interface ProjectDetailResult {
  label: string
  value: string
}

export interface ProjectDetailLink {
  label: string
  url: string
}

export interface ProjectDetailImage {
  src: string
  alt: string
  caption?: string
  width: number
  height: number
}

export interface ProjectDetail {
  summary: string[]
  sections?: ProjectDetailSection[]
  results?: ProjectDetailResult[]
  images?: ProjectDetailImage[]
  links?: ProjectDetailLink[]
}
```

Nota: el orden de los campos dentro de `ProjectDetail` (`images` antes de `links`) es solo
estético/documental — no afecta al render, que está hardcodeado en `ProjectDetail.tsx` con el
orden `summary → sections → results → images → links`.

### 1.2 `messages/es.json` y `messages/en.json`

Añadir la clave `screenshots` al namespace `projectDetail`, después de `results` y antes de
`links` (orden estético, refleja el orden de render).

`messages/es.json` (namespace `projectDetail` completo tras el cambio):

```json
  "projectDetail": {
    "back": "Volver a proyectos",
    "overview": "Resumen",
    "results": "Resultados",
    "screenshots": "Capturas",
    "links": "Enlaces"
  }
```

`messages/en.json` (namespace `projectDetail` completo tras el cambio):

```json
  "projectDetail": {
    "back": "Back to projects",
    "overview": "Overview",
    "results": "Results",
    "screenshots": "Screenshots",
    "links": "Links"
  }
```

**IMPORTANTE**: estos dos archivos JSON terminan con `}` de cierre del objeto raíz justo
después de `projectDetail`. Al editar, usar el `Edit` tool con el bloque `"results": "Resultados"` →
`"results": "Resultados",\n    "screenshots": "Capturas"` (y equivalente en inglés) para no
romper la coma final / el cierre del objeto. Verificar con un linter JSON o `npm run lint` que
el JSON sigue siendo válido.

---

## 2. Galería de capturas en `ProjectDetail` (TDD)

### 2.1 Tests Vitest (que deben fallar antes de 2.2)

Archivo: `components/sections/__tests__/ProjectDetail.test.tsx`.

**Mock de `next/image`**: actualmente no hay mock para `next/image`. En jsdom, `next/image`
funciona razonablemente bien para SSR/render simple porque internamente renderiza un `<img>`,
pero para evitar acoplarnos a detalles de implementación (warnings de `fill`, `srcSet`, etc.) y
mantener el test rápido y estable, **añadir un mock simple**:

```ts
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} {...rest} />
  ),
}))
```

Colocar este mock junto a los otros `vi.mock(...)` ya existentes al inicio del archivo (después
del mock de `@/i18n/navigation`).

**Nuevo fixture** `projectWithImages` (añadir tras `fullProject`, reutilizando su estructura):

```ts
const projectWithImages: Project = {
  id: 'tfm-sexism-classifier',
  name: 'TFM Project',
  description: 'Short description fallback.',
  stack: ['Python', 'PyTorch'],
  repoUrl: 'https://github.com/test/tfm',
  featured: true,
  detail: {
    summary: ['Summary paragraph.'],
    images: [
      {
        src: '/images/projects/tfm-sexism-classifier/binary-results-diagram.png',
        alt: 'F1 comparison chart',
        caption: 'F1 (macro) comparison by model and dataset',
        width: 3600,
        height: 1800,
      },
      {
        src: '/images/projects/tfm-sexism-classifier/login-page.png',
        alt: 'Application login screen',
        caption: 'Application login screen',
        width: 1920,
        height: 945,
      },
      {
        src: '/images/projects/tfm-sexism-classifier/analytics-global.png',
        alt: 'Global analytics dashboard',
        width: 1916,
        height: 939,
        // sin caption a propósito
      },
    ],
  },
}
```

**Nuevos casos de test** (añadir dentro de `describe('ProjectDetail', () => { ... })`, después
del test `'renders detail.links as external links opening in a new tab'`):

```ts
  it('renders detail.images as a screenshots gallery with captions', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: projectWithImages }))

    expect(screen.getByRole('heading', { name: 'screenshots' })).toBeInTheDocument()

    const images = screen.getAllByRole('img')
    // 3 imágenes de la galería (no hay otras <img> en este componente)
    expect(images).toHaveLength(3)
    expect(screen.getByAltText('F1 comparison chart')).toBeInTheDocument()
    expect(screen.getByAltText('Application login screen')).toBeInTheDocument()
    expect(screen.getByAltText('Global analytics dashboard')).toBeInTheDocument()

    // captions presentes cuando existen
    expect(screen.getByText('F1 (macro) comparison by model and dataset')).toBeInTheDocument()
    expect(screen.getByText('Application login screen', { selector: 'figcaption' })).toBeInTheDocument()
  })

  it('does not render a screenshots section when detail.images is missing', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    expect(screen.queryByRole('heading', { name: 'screenshots' })).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
```

**Nota sobre el segundo test de caption**: el `caption` de `login-page.png` en el fixture es
`'Application login screen'`, igual que su `alt`. Usar `{ selector: 'figcaption' }` en
`getByText` evita ambigüedad con el `alt` del `<img>` (que con el mock anterior no aparece como
texto, pero es buena práctica). Si se prefiere evitar la duplicidad, cambiar el `caption` del
fixture a un texto distinto del `alt`, p.ej. `'Login screen, dark theme'` — cualquiera de las
dos opciones es válida; se documenta aquí por claridad.

Ejecutar `npm run test -- ProjectDetail` (o el comando equivalente de Vitest configurado en
`package.json`) y confirmar que **fallan** estos dos nuevos tests antes de pasar a 2.2 (TDD).

### 2.2 Implementación en `components/sections/ProjectDetail.tsx`

1. Añadir el import de `next/image` junto al resto de imports, al principio del archivo:

```tsx
import Image from 'next/image'
```

2. Insertar la nueva sección de galería **entre** el bloque `{project.detail?.results && (...)}`
   y el bloque `{project.detail?.links && (...)}`. El bloque completo a insertar:

```tsx
      {project.detail?.images && (
        <div className="mb-16">
          <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-6">
            {t('screenshots')}
          </h2>
          <StaggerChildren className="flex flex-col gap-8">
            {project.detail.images.map((img) => (
              <figure key={img.src}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="rounded border border-default w-full h-auto"
                />
                {img.caption && (
                  <figcaption className="mt-2 font-mono text-xs text-muted">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </StaggerChildren>
        </div>
      )}
```

Notas de implementación:

- Los tokens de clase `text-primary`, `text-muted`, `text-accent`, `border-default` ya existen
  en `app/globals.css` (líneas ~40-44), están verificados — no hace falta crear nuevas clases.
- `ProjectDetail` ya es un Server Component `async` (usa `getTranslations` de
  `next-intl/server`); `next/image` funciona igual en Server Components, sin `"use client"`.
- No hace falta tocar `next.config.ts`: las imágenes son locales (`public/...`), Next.js 16 no
  exige `remotePatterns` ni `localPatterns` para rutas bajo `/public` servidas con `src="/..."`.
  `qualities` por defecto (`[75]`) es válido para `quality` no especificado (usa 75).
- El `key={img.src}` es único porque cada `src` es distinto dentro de la galería.
- Mantener el resto del archivo (`results`, `links`, `sections`, `summary`, `header`) sin
  cambios — solo se inserta el bloque anterior y el import de `Image`.

### 2.3 Ejecutar tests

`npm run test -- ProjectDetail` (o `npx vitest run components/sections/__tests__/ProjectDetail.test.tsx`)
y confirmar que **todos** los tests (los 7 existentes + los 2 nuevos) pasan.

---

## 3. Contenido: TFM — galería y sección "Aplicación web"

### 3.1 Copiar y renombrar las 9 capturas

Origen confirmado: `C:\Users\migue\Documents\Master DATCOM\TFM\images\` (9 archivos, verificados
con `ls`). Destino: `public/images/projects/tfm-sexism-classifier/` (no existe aún, crear).

Comandos PowerShell exactos (ejecutar desde cualquier cwd, usan rutas absolutas; usar comillas
dobles por los espacios en los nombres de origen):

```powershell
New-Item -ItemType Directory -Force -Path "c:\Users\migue\Documents\Proyectos\miguealguacil\public\images\projects\tfm-sexism-classifier"

$src = "C:\Users\migue\Documents\Master DATCOM\TFM\images"
$dst = "c:\Users\migue\Documents\Proyectos\miguealguacil\public\images\projects\tfm-sexism-classifier"

Copy-Item -Path (Join-Path $src "binary_results_diagram.png") -Destination (Join-Path $dst "binary-results-diagram.png")
Copy-Item -Path (Join-Path $src "LoginPage.png") -Destination (Join-Path $dst "login-page.png")
Copy-Item -Path (Join-Path $src "SexismDetectionTextPage - Results.png") -Destination (Join-Path $dst "sexism-detection-text.png")
Copy-Item -Path (Join-Path $src "SexismDetectionURLPage - Results.png") -Destination (Join-Path $dst "sexism-detection-url.png")
Copy-Item -Path (Join-Path $src "SexismDetectionDomain - Results.png") -Destination (Join-Path $dst "sexism-detection-domain.png")
Copy-Item -Path (Join-Path $src "AnalyticsGlobalPage.png") -Destination (Join-Path $dst "analytics-global.png")
Copy-Item -Path (Join-Path $src "DomainsPage.png") -Destination (Join-Path $dst "domains-list.png")
Copy-Item -Path (Join-Path $src "UrlsDomainPage.png") -Destination (Join-Path $dst "urls-domain.png")
Copy-Item -Path (Join-Path $src "URLAnalysis.png") -Destination (Join-Path $dst "url-analysis.png")

# Verificación: deben listarse 9 archivos
Get-ChildItem $dst
```

Si se prefiere ejecutar desde el Bash tool (Git Bash / POSIX), usar:

```bash
mkdir -p "/c/Users/migue/Documents/Proyectos/miguealguacil/public/images/projects/tfm-sexism-classifier"

SRC="/c/Users/migue/Documents/Master DATCOM/TFM/images"
DST="/c/Users/migue/Documents/Proyectos/miguealguacil/public/images/projects/tfm-sexism-classifier"

cp "$SRC/binary_results_diagram.png" "$DST/binary-results-diagram.png"
cp "$SRC/LoginPage.png" "$DST/login-page.png"
cp "$SRC/SexismDetectionTextPage - Results.png" "$DST/sexism-detection-text.png"
cp "$SRC/SexismDetectionURLPage - Results.png" "$DST/sexism-detection-url.png"
cp "$SRC/SexismDetectionDomain - Results.png" "$DST/sexism-detection-domain.png"
cp "$SRC/AnalyticsGlobalPage.png" "$DST/analytics-global.png"
cp "$SRC/DomainsPage.png" "$DST/domains-list.png"
cp "$SRC/UrlsDomainPage.png" "$DST/urls-domain.png"
cp "$SRC/URLAnalysis.png" "$DST/url-analysis.png"

ls -la "$DST"
```

Tras copiar, verificar que `git status` muestra los 9 archivos nuevos bajo
`public/images/projects/tfm-sexism-classifier/` (se añadirán al commit en el grupo 8).

### 3.2 `content/es/projects.ts` — sección "Aplicación web" + `detail.images`

Sobre la entrada `tfm-sexism-classifier` actual:

1. **Añadir** una nueva sección al array `detail.sections`, **después** de `Conclusiones`
   (última posición del array `sections`). Esto satisface el requisito ("después de
   Conclusiones") y, al renderizarse `sections` como bloque único antes de `results`/`images`,
   el orden visual completo será `summary → Datasets → Metodología → Conclusiones → Aplicación
   web → results → images → links`, que es el orden esperado por el spec (la sección "Aplicación
   web" aparece tras "Conclusiones", y la galería aparece después de `results`, como ya define
   el componente).

2. **Añadir** el campo `images` al objeto `detail` (mismo nivel que `sections`, `results`,
   `links`), con las 9 entradas en el orden de la tabla de mapeo.

Contenido exacto de la nueva sección "Aplicación web" (ES) — insertar como cuarto elemento del
array `sections`, después del objeto `Conclusiones`:

```ts
        {
          heading: 'Aplicación web',
          paragraphs: [
            'El modelo binario ModernBERT-base (entrenado sobre reduced_10k) se integró en una aplicación full-stack que demuestra su uso en un escenario real: un microservicio FastAPI con frontend React, persistencia en SQLite y autenticación JWT con tres roles — admin (gestión total de usuarios y roles), sexism_detection (lanzar y consultar análisis) y analytics (solo lectura de analíticas).',
            'El detector de sexismo ofrece tres modos de análisis: texto libre (segmentado en frases, con resultado global y por frase), URL (analiza el contenido textual de una página, con filtro opcional por etiqueta HTML) y dominio completo (respeta robots.txt, localiza el sitemap.xml, extrae las URLs indexables y ejecuta la inferencia en paralelo).',
            'El módulo de analíticas consolida los resultados en tres vistas: un dashboard global (URLs y frases analizadas, % de sexismo estimado, top-5 frases más sexistas e histograma de severidad), un listado de dominios analizados y un listado paginado de URLs por dominio con acceso al detalle frase a frase de cada una.',
            'Como prueba de concepto se analizó el portal principal de la Universidad de Granada (www.ugr.es): sobre 590 URLs y 12.643 frases, solo 22 frases (≈0,002%) se marcaron como sexistas, y la revisión manual confirmó que eran falsos positivos (frases que hablan sobre discriminación de género, no que la ejercen) — el resultado esperado para una web institucional, y una señal de que el modelo no sobre-etiqueta contenido de forma indiscriminada.',
          ],
        },
```

Contenido exacto de `detail.images` (ES) — añadir tras `results` (o tras `sections` si se
prefiere ese orden en el objeto literal; el render no depende del orden de claves):

```ts
      images: [
        {
          src: '/images/projects/tfm-sexism-classifier/binary-results-diagram.png',
          alt: 'Gráfico de barras comparando el F1 (macro) de cada modelo en los datasets EDOS, RedditBIAS y frases sintéticas',
          caption: 'Comparación de F1 (macro) por modelo y dataset en clasificación binaria',
          width: 3600,
          height: 1800,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/login-page.png',
          alt: 'Pantalla de inicio de sesión de la aplicación, con campos de usuario y contraseña',
          caption: 'Pantalla de inicio de sesión de la aplicación',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-text.png',
          alt: 'Resultado del análisis de un texto libre, con el porcentaje global de frases sexistas y el desglose frase a frase',
          caption: 'Análisis de un texto libre con resultado global y desglose frase a frase',
          width: 1920,
          height: 1228,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-url.png',
          alt: 'Resultado del análisis del contenido textual de una URL, con resumen global y detalle por frase',
          caption: 'Análisis del contenido textual de una URL',
          width: 1919,
          height: 1079,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-domain.png',
          alt: 'Resultado del análisis de un dominio completo, mostrando los sitemaps localizados y las URLs detectadas',
          caption: 'Análisis de un dominio completo a partir de su sitemap.xml',
          width: 1920,
          height: 1772,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/analytics-global.png',
          alt: 'Dashboard global de analíticas con URLs y frases analizadas, porcentaje de sexismo, top-5 frases más sexistas e histograma de severidad',
          caption:
            'Dashboard global de analíticas: URLs/frases analizadas, % de sexismo, top-5 frases, histograma de severidad',
          width: 1916,
          height: 939,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/domains-list.png',
          alt: 'Listado de dominios web analizados, con búsqueda y acceso al detalle de cada uno',
          caption: 'Listado de dominios analizados',
          width: 1920,
          height: 650,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/urls-domain.png',
          alt: 'Listado paginado de URLs de un dominio, con su porcentaje de sexismo y clasificación',
          caption: 'Listado paginado de URLs de un dominio con su clasificación',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/url-analysis.png',
          alt: 'Detalle frase a frase del análisis de una URL, con buscador y filtros por clasificación',
          caption: 'Detalle frase a frase del análisis de una URL',
          width: 1919,
          height: 945,
        },
      ],
```

**Resultado completo** del objeto `tfm-sexism-classifier.detail` en `content/es/projects.ts`
(para que `/opsx:apply` pueda hacer un `Edit` preciso, aquí está el bloque `detail: { ... }`
completo tras aplicar los cambios de 3.2 — sustituye íntegramente al `detail: { ... }` actual
de `tfm-sexism-classifier`):

```ts
    detail: {
      summary: [
        'El sexismo en redes sociales se manifiesta tanto de forma explícita como implícita, lo que dificulta su moderación automática: los sistemas actuales confunden a menudo el contenido sexista con publicaciones que simplemente lo denuncian o lo citan para criticarlo, y su rendimiento se degrada al pasar de un dominio (p. ej. Twitter) a otro (p. ej. foros o Reddit).',
        'Este TFM parte de la hipótesis de que un modelo tipo BERT ajustado específicamente para esta tarea (fine-tuning) puede ser competitivo, e incluso superior, frente a LLMs de propósito general usados en zero-shot o few-shot, incluso reduciendo de forma significativa el volumen de datos de entrenamiento.',
      ],
      sections: [
        {
          heading: 'Datasets',
          paragraphs: [
            'EDOS (SemEval-2023 Task 10): conjunto de datos de Reddit y Gab con entre 5.000 y 20.000 ejemplos etiquetados, usado en sus variantes binaria, de 3 clases y de 4 clases para evaluar distintos niveles de granularidad en la detección de sexismo.',
            'RedditBIAS: alrededor de 3.000 frases centradas en sesgo de género, empleado para evaluar la generalización del modelo a un dominio distinto al de entrenamiento.',
            'Conjunto de frases sintéticas: 15 frases diseñadas específicamente para el TFM, distribuidas en 3 clases, que permiten una validación cualitativa rápida del comportamiento del modelo ante casos límite.',
          ],
        },
        {
          heading: 'Metodología',
          paragraphs: [
            'Preprocesado de los datasets (limpieza de texto, balanceo de clases al 50/50 para evitar sesgos por desbalance) y división en conjuntos de entrenamiento, validación y test con proporciones 70/10/20.',
            'Búsqueda de hiperparámetros mediante grid search sobre 54 combinaciones (learning rate, batch size, número de épocas, etc.) para encontrar la configuración óptima de fine-tuning de los modelos BERT y ModernBERT.',
            'Evaluación de LLMs en few-shot prompting (k=6 ejemplos para clasificación binaria, k=12 para 4 clases) aplicando logits masking para restringir la salida del modelo a las clases válidas.',
            'Métricas de evaluación: F1 macro, precision, recall y accuracy, calculadas de forma consistente para todos los modelos y datasets.',
          ],
        },
        {
          heading: 'Conclusiones',
          paragraphs: [
            'El fine-tuning de modelos tipo BERT supera de forma consistente a los LLMs sin ajustar: incluso el mejor resultado obtenido con Mistral-7B-Instruct en few-shot (F1 = 0.413) queda más de 40 puntos porcentuales por debajo de los modelos ajustados.',
            'Reducir el conjunto de entrenamiento de EDOS de 20.000 a 10.000 ejemplos es viable: supone un ahorro de aproximadamente el 87% en horas de GPU con una pérdida de rendimiento de solo 4 puntos porcentuales de F1.',
            'Limitaciones identificadas: confusión entre contenido crítico/denuncia y contenido sexista, dificultad para detectar ironía y sarcasmo, y falta de evaluación en escenarios multilingües, que queda abierta como trabajo futuro.',
          ],
        },
        {
          heading: 'Aplicación web',
          paragraphs: [
            'El modelo binario ModernBERT-base (entrenado sobre reduced_10k) se integró en una aplicación full-stack que demuestra su uso en un escenario real: un microservicio FastAPI con frontend React, persistencia en SQLite y autenticación JWT con tres roles — admin (gestión total de usuarios y roles), sexism_detection (lanzar y consultar análisis) y analytics (solo lectura de analíticas).',
            'El detector de sexismo ofrece tres modos de análisis: texto libre (segmentado en frases, con resultado global y por frase), URL (analiza el contenido textual de una página, con filtro opcional por etiqueta HTML) y dominio completo (respeta robots.txt, localiza el sitemap.xml, extrae las URLs indexables y ejecuta la inferencia en paralelo).',
            'El módulo de analíticas consolida los resultados en tres vistas: un dashboard global (URLs y frases analizadas, % de sexismo estimado, top-5 frases más sexistas e histograma de severidad), un listado de dominios analizados y un listado paginado de URLs por dominio con acceso al detalle frase a frase de cada una.',
            'Como prueba de concepto se analizó el portal principal de la Universidad de Granada (www.ugr.es): sobre 590 URLs y 12.643 frases, solo 22 frases (≈0,002%) se marcaron como sexistas, y la revisión manual confirmó que eran falsos positivos (frases que hablan sobre discriminación de género, no que la ejercen) — el resultado esperado para una web institucional, y una señal de que el modelo no sobre-etiqueta contenido de forma indiscriminada.',
          ],
        },
      ],
      results: [
        { label: 'F1 (ModernBERT-base, EDOS-10k)', value: '0.843' },
        { label: 'Recall (ModernBERT-base, EDOS-10k)', value: '0.853' },
        { label: 'Accuracy (ModernBERT-base, EDOS-10k)', value: '0.843' },
        { label: 'F1 (bert-base-uncased, EDOS-10k)', value: '0.836' },
        { label: 'F1 (bert-base-uncased, EDOS-20k)', value: '0.7876' },
        { label: 'F1 (Mistral-7B-Instruct, few-shot)', value: '0.413' },
        { label: 'F1 (frases sintéticas, BERT)', value: '0.95-0.96' },
      ],
      images: [
        {
          src: '/images/projects/tfm-sexism-classifier/binary-results-diagram.png',
          alt: 'Gráfico de barras comparando el F1 (macro) de cada modelo en los datasets EDOS, RedditBIAS y frases sintéticas',
          caption: 'Comparación de F1 (macro) por modelo y dataset en clasificación binaria',
          width: 3600,
          height: 1800,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/login-page.png',
          alt: 'Pantalla de inicio de sesión de la aplicación, con campos de usuario y contraseña',
          caption: 'Pantalla de inicio de sesión de la aplicación',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-text.png',
          alt: 'Resultado del análisis de un texto libre, con el porcentaje global de frases sexistas y el desglose frase a frase',
          caption: 'Análisis de un texto libre con resultado global y desglose frase a frase',
          width: 1920,
          height: 1228,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-url.png',
          alt: 'Resultado del análisis del contenido textual de una URL, con resumen global y detalle por frase',
          caption: 'Análisis del contenido textual de una URL',
          width: 1919,
          height: 1079,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-domain.png',
          alt: 'Resultado del análisis de un dominio completo, mostrando los sitemaps localizados y las URLs detectadas',
          caption: 'Análisis de un dominio completo a partir de su sitemap.xml',
          width: 1920,
          height: 1772,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/analytics-global.png',
          alt: 'Dashboard global de analíticas con URLs y frases analizadas, porcentaje de sexismo, top-5 frases más sexistas e histograma de severidad',
          caption:
            'Dashboard global de analíticas: URLs/frases analizadas, % de sexismo, top-5 frases, histograma de severidad',
          width: 1916,
          height: 939,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/domains-list.png',
          alt: 'Listado de dominios web analizados, con búsqueda y acceso al detalle de cada uno',
          caption: 'Listado de dominios analizados',
          width: 1920,
          height: 650,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/urls-domain.png',
          alt: 'Listado paginado de URLs de un dominio, con su porcentaje de sexismo y clasificación',
          caption: 'Listado paginado de URLs de un dominio con su clasificación',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/url-analysis.png',
          alt: 'Detalle frase a frase del análisis de una URL, con buscador y filtros por clasificación',
          caption: 'Detalle frase a frase del análisis de una URL',
          width: 1919,
          height: 945,
        },
      ],
      links: [
        {
          label: 'Memoria (PDF)',
          url: 'https://github.com/migue0418/TFM-Miguel-Angel/blob/main/TFM%20-%20LLMs%20para%20detecci%C3%B3n%20autom%C3%A1tica%20de%20lenguaje%20sexista%20en%20redes%20sociales.pdf',
        },
      ],
    },
```

### 3.3 `content/en/projects.ts` — equivalente en inglés

Sustituir íntegramente el bloque `detail: { ... }` de `tfm-sexism-classifier` en
`content/en/projects.ts` por el siguiente (mismas claves `src`/dimensiones, `sections` y
`results` ya existentes sin cambios salvo la nueva sección "Web Application" y el nuevo campo
`images`):

```ts
    detail: {
      summary: [
        'Sexism on social media shows up both explicitly and implicitly, which makes automatic moderation hard: current systems often confuse sexist content with posts that simply report or criticize it, and performance drops sharply when moving from one domain (e.g. Twitter) to another (e.g. forums or Reddit).',
        'This thesis starts from the hypothesis that a BERT-style model fine-tuned specifically for this task can be competitive with, or even outperform, general-purpose LLMs used in zero-shot or few-shot settings, even when the training data is significantly reduced.',
      ],
      sections: [
        {
          heading: 'Datasets',
          paragraphs: [
            'EDOS (SemEval-2023 Task 10): a Reddit and Gab dataset with 5,000 to 20,000 labeled examples, used in its binary, 3-class, and 4-class variants to evaluate different levels of granularity in sexism detection.',
            'RedditBIAS: around 3,000 sentences focused on gender bias, used to evaluate how well the model generalizes to a domain different from the one it was trained on.',
            'Synthetic sentence set: 15 sentences designed specifically for this thesis, spread across 3 classes, enabling a quick qualitative check of model behaviour on edge cases.',
          ],
        },
        {
          heading: 'Methodology',
          paragraphs: [
            'Preprocessing of the datasets (text cleaning, balancing classes 50/50 to avoid bias from class imbalance) and splitting into training, validation, and test sets with a 70/10/20 ratio.',
            'Hyperparameter search via a grid search over 54 combinations (learning rate, batch size, number of epochs, etc.) to find the optimal fine-tuning configuration for the BERT and ModernBERT models.',
            'Evaluation of LLMs via few-shot prompting (k=6 examples for binary classification, k=12 for 4-class classification) using logits masking to restrict model output to valid classes.',
            'Evaluation metrics: macro F1, precision, recall, and accuracy, computed consistently across all models and datasets.',
          ],
        },
        {
          heading: 'Conclusions',
          paragraphs: [
            'Fine-tuned BERT-style models consistently outperform un-tuned LLMs: even the best result obtained with Mistral-7B-Instruct in few-shot (F1 = 0.413) is more than 40 percentage points below the fine-tuned models.',
            'Reducing the EDOS training set from 20,000 to 10,000 examples is viable: it saves roughly 87% of GPU-hours at the cost of only 4 percentage points of F1.',
            'Identified limitations: confusion between critical/reporting content and sexist content, difficulty detecting irony and sarcasm, and the lack of multilingual evaluation, which remains open as future work.',
          ],
        },
        {
          heading: 'Web Application',
          paragraphs: [
            'The binary ModernBERT-base model (trained on reduced_10k) was integrated into a full-stack application that demonstrates its use in a real scenario: a FastAPI microservice with a React frontend, SQLite persistence, and JWT authentication with three roles — admin (full management of users and roles), sexism_detection (run and view analyses), and analytics (read-only access to analytics).',
            'The sexism detector offers three analysis modes: free text (split into sentences, with an overall result and a per-sentence breakdown), URL (analyzes the text content of a page, with an optional filter by HTML tag), and full domain (respects robots.txt, locates the sitemap.xml, extracts indexable URLs, and runs inference on them in parallel).',
            'The analytics module consolidates results in three views: a global dashboard (analyzed URLs and sentences, estimated sexism %, top-5 most sexist sentences, and a severity histogram), a list of analyzed domains, and a paginated list of URLs per domain with access to the sentence-by-sentence detail of each one.',
            "As a proof of concept, the University of Granada's main portal (www.ugr.es) was analyzed: across 590 URLs and 12,643 sentences, only 22 sentences (≈0.002%) were flagged as sexist, and manual review confirmed they were false positives (sentences talking about gender discrimination, not perpetrating it) — the expected result for an institutional website, and a sign that the model does not over-flag content indiscriminately.",
          ],
        },
      ],
      results: [
        { label: 'F1 (ModernBERT-base, EDOS-10k)', value: '0.843' },
        { label: 'Recall (ModernBERT-base, EDOS-10k)', value: '0.853' },
        { label: 'Accuracy (ModernBERT-base, EDOS-10k)', value: '0.843' },
        { label: 'F1 (bert-base-uncased, EDOS-10k)', value: '0.836' },
        { label: 'F1 (bert-base-uncased, EDOS-20k)', value: '0.7876' },
        { label: 'F1 (Mistral-7B-Instruct, few-shot)', value: '0.413' },
        { label: 'F1 (synthetic sentences, BERT)', value: '0.95-0.96' },
      ],
      images: [
        {
          src: '/images/projects/tfm-sexism-classifier/binary-results-diagram.png',
          alt: 'Bar chart comparing macro F1 across models on the EDOS, RedditBIAS, and synthetic-sentence datasets',
          caption: 'F1 (macro) comparison by model and dataset in binary classification',
          width: 3600,
          height: 1800,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/login-page.png',
          alt: 'Application login screen with username and password fields',
          caption: 'Application login screen',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-text.png',
          alt: 'Free-text analysis result showing the overall percentage of sexist sentences and a per-sentence breakdown',
          caption: 'Free-text analysis with overall result and per-sentence breakdown',
          width: 1920,
          height: 1228,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-url.png',
          alt: "Analysis result of a URL's text content, with an overall summary and per-sentence detail",
          caption: "Text content analysis of a URL",
          width: 1919,
          height: 1079,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-domain.png',
          alt: 'Analysis result of a full domain, showing the located sitemaps and the detected URLs',
          caption: 'Full domain analysis from its sitemap.xml',
          width: 1920,
          height: 1772,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/analytics-global.png',
          alt: 'Global analytics dashboard with analyzed URLs and sentences, sexism percentage, top-5 most sexist sentences, and a severity histogram',
          caption:
            'Global analytics dashboard: analyzed URLs/sentences, sexism %, top-5 sentences, severity histogram',
          width: 1916,
          height: 939,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/domains-list.png',
          alt: 'List of analyzed websites with search and access to each domain detail',
          caption: 'List of analyzed domains',
          width: 1920,
          height: 650,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/urls-domain.png',
          alt: 'Paginated list of URLs for a domain with their sexism percentage and classification',
          caption: 'Paginated list of URLs for a domain with their classification',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/url-analysis.png',
          alt: "Sentence-by-sentence detail of a URL's analysis, with search and classification filters",
          caption: "Sentence-by-sentence detail of a URL's analysis",
          width: 1919,
          height: 945,
        },
      ],
      links: [
        {
          label: 'Thesis (PDF)',
          url: 'https://github.com/migue0418/TFM-Miguel-Angel/blob/main/TFM%20-%20LLMs%20para%20detecci%C3%B3n%20autom%C3%A1tica%20de%20lenguaje%20sexista%20en%20redes%20sociales.pdf',
        },
      ],
    },
```

---

## 4. Contenido: Minecraft Butler AI — detail completo y corrección de `description`

### 4.1 Corrección de `description`

`content/es/projects.ts`, entrada `minecraft-butler-ai`, sustituir el campo `description`
actual:

```ts
    description:
      'Agente LLM integrado en Minecraft a través de un mod personalizado. El backend gestiona el contexto del juego en tiempo real mediante WebSocket y ejecuta acciones dentro del mundo usando LangGraph.',
```

por:

```ts
    description:
      'Agente LLM integrado en Minecraft a través de un mod personalizado. El backend, con autenticación JWT, expone un agente LangGraph con RAG que entiende el contexto del juego y decide y ejecuta acciones dentro del mundo.',
```

`content/en/projects.ts`, entrada `minecraft-butler-ai`, sustituir:

```ts
    description:
      'LLM agent integrated into Minecraft through a custom mod. The backend manages in-game context in real time via WebSocket and executes actions inside the world using LangGraph.',
```

por:

```ts
    description:
      'LLM agent integrated into Minecraft through a custom mod. The JWT-authenticated backend exposes a LangGraph agent with RAG that understands the game context and decides and executes actions inside the world.',
```

Nota: se elimina `WebSocket` también del array `stack` solo si así se decide en una propuesta
futura — **este cambio NO modifica `stack`** (el spec no lo pide y `stack` sigue incluyendo
`'WebSocket'` en ambos archivos). Si se quisiera coherencia total se podría discutir aparte; no
tocarlo aquí para mantener el alcance acotado a lo especificado.

### 4.2 `content/es/projects.ts` — `detail` completo de `minecraft-butler-ai`

La entrada `minecraft-butler-ai` actualmente no tiene `detail`. Añadir el campo `detail`
**después** de `featured: true,` (último campo del objeto), de forma que el objeto completo de
`minecraft-butler-ai` quede:

```ts
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'Agente LLM integrado en Minecraft a través de un mod personalizado. El backend, con autenticación JWT, expone un agente LangGraph con RAG que entiende el contexto del juego y decide y ejecuta acciones dentro del mundo.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'RAG', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
    detail: {
      summary: [
        'MinecraftButlerAI es un backend FastAPI que da vida a un mayordomo ("Alfred") dentro de Minecraft: entiende preguntas en lenguaje natural —por texto o por voz—, responde con conocimiento real del juego y ejecuta acciones en el mundo. No es "una llamada a un LLM": es una arquitectura agéntica donde cada pieza resuelve un problema concreto, desde el enrutado de intenciones hasta la recuperación de conocimiento y la síntesis de voz.',
        'El butler combina un agente LangGraph con memoria persistente, un sistema RAG multilingüe sobre la documentación del juego y un pipeline de voz local, todo ello expuesto mediante una API HTTP autenticada con JWT y pensada para producción (rate-limiting, migraciones, observabilidad).',
      ],
      sections: [
        {
          heading: 'Arquitectura del agente',
          paragraphs: [
            'El butler se modela como un grafo de nodos con LangGraph: un primer nodo clasifica la intención del usuario y el grafo enruta de forma determinista (un diccionario intención → nodo, no "magia del LLM") a una de tres ramas: responder una pregunta con RAG, moverse a unas coordenadas o conversar.',
            'El estado del grafo (ButlerState) es un TypedDict tipado cuyo campo de mensajes usa el reducer add_messages de LangGraph, lo que acumula el historial automáticamente. El grafo se compila una sola vez (singleton protegido con asyncio.Lock) con un checkpointer AsyncRedisSaver: cada sesión persiste su estado en Redis con TTL, dando memoria conversacional multi-turno por jugador sin gestión adicional en el cliente.',
            'La clasificación de intención usa Claude Haiku 4.5 (rápido y barato) con structured output (un objeto Pydantic validado, no texto libre a parsear), mientras que la respuesta final usa Claude Sonnet 4.6. Ambos modelos se obtienen a través de un factory que abstrae por rol ("clasificador"/"respondedor") y por proveedor (Anthropic u OpenAI), de forma que el código pide capacidades, no modelos concretos.',
          ],
        },
        {
          heading: 'RAG multilingüe',
          paragraphs: [
            'El conocimiento del juego se indexa en inglés a partir de PrismarineJS/minecraft-data y extractos de la Minecraft Wiki, pero los usuarios preguntan en español. Para resolver ese salto de idioma se usan embeddings cross-lingual densos (paraphrase-multilingual-MiniLM-L12-v2) con búsqueda por similitud coseno en Qdrant.',
            'El diseño original incluía un pipeline híbrido completo (rama sparse BM42 + reranker FlashRank), que se descartó tras validar con datos reales: ambos componentes son léxicos y solo-inglés, por lo que con consultas en español el sparse devolvía ruido y el reranker no sabía reordenar resultados ES→EN. La conclusión, medida y documentada en el código, es que el denso multilingüe es superior por sí solo en ambos idiomas.',
            'Para las mecánicas de la wiki se usa Parent Document Retrieval: se indexan chunks pequeños (~800 caracteres) que producen embeddings precisos, pero se recupera y se pasa al LLM el bloque padre completo (~2000 caracteres), resolviendo la tensión entre precisión de recuperación y suficiencia de contexto.',
          ],
        },
        {
          heading: 'Voz y producción',
          paragraphs: [
            'La respuesta se emite por Server-Sent Events frase a frase (no token a token), porque el cliente la sintetiza por voz (TTS) y un TTS necesita frases completas para sonar natural; esto da percepción de inmediatez sin trocear el audio.',
            'La transcripción de voz se realiza on-device con faster-whisper en cuantización int8 (más rápido y con la mitad de memoria que float32, sin pérdida apreciable), con el modelo precalentado en el arranque para evitar cold-start y sin enviar el audio del usuario a terceros.',
            'El backend está pensado para producción: autenticación JWT con roles, rate-limiting con SlowAPI, migraciones Alembic, arquitectura por slices (router/schemas/service/repository) y observabilidad opcional de cada ejecución del agente con LangSmith.',
          ],
        },
      ],
      links: [
        {
          label: 'Arquitectura técnica',
          url: 'https://github.com/migue0418/minecraft-butler-ai-backend/blob/main/ARCHITECTURE.md',
        },
      ],
    },
  },
```

(Sin `detail.results` — no aplica.)

### 4.3 `content/en/projects.ts` — equivalente en inglés

Añadir el mismo campo `detail` a la entrada `minecraft-butler-ai` de `content/en/projects.ts`:

```ts
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'LLM agent integrated into Minecraft through a custom mod. The JWT-authenticated backend exposes a LangGraph agent with RAG that understands the game context and decides and executes actions inside the world.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'RAG', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
    detail: {
      summary: [
        'MinecraftButlerAI is a FastAPI backend that brings a butler ("Alfred") to life inside Minecraft: it understands natural-language questions —by text or by voice—, answers with real game knowledge, and executes in-world actions. It is not "a single LLM call": it is an agentic architecture where each piece solves a concrete problem, from intent routing to knowledge retrieval and voice synthesis.',
        'The butler combines a LangGraph agent with persistent memory, a multilingual RAG system over the game documentation, and a local voice pipeline, all exposed through a JWT-authenticated HTTP API designed for production (rate-limiting, migrations, observability).',
      ],
      sections: [
        {
          heading: 'Agent architecture',
          paragraphs: [
            'The butler is modeled as a graph of nodes with LangGraph: a first node classifies the user\'s intent and the graph deterministically routes (a plain intent → node dictionary, not "LLM magic") to one of three branches: answer a question with RAG, move to a set of coordinates, or chat.',
            'The graph state (ButlerState) is a typed TypedDict whose messages field uses LangGraph\'s add_messages reducer, which accumulates history automatically. The graph compiles once (a singleton guarded by an asyncio.Lock) with an AsyncRedisSaver checkpointer: each session persists its state in Redis with a TTL, giving multi-turn conversational memory per player without any client-side management.',
            'Intent classification runs on Claude Haiku 4.5 (fast and cheap) using structured output (a validated Pydantic object, not free text to parse), while the final answer uses Claude Sonnet 4.6. Both models are obtained through a factory that abstracts by role ("classifier"/"responder") and by provider (Anthropic or OpenAI), so the code asks for capabilities, not concrete models.',
          ],
        },
        {
          heading: 'Multilingual RAG',
          paragraphs: [
            'Game knowledge is indexed in English from PrismarineJS/minecraft-data and Minecraft Wiki extracts, but users ask in Spanish. To bridge that language gap, dense cross-lingual embeddings (paraphrase-multilingual-MiniLM-L12-v2) are used with cosine-similarity search in Qdrant.',
            'The original design included a full hybrid pipeline (a sparse BM42 branch + a FlashRank reranker), which was dropped after validating with real data: both components are lexical and English-only, so with Spanish queries the sparse branch returned noise and the reranker could not reorder ES→EN results. The measured conclusion, documented in the code, is that dense multilingual retrieval alone is superior in both languages.',
            'For wiki mechanics, Parent Document Retrieval is used: small chunks (~800 characters) are indexed for precise embeddings, but the full parent block (~2000 characters) is retrieved and passed to the LLM, resolving the tension between retrieval precision and context sufficiency.',
          ],
        },
        {
          heading: 'Voice & production',
          paragraphs: [
            'The response is streamed over Server-Sent Events sentence by sentence (not token by token), because the client synthesizes it as speech (TTS) and a TTS needs complete sentences to sound natural; this gives a sense of immediacy without chopping the audio.',
            'Voice transcription runs on-device with faster-whisper in int8 quantization (faster and using half the memory of float32, with no noticeable quality loss), with the model pre-warmed at startup to avoid cold-start and without ever sending the user\'s audio to third parties.',
            'The backend is built for production: JWT authentication with roles, rate-limiting with SlowAPI, Alembic migrations, slice architecture (router/schemas/service/repository), and optional per-run observability of the agent with LangSmith.',
          ],
        },
      ],
      links: [
        {
          label: 'Technical architecture',
          url: 'https://github.com/migue0418/minecraft-butler-ai-backend/blob/main/ARCHITECTURE.md',
        },
      ],
    },
  },
```

(Sin `detail.results`.)

---

## 5. Contenido: FastAPI + React Template — `detail` completo

### 5.1 `content/es/projects.ts`

La entrada `fastapi-react-template` actualmente no tiene `detail`. Añadir el campo `detail`
después de `featured: true,`, quedando el objeto completo:

```ts
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Plantilla full stack con SDD y buenas prácticas de desarrollo. Incluye pre-commit hooks, Git Flow, Docker y estructura modular para proyectos de producción.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
    detail: {
      summary: [
        'Plantilla full-stack lista para producción: backend FastAPI con SQLAlchemy async, Alembic y autenticación JWT con roles, frontend React + TypeScript + Vite, y despliegue con Docker Compose detrás de Caddy como reverse proxy. Incluye, además, un flujo de Spec-Driven Development (OpenSpec) integrado desde el primer commit.',
        'El objetivo es arrancar cualquier proyecto nuevo con una base sólida —autenticación, gestión de usuarios y roles, arquitectura modular, migraciones, pre-commit hooks y documentación versionada— en lugar de reconstruir esa infraestructura desde cero en cada proyecto.',
      ],
      sections: [
        {
          heading: 'Arquitectura por slices',
          paragraphs: [
            'Tanto el backend como el frontend organizan el código por funcionalidad ("slice") en lugar de por capa técnica: cada feature del backend vive en app/features/<feature>/ con sus archivos router.py, schemas.py, service.py, repository.py y, si aplica, models.py; cada feature del frontend vive en src/features/<feature>/ con api.ts, types.ts y los componentes de página.',
            'Esta organización mantiene cada funcionalidad autocontenida y fácil de localizar, y facilita que un cambio (p. ej. añadir un nuevo recurso) toque un conjunto acotado y predecible de archivos en ambos lados.',
            'Al añadir un modelo SQLAlchemy nuevo, se importa en core/database.py::import_model_modules y se genera la migración correspondiente con Alembic (alembic revision --autogenerate seguido de alembic upgrade head), de forma que el esquema de base de datos queda siempre versionado junto al código.',
          ],
        },
        {
          heading: 'Autenticación y roles',
          paragraphs: [
            'La autenticación combina un access token JWT de corta duración (15 minutos) con un refresh token almacenado en una cookie HTTP-only, y las contraseñas se almacenan con hash argon2 (vía pwdlib).',
            'Los roles se modelan con una relación muchos-a-muchos entre User y Role a través de la tabla de unión user_roles, lo que permite asignar varios roles a un mismo usuario y reutilizar la misma tabla de roles para distintas políticas de acceso.',
            'La plantilla incluye reglas de negocio listas para producción: el username es único (un intento de duplicado devuelve 409) y existe protección de "último admin" — no se puede eliminar, desactivar ni degradar al último usuario administrador activo del sistema.',
          ],
        },
        {
          heading: 'Spec-Driven Development integrado',
          paragraphs: [
            'La plantilla incorpora un flujo completo de Spec-Driven Development basado en OpenSpec: /opsx:explore para aclarar una idea, /opsx:propose para generar la propuesta y sus artefactos (specs, design, tasks), un plan técnico a nivel de archivos antes de implementar, /opsx:apply para ejecutar las tareas y /opsx:archive para fusionar las especificaciones al cerrar el cambio.',
            'Incluye agentes especializados (backend-developer, frontend-developer, product-strategy-analyst) y skills reutilizables (openspec-*, enrich-us, write-pr-report) que automatizan pasos recurrentes del ciclo de desarrollo, desde la redacción de historias de usuario hasta la apertura del pull request.',
            'La documentación del proyecto está versionada junto al código en docs/ (development_guide.md, base-standards.md, frontend-standards.md, backend-standards.md, data-model.md, entre otros), de forma que las convenciones y el modelo de datos evolucionan en el mismo repositorio y bajo el mismo control de cambios que la aplicación.',
          ],
        },
      ],
    },
  },
```

(Sin `detail.results` ni `detail.links`.)

### 5.2 `content/en/projects.ts`

Añadir el mismo campo `detail` a `fastapi-react-template`:

```ts
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Full stack template with SDD and development best practices. Includes pre-commit hooks, Git Flow, Docker, and modular structure for production projects.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
    detail: {
      summary: [
        'A production-ready full-stack template: a FastAPI backend with async SQLAlchemy, Alembic, and role-based JWT authentication, a React + TypeScript + Vite frontend, and deployment via Docker Compose behind Caddy as a reverse proxy. It also ships with a Spec-Driven Development (OpenSpec) workflow built in from the first commit.',
        'The goal is to start any new project on a solid foundation —authentication, user and role management, modular architecture, migrations, pre-commit hooks, and versioned documentation— instead of rebuilding that infrastructure from scratch every time.',
      ],
      sections: [
        {
          heading: 'Slice architecture',
          paragraphs: [
            'Both the backend and the frontend organize code by feature ("slice") rather than by technical layer: each backend feature lives in app/features/<feature>/ with its router.py, schemas.py, service.py, repository.py, and, when needed, models.py files; each frontend feature lives in src/features/<feature>/ with api.ts, types.ts, and its page components.',
            'This organization keeps each feature self-contained and easy to locate, and makes it predictable which files a change (e.g. adding a new resource) will touch on either side.',
            'When a new SQLAlchemy model is added, it is imported in core/database.py::import_model_modules and the corresponding migration is generated with Alembic (alembic revision --autogenerate followed by alembic upgrade head), so the database schema stays versioned alongside the code.',
          ],
        },
        {
          heading: 'Auth & roles',
          paragraphs: [
            'Authentication combines a short-lived JWT access token (15 minutes) with a refresh token stored in an HTTP-only cookie, and passwords are stored using argon2 hashing (via pwdlib).',
            'Roles are modeled as a many-to-many relationship between User and Role through the user_roles join table, allowing a single user to hold multiple roles and reusing the same roles table for different access policies.',
            'The template ships with production-ready business rules: usernames are unique (a duplicate attempt returns 409) and a "last admin" safeguard prevents deleting, deactivating, or demoting the last active admin user in the system.',
          ],
        },
        {
          heading: 'Built-in Spec-Driven Development',
          paragraphs: [
            'The template includes a complete Spec-Driven Development workflow based on OpenSpec: /opsx:explore to clarify an idea, /opsx:propose to generate the proposal and its artifacts (specs, design, tasks), a file-level technical plan before implementing, /opsx:apply to execute the tasks, and /opsx:archive to merge the specs when closing the change.',
            'It includes specialized agents (backend-developer, frontend-developer, product-strategy-analyst) and reusable skills (openspec-*, enrich-us, write-pr-report) that automate recurring steps of the development cycle, from drafting user stories to opening the pull request.',
            'Project documentation is versioned alongside the code in docs/ (development_guide.md, base-standards.md, frontend-standards.md, backend-standards.md, data-model.md, among others), so conventions and the data model evolve in the same repository and under the same change control as the application.',
          ],
        },
      ],
    },
  },
```

(Sin `detail.results` ni `detail.links`.)

---

## 6. Verificación (OBLIGATORIO)

Ejecutar, en este orden, desde la raíz del repo:

```powershell
npm run lint
npm run test
npm run build
```

O combinados (como indica `tasks.md` / `CLAUDE.md`):

```powershell
npm run lint && npm run test && npm run build
```

Atención especial a:

- `npm run lint`: comprobará que `next/image` se usa correctamente (regla
  `@next/next/no-img-element` no debería dispararse porque se usa `Image`, no `<img>`) y que el
  JSON de `messages/{es,en}.json` sigue siendo válido (afecta a la carga de next-intl).
- `npm run test`: deben pasar los 9 tests de `ProjectDetail.test.tsx` (7 existentes + 2 nuevos)
  y el resto de la suite sin regresiones.
- `npm run build`: es un build SSG — confirmar que `generateStaticParams` en
  `app/[locale]/proyectos/[projectId]/page.tsx` sigue generando las 6 páginas (3 proyectos × 2
  locales) sin error, y que el build de Next.js no falla al optimizar las 9 imágenes nuevas
  (Next.js no las pre-optimiza en build de SSG normal — la optimización ocurre on-demand en
  Vercel; `next build` solo valida que los archivos `src` referenciados por `next/image` con
  rutas locales existen bajo `public/`, lo cual estará garantizado tras el paso 3.1).

Si `npm run lint` reporta algo sobre el orden de imports (`next/image` vs otros), reordenar
siguiendo el estilo ya usado en el archivo (imports de librerías externas primero, luego alias
`@/...`).

---

## 7. E2E Playwright MCP (OBLIGATORIO — el agente lo ejecuta)

1. Arrancar el servidor de desarrollo: `npm run dev` (puerto por defecto 3000, confirmar con
   la salida del comando).

2. **`/proyectos/minecraft-butler-ai`** (ES):
   - Verificar que el resumen ampliado (`detail.summary`, 2 párrafos) se muestra bajo la
     cabecera.
   - Verificar, en orden, las 3 secciones: "Arquitectura del agente", "RAG multilingüe", "Voz y
     producción", cada una con sus 3 párrafos.
   - Verificar que **no** aparece la sección "Resultados".
   - Verificar que bajo "Enlaces" aparece un enlace "Arquitectura técnica" con `target="_blank"`
     apuntando a
     `https://github.com/migue0418/minecraft-butler-ai-backend/blob/main/ARCHITECTURE.md`.
   - Verificar que la cabecera sigue mostrando los enlaces "Backend" y "Mod" (de `repoUrls`).

3. **`/proyectos/fastapi-react-template`** (ES):
   - Verificar el resumen ampliado (2 párrafos).
   - Verificar, en orden, las 3 secciones: "Arquitectura por slices", "Autenticación y roles",
     "Spec-Driven Development integrado".
   - Verificar que **no** aparecen las secciones "Resultados" ni "Enlaces".
   - Verificar que la cabecera muestra únicamente "Ver repositorio" (de `repoUrl`).

4. **`/proyectos/tfm-sexism-classifier`** (ES):
   - Verificar que, tras "Conclusiones", aparece la nueva sección "Aplicación web" con sus 4
     párrafos.
   - Verificar la sección "Capturas" con las 9 imágenes, en este orden: gráfico de resultados →
     login → texto → URL → dominio → analíticas global → dominios → URLs de dominio → análisis
     de URL.
   - Verificar que cada imagen tiene su `caption` visible debajo (excepto si alguna no lo
     tuviera — en este cambio todas las 9 tienen `caption`).
   - Verificar que las imágenes no aparecen recortadas (relación de aspecto correcta — la
     primera imagen, `binary-results-diagram.png`, es muy ancha 3600×1800 y debe verse completa
     a ancho de contenedor).
   - Verificar que la sección "Resultados" (7 métricas) sigue apareciendo, **antes** de
     "Capturas".

5. **Repetir 2–4 en inglés** (`/en/proyectos/minecraft-butler-ai`,
   `/en/proyectos/fastapi-react-template`, `/en/proyectos/tfm-sexism-classifier`):
   - Mismas verificaciones, comprobando los textos en inglés: "Agent architecture",
     "Multilingual RAG", "Voice & production"; "Slice architecture", "Auth & roles", "Built-in
     Spec-Driven Development"; "Web Application" y sección "Screenshots" con captions en inglés.

6. **ThemeToggle** en `/proyectos/tfm-sexism-classifier`:
   - Activar el toggle de tema (claro → oscuro y viceversa) con la galería visible.
   - Verificar que los `border-default`/`text-muted`/`bg-surface` de las figuras y captions se
     adaptan correctamente al tema oscuro (sin contraste roto, sin bordes invisibles).

7. **Animaciones / rendimiento**:
   - Verificar que `StaggerChildren` anima la entrada de las imágenes de la galería al hacer
     scroll (aparición progresiva) sin bloquear el render inicial de la página (el `summary` y
     el `header` deben aparecer inmediatamente, antes de que la galería entre en el viewport).
   - Confirmar visualmente que no hay layout shift apreciable al cargar las imágenes (gracias a
     `width`/`height` reales pasados a `next/image`).

Usar `browser_navigate`, `browser_snapshot`, `browser_click` (para el ThemeToggle y el
LocaleToggle) y, si es necesario, `browser_take_screenshot` para capturar evidencia de la
galería en ambos temas.

---

## 8. Cierre (OBLIGATORIO)

### 8.1 Consistencia ES/EN

Revisar manualmente (o con un script rápido) que:
- `content/es/projects.ts` y `content/en/projects.ts` tienen exactamente las mismas claves
  (`detail.sections[].heading` en el mismo orden — aunque traducido—, mismo número de
  `paragraphs` por sección, mismas 9 entradas de `images` con idénticos `src`/`width`/`height`
  en ambos archivos).
- `messages/es.json` y `messages/en.json` tienen la misma clave nueva `projectDetail.screenshots`.

### 8.2 Informe de verificación

Crear `openspec/changes/enrich-project-details/reports/2026-06-12-verification.md` con:
- Comandos ejecutados (`npm run lint`, `npm run test`, `npm run build`) y su resultado (éxito,
  número de tests pasados).
- Resumen del recorrido E2E (grupo 7) en ES y EN, con notas sobre el ThemeToggle y las
  animaciones.
- Capturas de pantalla relevantes (si Playwright MCP las generó), referenciadas por ruta.

### 8.3 Commit, push y actualización del PR #3

- Hacer `git add` de los archivos modificados/creados:
  - `lib/types.ts`
  - `messages/es.json`, `messages/en.json`
  - `components/sections/ProjectDetail.tsx`
  - `components/sections/__tests__/ProjectDetail.test.tsx`
  - `content/es/projects.ts`, `content/en/projects.ts`
  - `public/images/projects/tfm-sexism-classifier/*.png` (9 archivos)
  - `openspec/changes/enrich-project-details/reports/2026-06-12-verification.md`
- Crear un commit (mensaje en línea con el estilo de commits recientes del repo, p.ej. tipo
  `feat:`/`content:` — ver `git log` para el tono exacto), **sin** `--no-verify`.
- Hacer `git push` a `feature/project-detail-pages` (la rama ya tiene upstream configurado, por
  lo que `git push` sin flags adicionales debería bastar).
- Actualizar la descripción del PR #3 con `gh pr edit 3 --body "..."` usando la skill
  `write-pr-report` para reflejar el alcance combinado de `project-detail-pages` +
  `enrich-project-details` (páginas de detalle de proyecto + galería de capturas + secciones
  enriquecidas para los 3 proyectos + corrección de `description` de Minecraft Butler AI).
  **No** ejecutar `gh pr create` — el PR #3 ya existe.

---

## Resumen de archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `lib/types.ts` | Modificar — nueva interfaz `ProjectDetailImage`, campo `ProjectDetail.images?` |
| `messages/es.json` | Modificar — añadir `projectDetail.screenshots` |
| `messages/en.json` | Modificar — añadir `projectDetail.screenshots` |
| `components/sections/ProjectDetail.tsx` | Modificar — import `next/image` + nueva sección de galería |
| `components/sections/__tests__/ProjectDetail.test.tsx` | Modificar — mock `next/image`, fixture `projectWithImages`, 2 tests nuevos |
| `content/es/projects.ts` | Modificar — `minecraft-butler-ai` (`description` + `detail`), `tfm-sexism-classifier` (`detail.sections` + `detail.images`), `fastapi-react-template` (`detail`) |
| `content/en/projects.ts` | Modificar — equivalente en inglés |
| `public/images/projects/tfm-sexism-classifier/*.png` (9 archivos) | Nuevos — copiados/renombrados desde el repo del TFM |
| `openspec/changes/enrich-project-details/reports/2026-06-12-verification.md` | Nuevo — informe de verificación |

No se modifican: `app/[locale]/proyectos/[projectId]/page.tsx` (no requiere cambios — sigue
iterando sobre `getProjects(locale)` y `generateStaticParams` ya cubre los 3 proyectos),
`next.config.ts` (no requiere `remotePatterns`/`localPatterns` para imágenes locales en
`public/`), `lib/content.ts` (sin cambios de API).
