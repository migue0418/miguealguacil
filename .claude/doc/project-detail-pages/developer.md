# Plan técnico — project-detail-pages

Cambio: nueva ruta de detalle `/[locale]/proyectos/[projectId]` (SSG), modelo `Project.detail?` opcional,
conversión de las filas de `ProjectsGrid` en navegación "stretched link + CTA", y nuevo proyecto TFM
(`tfm-sexism-classifier`) con contenido completo ES/EN.

No se necesita `output: 'export'` ni cambios en `next.config.ts` — sigue el mismo patrón SSG que
`app/[locale]/page.tsx` (Server Component + `generateStaticParams`).

---

## Orden de implementación recomendado

1. `lib/types.ts` — añadir `ProjectDetail` y `Project.detail?`.
2. `messages/{es,en}.json` — namespace `projectDetail`.
3. `content/{es,en}/projects.ts` — nuevo proyecto TFM (con `detail` completo).
4. Tests (TDD) — `ProjectCard.test.tsx` (nuevo), ajustar `ProjectsGrid.test.tsx`, `ProjectDetail.test.tsx` (nuevo).
5. `components/ui/ProjectCard.tsx` + `components/ui/AnimatedProjectCard.tsx` — stretched-link + CTA.
6. `components/sections/ProjectDetail.tsx` — nuevo componente.
7. `app/[locale]/proyectos/[projectId]/page.tsx` — nueva ruta SSG.
8. Verificación: `npm run lint && npm run test && npm run build`.

Razón del orden: tipos y contenido primero (para que TS no se queje al escribir los componentes),
luego tests que fallan (TDD), luego implementación de componentes y ruta.

---

## 1. `lib/types.ts`

Añadir al final del archivo (o cerca de `Project`) el nuevo tipo `ProjectDetail` y el campo opcional
`detail?` en `Project`. **No** se cambia ningún campo existente de `Project` — el cambio es aditivo.

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

export interface ProjectDetail {
  summary: string[]
  sections?: ProjectDetailSection[]
  results?: ProjectDetailResult[]
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

Notas:
- `summary: string[]` es **requerido** dentro de `ProjectDetail` (si un proyecto define `detail`, debe
  definir al menos `summary`). `sections`, `results`, `links` son opcionales.
- `ProjectDetail.links` reutiliza la misma forma `{ label, url }` que `repoUrls` — no es necesario un
  tipo compartido nuevo, pero si se prefiere DRY se puede extraer `interface ExternalLink { label: string; url: string }`
  y usarlo en `repoUrls`, `ProjectDetail.links` y el array `links` que construye `ProjectCard`. **No es obligatorio**
  para este cambio (evitar tocar más de lo necesario); se deja como nota de limpieza futura.

---

## 2. `messages/es.json` y `messages/en.json`

Añadir un nuevo namespace `projectDetail` (al final del JSON, tras `project`). Mantener `project` sin
cambios (sus claves `view_repo`/`view_backend`/`view_mod`/`view_demo` se reutilizan).

### `messages/es.json`

```json
  "project": {
    "view_repo": "Ver repositorio",
    "view_demo": "Ver demo",
    "view_backend": "Backend",
    "view_mod": "Mod",
    "view_details": "Ver detalle"
  },
  "projectDetail": {
    "back": "Volver a proyectos",
    "overview": "Resumen",
    "results": "Resultados",
    "links": "Enlaces"
  }
```

### `messages/en.json`

```json
  "project": {
    "view_repo": "View repository",
    "view_demo": "View demo",
    "view_backend": "Backend",
    "view_mod": "Mod",
    "view_details": "View details"
  },
  "projectDetail": {
    "back": "Back to projects",
    "overview": "Overview",
    "results": "Results",
    "links": "Links"
  }
```

**Decisión de ubicación de `view_details`**: el diseño (`design.md` decisión 5) sugiere un namespace
`projectDetail` para `view_details`, pero **el CTA "Ver detalle →" vive en `ProjectCard`**, que ya usa
`getTranslations('project')` para sus labels (`viewRepo`, `viewBackend`, etc.). Para no tener que cargar
un segundo namespace de traducciones en `ProjectsGrid`/`ProjectCard` (que reciben `labels` ya resueltos
como prop), la opción más simple y consistente con el patrón actual es añadir `view_details` al
namespace `project` ya existente. `projectDetail` queda reservado para las claves que usa exclusivamente
la página de detalle (`back`, `overview`, `results`, `links`).

Si se prefiere seguir la letra literal del `design.md` (poner `view_details` en `projectDetail`), es
una alternativa válida, pero entonces `ProjectsGrid.tsx` debe añadir `const tpd = await getTranslations('projectDetail')`
y pasar `viewDetails: tpd('view_details')` dentro de `labels`. **Recomendación**: usar `project.view_details`
(menos cambios, un solo `getTranslations` adicional no es necesario). El resto de este plan asume
`project.view_details`.

---

## 3. `content/es/projects.ts` — contenido completo

Sustituir el archivo completo (mantiene los dos proyectos existentes sin `detail`, añade el TFM como
tercer elemento). El array sigue siendo `Project[]`.

```ts
import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'Agente LLM integrado en Minecraft a través de un mod personalizado. El backend gestiona el contexto del juego en tiempo real mediante WebSocket y ejecuta acciones dentro del mundo usando LangGraph.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'RAG', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
  },
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Plantilla full stack con SDD y buenas prácticas de desarrollo. Incluye pre-commit hooks, Git Flow, Docker y estructura modular para proyectos de producción.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
  },
  {
    id: 'tfm-sexism-classifier',
    name: 'Detección de sexismo en redes sociales con BERT y LLMs',
    description:
      'Trabajo de Fin de Máster: comparación de modelos BERT/ModernBERT ajustados frente a LLMs en zero/few-shot para detectar lenguaje sexista explícito e implícito en redes sociales.',
    stack: ['Python', 'PyTorch', 'Transformers', 'BERT', 'ModernBERT', 'FastAPI', 'React', 'SQLite'],
    repoUrl: 'https://github.com/migue0418/TFM-Miguel-Angel',
    featured: true,
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
      links: [
        {
          label: 'Memoria (PDF)',
          url: 'https://github.com/migue0418/TFM-Miguel-Angel/blob/main/TFM%20-%20LLMs%20para%20detecci%C3%B3n%20autom%C3%A1tica%20de%20lenguaje%20sexista%20en%20redes%20sociales.pdf',
        },
      ],
    },
  },
]
```

---

## 4. `content/en/projects.ts` — contenido completo

```ts
import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'LLM agent integrated into Minecraft through a custom mod. The backend manages in-game context in real time via WebSocket and executes actions inside the world using LangGraph.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'RAG', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
  },
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Full stack template with SDD and development best practices. Includes pre-commit hooks, Git Flow, Docker, and modular structure for production projects.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
  },
  {
    id: 'tfm-sexism-classifier',
    name: 'Detecting Sexism on Social Media with BERT and LLMs',
    description:
      "Master's thesis comparing fine-tuned BERT/ModernBERT models against zero/few-shot LLMs for detecting explicit and implicit sexist language on social media.",
    stack: ['Python', 'PyTorch', 'Transformers', 'BERT', 'ModernBERT', 'FastAPI', 'React', 'SQLite'],
    repoUrl: 'https://github.com/migue0418/TFM-Miguel-Angel',
    featured: true,
    detail: {
      summary: [
        'Sexism on social media shows up both explicitly and implicitly, which makes automatic moderation hard: current systems often confuse sexist content with posts that simply report or criticize it, and performance drops sharply when moving from one domain (e.g. Twitter) to another (e.g. forums or Reddit).',
        "This thesis starts from the hypothesis that a BERT-style model fine-tuned specifically for this task can be competitive with, or even outperform, general-purpose LLMs used in zero-shot or few-shot settings, even when the training data is significantly reduced.",
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
      links: [
        {
          label: 'Thesis (PDF)',
          url: 'https://github.com/migue0418/TFM-Miguel-Angel/blob/main/TFM%20-%20LLMs%20para%20detecci%C3%B3n%20autom%C3%A1tica%20de%20lenguaje%20sexista%20en%20redes%20sociales.pdf',
        },
      ],
    },
  },
]
```

**Nota sobre el `id`**: ambos locales usan el mismo `id: 'tfm-sexism-classifier'` — esto es crítico,
porque la ruta `/proyectos/[projectId]` y `/en/proyectos/[projectId]` deben coincidir para el mismo
proyecto en ambos idiomas (lo verifica `LocaleToggle` al cambiar de idioma manteniendo el `pathname`).

**Nota sobre la URL del PDF**: la URL ya viene percent-encoded en `design.md` (`%20`, `%C3%B3`, `%C3%A1`).
Se usa literal tal cual en ambos locales — no se debe volver a codificar ni decodificar.

---

## 5. Tests (TDD) — escribir ANTES de implementar los componentes

### 5.1 `components/ui/__tests__/ProjectCard.test.tsx` (nuevo)

Mockea:
- `@/i18n/navigation` → `Link` como un wrapper simple que renderiza `<a href={href} {...rest}>{children}</a>`
  (igual patrón que `LocaleToggle.test.tsx`, pero aquí exportamos `Link` en vez de `useRouter`/`usePathname`).
- No es necesario mockear `framer-motion` para `ProjectCard.test.tsx` porque `ProjectCard` es un Server
  Component puro (no usa `motion`). Solo `AnimatedProjectCard` usa `framer-motion`, y no es el foco de
  este test.

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { Project } from '@/lib/types'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const mockProject: Project = {
  id: 'tfm-sexism-classifier',
  name: 'TFM Project',
  description: 'Short description',
  stack: ['Python'],
  repoUrl: 'https://github.com/test/tfm',
  featured: true,
}

const labels = {
  viewRepo: 'View repository',
  viewBackend: 'Backend',
  viewMod: 'Mod',
  viewDemo: 'View demo',
  viewDetails: 'View details',
}

describe('ProjectCard', () => {
  it('renders a stretched link to the project detail page that is hidden from assistive tech', () => {
    render(<ProjectCard project={mockProject} index="01" labels={labels} />)
    const links = screen.getAllByRole('link', { hidden: true })
    const stretched = links.find((l) => l.getAttribute('href') === '/proyectos/tfm-sexism-classifier' && l.getAttribute('aria-hidden') === 'true')
    expect(stretched).toBeDefined()
    expect(stretched).toHaveAttribute('tabindex', '-1')
  })

  it('renders a visible, focusable "View details" CTA pointing to the detail page', () => {
    render(<ProjectCard project={mockProject} index="01" labels={labels} />)
    const cta = screen.getByRole('link', { name: 'View details' })
    expect(cta).toHaveAttribute('href', '/proyectos/tfm-sexism-classifier')
    expect(cta).not.toHaveAttribute('aria-hidden')
    expect(cta).not.toHaveAttribute('tabindex', '-1')
  })

  it('keeps external links (repo) focusable and opening in a new tab', () => {
    render(<ProjectCard project={mockProject} index="01" labels={labels} />)
    const repoLink = screen.getByRole('link', { name: 'View repository' })
    expect(repoLink).toHaveAttribute('href', 'https://github.com/test/tfm')
    expect(repoLink).toHaveAttribute('target', '_blank')
  })
})
```

Notas importantes para implementarlo:
- `getByRole('link', { hidden: true })` es necesario porque `aria-hidden="true"` excluye el elemento del
  árbol de accesibilidad por defecto en `@testing-library/dom` — `getAllByRole` sin `{ hidden: true }` no
  lo encontraría.
- `ProjectCard` ya NO es `async` (no usa `getTranslations` directamente — recibe `labels` por props),
  así que `render(<ProjectCard ... />)` funciona de forma síncrona, sin `await`.
- `labels` gana una nueva clave `viewDetails` (ver punto 7).

### 5.2 `components/sections/__tests__/ProjectsGrid.test.tsx` — ajustes

El test actual usa `mockProjects` con dos proyectos sin `id` reales pero válidos (`'p1'`, `'p2'`).
Con el nuevo `ProjectCard`, cada fila renderizará un `Link` "stretched" hacia `/proyectos/p1` y `/proyectos/p2`.
Para que `render(await ProjectsGrid({ projects: mockProjects }))` no falle:

- Añadir el mismo mock de `@/i18n/navigation` (`Link` → `<a>`) al inicio del archivo, junto a los mocks
  existentes de `next-intl/server` y `framer-motion`.
- Los tests existentes (`renders all project names`, `renders the section title`) deberían seguir
  pasando sin cambios adicionales, porque `getByText('Project Alpha')` sigue encontrando el `<h3>` con
  el nombre — no se elimina ningún texto existente, solo se añaden enlaces nuevos.
- Si se desea (no obligatorio, pero recomendable para cubrir el Requirement de `projects-section`),
  añadir un test nuevo:

```tsx
  it('renders a "view details" link for each project pointing to its detail page', async () => {
    const { ProjectsGrid } = await import('../ProjectsGrid')
    render(await ProjectsGrid({ projects: mockProjects }))
    const links = screen.getAllByRole('link', { name: 'view_details' })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/proyectos/p1')
    expect(links[1]).toHaveAttribute('href', '/proyectos/p2')
  })
```

  (Recuerda: `getTranslations` está mockeado como `async () => (key) => key`, así que `tp('view_details')`
  devuelve el string literal `'view_details'`.)

### 5.3 `components/sections/__tests__/ProjectDetail.test.tsx` (nuevo)

Mocks necesarios:
- `next-intl/server` → `getTranslations: async () => (key: string) => key` (igual patrón que
  `ProjectsGrid.test.tsx`, `Education.test.tsx`, etc.)
- `framer-motion` → mismo mock que el resto (`motion.div` pass-through, `useInView`/`useReducedMotion` → `true`)
- `@/i18n/navigation` → `Link` → `<a>` pass-through

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Project } from '@/lib/types'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...p}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
}))
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const baseProject: Project = {
  id: 'fastapi-react-template',
  name: 'FastAPI + React Template',
  description: 'A full stack template.',
  stack: ['Python', 'FastAPI'],
  repoUrl: 'https://github.com/test/fastapi-react-template',
  featured: true,
}

const fullProject: Project = {
  id: 'tfm-sexism-classifier',
  name: 'TFM Project',
  description: 'Short description fallback.',
  stack: ['Python', 'PyTorch'],
  repoUrl: 'https://github.com/test/tfm',
  featured: true,
  detail: {
    summary: ['First summary paragraph.', 'Second summary paragraph.'],
    sections: [
      { heading: 'Datasets', paragraphs: ['Datasets paragraph.'] },
      { heading: 'Methodology', paragraphs: ['Methodology paragraph.'] },
    ],
    results: [{ label: 'F1 score', value: '0.843' }],
    links: [{ label: 'Thesis (PDF)', url: 'https://example.com/thesis.pdf' }],
  },
}

describe('ProjectDetail', () => {
  it('renders the project name and stack chips', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: baseProject }))
    expect(screen.getByRole('heading', { name: 'FastAPI + React Template' })).toBeInTheDocument()
    expect(screen.getByText('FastAPI')).toBeInTheDocument()
  })

  it('falls back to description as overview when detail is missing', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: baseProject }))
    expect(screen.getByText('A full stack template.')).toBeInTheDocument()
    expect(screen.queryByText('results')).not.toBeInTheDocument()
    expect(screen.queryByText('links')).not.toBeInTheDocument()
  })

  it('renders detail.summary paragraphs when present', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    expect(screen.getByText('First summary paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second summary paragraph.')).toBeInTheDocument()
  })

  it('renders detail.sections with heading and paragraphs in order', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual(['Datasets', 'Methodology'])
    expect(screen.getByText('Datasets paragraph.')).toBeInTheDocument()
  })

  it('renders detail.results as a stat grid', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    expect(screen.getByText('F1 score')).toBeInTheDocument()
    expect(screen.getByText('0.843')).toBeInTheDocument()
  })

  it('renders detail.links as external links opening in a new tab', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    const link = screen.getByRole('link', { name: /Thesis \(PDF\)/ })
    expect(link).toHaveAttribute('href', 'https://example.com/thesis.pdf')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders a back link to the projects section', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: baseProject }))
    const back = screen.getByRole('link', { name: 'back' })
    expect(back).toHaveAttribute('href', '/#proyectos')
  })
})
```

Notas:
- `getByRole('heading', { level: 3 })` asume que el `name`/título del proyecto usa `<h1>` (o `<h2>` vía
  `SectionHeading`, que renderiza `<h2>`) y que cada `detail.sections[].heading` se renderiza como `<h3>`.
  Ver estructura JSX en el punto 6 — si se decide usar otro nivel de heading, ajustar el test
  correspondientemente (es indicativo, ajustar al implementar).
- El test `'renders the project name and stack chips'` usa `getByRole('heading', { name: ... })` sin
  especificar `level` — debe coincidir con cualquier heading que contenga el nombre del proyecto.

---

## 6. `components/ui/ProjectCard.tsx` — stretched-link + CTA (JSX final)

`ProjectCard` deja de ser solo presentacional: ahora también es responsable de la navegación a
`/proyectos/{project.id}`. Sigue siendo un **Server Component síncrono** (no `async`, no usa
`getTranslations` directamente — sigue recibiendo `labels` por props desde `ProjectsGrid`).

Cambios clave respecto al archivo actual:
- Importar `Link` desde `@/i18n/navigation`.
- `labels` gana una nueva clave `viewDetails: string`.
- El `<article>` pasa a `position: relative` (ya tiene clases, añadir `relative`).
- Se añade un `<Link>` "stretched": `absolute inset-0`, `aria-hidden="true"`, `tabIndex={-1}`, sin texto
  visible (`<span className="sr-only" />` opcional, pero al ser `aria-hidden` no es estrictamente
  necesario — se puede dejar vacío).
- El bloque de enlaces externos (`md:col-span-1` actual) se envuelve en un contenedor con
  `className="relative z-10 ..."` para quedar por encima del stretched-link.
- Se añade un nuevo bloque/columna con el CTA visible "Ver detalle →" / "View details →", también
  `relative z-10` (técnicamente no es estrictamente necesario que el CTA tenga `z-10` porque coincide
  exactamente con el stretched-link y haría lo mismo, pero por claridad y para que sea clicable de forma
  fiable en todos los navegadores se recomienda darle `relative z-10` también).

JSX completo propuesto:

```tsx
import { ArrowUpRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  index: string
  labels: {
    viewRepo: string
    viewBackend: string
    viewMod: string
    viewDemo: string
    viewDetails: string
  }
}

export function ProjectCard({ project, index, labels }: ProjectCardProps) {
  const links: { label: string; url: string }[] = []
  if (project.repoUrl) links.push({ label: labels.viewRepo, url: project.repoUrl })
  if (project.repoUrls) {
    for (const repo of project.repoUrls) {
      links.push({
        label: repo.label === 'Backend' ? labels.viewBackend : labels.viewMod,
        url: repo.url,
      })
    }
  }
  if (project.demoUrl) links.push({ label: labels.viewDemo, url: project.demoUrl })

  const detailHref = `/proyectos/${project.id}`

  return (
    <article className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-8 border-t border-default hover:bg-surface-hover transition-colors px-2 -mx-2">
      <Link
        href={detailHref}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0"
      />

      <div className="md:col-span-1 font-mono text-accent text-sm">{index}</div>

      <div className="md:col-span-5 flex flex-col gap-3">
        <h3 className="font-display font-medium text-xl text-primary group-hover:text-accent transition-colors">
          {project.name}
        </h3>
        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="font-mono text-xs uppercase tracking-wide text-muted bg-surface border border-default px-2 py-1 rounded"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="md:col-span-4 bg-background shadow-inner rounded p-4 font-mono text-sm text-muted leading-relaxed">
        {project.description}
      </div>

      <div className="md:col-span-2 flex md:flex-col flex-row flex-wrap gap-3 md:items-end items-start relative z-10">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {link.label}
            <ArrowUpRight size={14} aria-hidden />
          </a>
        ))}
        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors"
        >
          {labels.viewDetails}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  )
}
```

Decisiones de layout y por qué:
- **Columnas md**: el original era `1 / 5 / 5 / 1` (12 columnas). Para hacer sitio al nuevo CTA sin
  amontonar todo en la última columna estrecha, se reduce la columna de descripción de `5` a `4` y se
  amplía la columna de enlaces de `1` a `2` (`1+5+4+2 = 12`). Esto da más espacio horizontal para que
  "Ver detalle →" no fuerce un salto de línea junto a "Ver repositorio"/"Backend"/"Mod"/"Ver demo".
  Si al implementar se ve demasiado apretado, es aceptable mantener `md:col-span-1` para la columna de
  enlaces y `md:col-span-5` para la descripción, y dejar que el CTA "Ver detalle" caiga en una fila
  propia dentro de ese `flex-col` — el grid de Tailwind permite ese ajuste sin tocar la estructura
  general. **No es un requisito funcional bloqueante**, solo un detalle visual a verificar en el E2E.
- **`relative` en `<article>`**: imprescindible para que `absolute inset-0` del stretched-link se
  posicione respecto a la fila completa (y no respecto a un ancestro más lejano).
- **`aria-hidden="true"` + `tabIndex={-1}` en el stretched-link**: cumple el requisito de
  "no se anuncia por separado" — los lectores de pantalla y la navegación por teclado lo saltan.
- **`relative z-10` en el contenedor de enlaces externos y en el CTA**: necesario porque, aunque el
  stretched-link es `aria-hidden`, sigue siendo un elemento DOM real con `absolute inset-0` que
  **captura clicks** salvo que los elementos por encima tengan `z-index` superior. Sin `z-10`, el click
  en el icono ↗ de "Ver repositorio" navegaría al detalle en lugar de abrir el repo. Esto es exactamente
  el riesgo descrito en `design.md`.
- **Por qué NO usar `<a>` para el stretched-link**: usar `Link` de `@/i18n/navigation` asegura que el
  prefijo de locale (`/en/...` vs `/...`) se resuelve automáticamamente, igual que en `LocaleToggle`.
- **Sin `<a>` anidados**: el stretched-link (`Link` → `<a>`) y el CTA "Ver detalle" (`Link` → `<a>`) son
  **hermanos** en el árbol, no están uno dentro del otro — HTML válido. Los enlaces externos (`<a>`)
  tampoco están anidados dentro de ningún `Link`.
- **`<h3>`**: se mantiene tal cual (no cambia el nivel de heading del nombre del proyecto).

---

## 7. `components/sections/ProjectsGrid.tsx` — añadir `viewDetails` a `labels`

Único cambio: añadir `viewDetails: tp('view_details')` al objeto `labels` (clave nueva en el namespace
`project`, ver punto 2).

```tsx
  const labels = {
    viewRepo: tp('view_repo'),
    viewBackend: tp('view_backend'),
    viewMod: tp('view_mod'),
    viewDemo: tp('view_demo'),
    viewDetails: tp('view_details'),
  }
```

El resto de `ProjectsGrid.tsx` no cambia. `AnimatedProjectCard` no necesita cambios funcionales más allá
de que su prop `labels` ahora incluye `viewDetails` — como ya hace spread/pass-through del tipo completo
(`labels: { viewRepo: string; viewBackend: string; viewMod: string; viewDemo: string }`), hay que
**actualizar también la interfaz `AnimatedProjectCardProps['labels']`** en
`components/ui/AnimatedProjectCard.tsx` para incluir `viewDetails: string` (si no, TypeScript fallará
al pasar `labels` a `<ProjectCard labels={labels} />` dentro de `AnimatedProjectCard`).

### `components/ui/AnimatedProjectCard.tsx` — cambio

```tsx
interface AnimatedProjectCardProps {
  project: Project
  index: string
  labels: {
    viewRepo: string
    viewBackend: string
    viewMod: string
    viewDemo: string
    viewDetails: string
  }
}
```

(Sin más cambios en este archivo — `motion.div` + `staggerItem` siguen igual.)

---

## 8. `components/sections/ProjectDetail.tsx` (nuevo, Server Component)

Recibe `{ project: Project }`. Carga sus propias traducciones vía `getTranslations` (patrón idéntico a
`ProjectsGrid`/`Education`/`Timeline`: `async function`, `await getTranslations(...)`).

Estructura/orden (de arriba a abajo):

1. **Back link** ("Volver a proyectos" → `/#proyectos`) — fuera de cualquier wrapper de animación
   (aparece instantáneo, es navegación de utilidad, no contenido "hero").
2. **Cabecera**: nombre del proyecto (`<h1>`), stack chips, enlaces externos (mismas labels que
   `ProjectCard`: `viewRepo`/`viewBackend`/`viewMod`/`viewDemo`, sin `viewDetails` aquí — no tiene
   sentido un CTA "ver detalle" dentro de la propia página de detalle). Envuelto en `FadeIn`.
3. **Overview**: `detail?.summary ?? [project.description]`, cada string como `<p>`. Envuelto en
   `FadeIn` con pequeño `delay`.
4. **Sections** (`detail?.sections`): si existe, `StaggerChildren` envolviendo un `<section>` por cada
   `{ heading, paragraphs }`, cada uno con `<h3>{heading}</h3>` + `<p>` por párrafo.
5. **Results** (`detail?.results`): si existe, `<SectionHeading number="—" title={t('results')} />`
   (o un `<h2>` simple) + grid de "stat cards" (`label`/`value`), envuelto en `StaggerChildren`.
6. **Links adicionales** (`detail?.links`): si existe, encabezado "Enlaces"/"Links" + lista de `<a>`
   con icono ↗, mismo estilo que los enlaces de `ProjectCard`.

```tsx
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import type { Project } from '@/lib/types'

interface ProjectDetailProps {
  project: Project
}

export async function ProjectDetail({ project }: ProjectDetailProps) {
  const t = await getTranslations('projectDetail')
  const tp = await getTranslations('project')

  const externalLinks: { label: string; url: string }[] = []
  if (project.repoUrl) externalLinks.push({ label: tp('view_repo'), url: project.repoUrl })
  if (project.repoUrls) {
    for (const repo of project.repoUrls) {
      externalLinks.push({
        label: repo.label === 'Backend' ? tp('view_backend') : tp('view_mod'),
        url: repo.url,
      })
    }
  }
  if (project.demoUrl) externalLinks.push({ label: tp('view_demo'), url: project.demoUrl })

  const summary = project.detail?.summary ?? [project.description]

  return (
    <article className="py-24 max-w-[1200px] mx-auto px-5 md:px-20">
      <Link
        href="/#proyectos"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors mb-12"
      >
        <ArrowLeft size={14} aria-hidden />
        {t('back')}
      </Link>

      <FadeIn>
        <header className="mb-12 pb-12 border-b border-default">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-primary mb-6">
            {project.name}
          </h1>
          <div className="flex flex-wrap gap-2 mb-6">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="font-mono text-xs uppercase tracking-wide text-muted bg-surface border border-default px-2 py-1 rounded"
              >
                {tech}
              </span>
            ))}
          </div>
          {externalLinks.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {externalLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors"
                >
                  {link.label}
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              ))}
            </div>
          )}
        </header>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-col gap-4 max-w-3xl mb-16 text-muted text-lg leading-relaxed">
          {summary.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </FadeIn>

      {project.detail?.sections && (
        <StaggerChildren className="flex flex-col gap-12 mb-16">
          {project.detail.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-4">
                {section.heading}
              </h3>
              <div className="flex flex-col gap-3 max-w-3xl text-muted leading-relaxed">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </StaggerChildren>
      )}

      {project.detail?.results && (
        <div className="mb-16">
          <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-6">
            {t('results')}
          </h2>
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.detail.results.map((result) => (
              <div
                key={result.label}
                className="bg-surface border border-default rounded p-4 flex flex-col gap-2"
              >
                <span className="font-mono text-xs uppercase text-muted">{result.label}</span>
                <span className="font-mono text-2xl text-accent">{result.value}</span>
              </div>
            ))}
          </StaggerChildren>
        </div>
      )}

      {project.detail?.links && (
        <div>
          <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-6">
            {t('links')}
          </h2>
          <div className="flex flex-col gap-3">
            {project.detail.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-sm text-accent hover:text-[var(--color-accent-hover)] transition-colors"
              >
                {link.label}
                <ArrowUpRight size={14} aria-hidden />
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
```

Notas:
- `t('overview')` (clave `projectDetail.overview`) está definida en `messages/{es,en}.json` pero **no
  se usa como heading visible** en este JSX (la sección overview no lleva encabezado propio, solo los
  párrafos — coherente con el resumen visual del Hero, que tampoco tiene heading). Se mantiene la clave
  por si se decide añadir un `<h2>{t('overview')}</h2>` durante la implementación (cambio menor, no
  bloqueante). Si no se usa, **no eliminar la clave de `messages/`** salvo que se confirme que no la usa
  ningún test — mejor dejarla disponible y sin uso que romper la regla "claves nuevas en ambos locales".
- `ArrowLeft` se importa de `lucide-react` — verificar que el icono existe (confirmado: `arrow-left.mjs`
  está en `node_modules/lucide-react/dist/esm/icons/`, junto a `arrow-left-circle`, etc. — `ArrowLeft`
  es el icono base estándar).
- El componente es `async` porque usa `await getTranslations(...)` — el test debe hacer
  `render(await ProjectDetail({ project }))`, igual que `ProjectsGrid`/`Education`/`Timeline`.
- `FadeIn`/`StaggerChildren` son Client Components (`'use client'`) pero pueden usarse dentro de un
  Server Component como `ProjectDetail` sin problema (patrón ya usado en `ProjectsGrid`).
- El grid de resultados usa `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — con 7 resultados del TFM
  esto da 3+3+1, visualmente razonable. Ajustable si se prefiere `lg:grid-cols-4`.

---

## 9. `app/[locale]/proyectos/[projectId]/page.tsx` (nuevo)

Server Component, SSG. Sigue el patrón de `app/[locale]/page.tsx` (que ya define
`generateStaticParams` iterando `routing.locales`), pero aquí hay **dos** segmentos dinámicos
(`[locale]` y `[projectId]`), y **no existe un `generateStaticParams` en `app/[locale]/layout.tsx`**
que preestablezca `locale` para los hijos. Por tanto, este `page.tsx` debe generar **ambos** params
("bottom-up", según la sección "Generate params from the bottom up" de la doc de
`generateStaticParams`).

```tsx
import { notFound } from 'next/navigation'
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

  const projects = await getProjects(locale)
  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    notFound()
  }

  return <ProjectDetail project={project} />
}
```

Notas:
- **`notFound()` y el tipo `never`**: según la doc de Next 16, `notFound()` lanza, por lo que TypeScript
  ya sabe que tras esa línea `project` no es `undefined` — no es necesario `return notFound()` ni un
  `else`. Pero `project.find(...)` devuelve `Project | undefined`; tras `if (!project) notFound()`,
  TS angosta el tipo a `Project` para el resto de la función. Confirmado por
  `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md`.
- **`generateStaticParams` "bottom-up"**: como `app/[locale]/layout.tsx` NO exporta
  `generateStaticParams` (solo `app/[locale]/page.tsx` lo hace, y solo para `{ locale }` — es un
  hermano, no un padre de esta ruta en términos de `generateStaticParams`), este `page.tsx` de
  `proyectos/[projectId]` debe declarar **ambos** segmentos (`locale` y `projectId`) en su propio
  `generateStaticParams`. Esto es exactamente lo que dice `design.md` decisión 1 y coincide con el
  patrón "Generate params from the bottom up" de la doc oficial.
- **Tipado de `params`**: `Promise<{ locale: string; projectId: string }>` — Next 16 pasa `params` como
  Promise (ver `dynamic-routes.md`, sección "Behavior": "Since the params prop is a promise. You must
  use async/await..."). No usar el patrón antiguo de `params` síncrono.
- **`PageProps<'/[locale]/proyectos/[projectId]'>` helper**: la doc de Next 16 menciona un helper
  `PageProps<'/route'>` para tipar `params`/`searchParams` automáticamente a partir de la estructura de
  carpetas. **No es obligatorio usarlo** — el resto del proyecto (`app/[locale]/page.tsx`,
  `app/[locale]/layout.tsx`) usa el tipado manual `Promise<{ locale: string }>`, así que mantener el
  mismo estilo (`Promise<{ locale: string; projectId: string }>`) es consistente con el código existente
  y evita introducir un patrón nuevo en este cambio. Si TypeScript genera el tipo `PageProps` automático
  en `.next/types/` y hay conflicto, usar el tipo manual explícito (como aquí) sigue siendo válido.
- **No se usa `dynamicParams = false`**: no es necesario — `generateStaticParams` cubre exactamente
  los 3 proyectos × 2 locales = 6 páginas. Si en el futuro alguien visita un `projectId` inexistente,
  Next 16 intentará renderizar en runtime (comportamiento por defecto `dynamicParams: true`), entrará en
  `ProjectDetailPage`, `projects.find(...)` devolverá `undefined`, y `notFound()` mostrará el 404 — esto
  es correcto y deseable (cubre el caso de URLs rotas sin necesitar configuración adicional).
- **No se añade `generateMetadata`** en este cambio (Non-Goal explícito en `design.md`, "Open Questions").
  Si se quiere añadir de forma trivial más adelante, sería una función adicional en este mismo archivo
  usando `project.name`/`project.description` — fuera de alcance aquí.

---

## 10. Resumen de archivos

| Archivo | Tipo de cambio |
|---|---|
| `lib/types.ts` | Añadir `ProjectDetail`, `ProjectDetailSection`, `ProjectDetailResult`, `ProjectDetailLink` y `Project.detail?` |
| `messages/es.json` | Añadir `project.view_details`, namespace `projectDetail` (`back`, `overview`, `results`, `links`) |
| `messages/en.json` | Idem en inglés |
| `content/es/projects.ts` | Reescribir: mantiene 2 proyectos existentes + nuevo TFM con `detail` completo |
| `content/en/projects.ts` | Idem en inglés |
| `components/ui/ProjectCard.tsx` | Stretched-link + CTA "Ver detalle", reestructura columnas grid, `labels.viewDetails` |
| `components/ui/AnimatedProjectCard.tsx` | Añadir `viewDetails: string` a la interfaz `labels` |
| `components/sections/ProjectsGrid.tsx` | Añadir `viewDetails: tp('view_details')` a `labels` |
| `components/sections/ProjectDetail.tsx` | **Nuevo** — Server Component de la página de detalle |
| `app/[locale]/proyectos/[projectId]/page.tsx` | **Nuevo** — ruta SSG con `generateStaticParams` bottom-up |
| `components/ui/__tests__/ProjectCard.test.tsx` | **Nuevo** (TDD) |
| `components/sections/__tests__/ProjectsGrid.test.tsx` | Ajustar: mock de `@/i18n/navigation`, test opcional de `view_details` |
| `components/sections/__tests__/ProjectDetail.test.tsx` | **Nuevo** (TDD) |

No se toca: `lib/content.ts` (firma sin cambios — `getProjects` ya devuelve `Project[]`, y `Project` se
extiende de forma compatible), `i18n/routing.ts`, `i18n/navigation.ts`, `middleware.ts`,
`app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, `app/layout.tsx`.

---

## 11. Riesgos / ambigüedades detectadas (más allá de `design.md`)

1. **Ubicación de `view_details`** (namespace `project` vs `projectDetail`): este plan usa
   `project.view_details` por consistencia con cómo `ProjectsGrid`/`ProjectCard` ya reciben `labels`
   resueltos. Si se prefiere `projectDetail.view_details` (como sugiere literalmente `design.md`), el
   único cambio es: mover la clave de namespace en `messages/{es,en}.json` y añadir
   `const tpd = await getTranslations('projectDetail')` + `viewDetails: tpd('view_details')` en
   `ProjectsGrid.tsx`. Cualquiera de las dos opciones cumple el spec; este plan documenta la elegida
   para evitar ambigüedad en la implementación.

2. **`AnimatedProjectCard` requiere actualizar su interfaz `labels`** — fácil de olvidar porque
   `tasks.md` no lo menciona explícitamente (solo habla de `ProjectCard`). Si no se actualiza,
   `npm run build` (chequeo de tipos) fallará al pasar `labels` con `viewDetails` desde `ProjectsGrid` a
   `AnimatedProjectCard` (el tipo no tendría esa propiedad declarada, aunque en JS funcionaría — en TS
   estricto con objetos literales puede generar error de "extra property" solo si se infiere
   estructuralmente en la posición de creación; para no depender de eso, **actualizar la interfaz
   explícitamente** es la opción correcta).

3. **Reestructuración del grid de columnas en `ProjectCard`** (`1/5/5/1` → `1/5/4/2`): es un cambio
   visual no especificado en detalle por `design.md`. Es una propuesta razonable para dar espacio al
   nuevo CTA, pero **debe verificarse visualmente en el E2E** (Playwright MCP, paso 5 de `tasks.md`) en
   ambos breakpoints (mobile `flex-col`, desktop `grid-cols-12`) y en ambos locales (el texto en inglés
   "View details →" es más largo que "Ver detalle →" y podría romper línea). Si en el E2E se ve mal,
   alternativas sin tocar el grid:
   - Mantener `1/5/5/1` y poner el CTA "Ver detalle" como una fila adicional `md:col-span-12` al final
     del `<article>`, alineada a la derecha.
   - Mantener `1/5/5/1` y meter el CTA dentro del `flex-col` de enlaces externos (columna `md:col-span-1`),
     que ya usa `flex flex-row flex-wrap` en mobile / `flex-col` en desktop — el wrap debería
     acomodarlo, aunque la columna es estrecha (`col-span-1` ≈ 1/12 del ancho en desktop).

4. **`ProjectDetail.tsx` y `prefers-reduced-motion`**: `FadeIn`/`StaggerChildren` ya gestionan
   `useReducedMotion()` internamente (devuelven `<div>` plano sin animación) — no se requiere lógica
   adicional en `ProjectDetail`. Confirmado leyendo `components/animations/FadeIn.tsx` y
   `StaggerChildren.tsx`.

5. **`getByRole('heading', { level: 3 })` en el test de secciones**: este plan usa `<h3>` para
   `detail.sections[].heading` y `<h2>` para "Resultados"/"Enlaces" (sin `SectionHeading`, que está
   pensado para secciones de home con número `[01]`, `[02]`, etc. — en la página de detalle no hay
   esa numeración). Si se prefiere reutilizar `SectionHeading` literalmente (como sugiere `design.md`
   "Reutiliza `SectionHeading` para encabezados de sección"), su prop `number` es **requerida**
   (`SectionHeadingProps.number: string`) — habría que inventar un valor (p. ej. `"—"` o continuar la
   numeración de la home, `"05"`, `"06"`...). Este plan opta por **no** usar `SectionHeading` en
   `ProjectDetail` (headings `<h2>`/`<h3>` simples con las mismas clases `font-mono uppercase
   tracking-widest`) para no forzar un `number` arbitrario que no aporta valor fuera del listado
   numerado de la home. Si se prefiere mantener fidelidad visual exacta con `SectionHeading`, es un
   cambio menor: importar `SectionHeading` y pasar `number="—"` o similar.

6. **`ProjectCard.test.tsx` y `getAllByRole('link', { hidden: true })`**: confirmar que
   `@testing-library/dom`/`jest-dom` instalado en este proyecto soporta la opción `hidden: true` en
   `getByRole`/`getAllByRole` (es una opción estándar de `dom-testing-library` desde hace varias
   versiones — no requiere configuración adicional, pero si el test falla con "Unable to find role
   link" para el stretched-link, ese es el primer punto a revisar).

7. **Mock de `@/i18n/navigation` con `Link` exportado como named export**: el mock propuesto
   (`vi.mock('@/i18n/navigation', () => ({ Link: ... }))`) sustituye **todo** el módulo. Si algún
   componente bajo test también importa `useRouter`/`usePathname` de `@/i18n/navigation` en la misma
   suite (no es el caso aquí: `ProjectCard`, `ProjectDetail` y `ProjectsGrid` solo usan `Link`), habría
   que incluir también esos exports en el mock. Verificado: ninguno de los tres componentes nuevos/
   modificados usa `useRouter`/`usePathname`.

8. **Orden TFM como "tercer proyecto"**: el array `projects` en `content/{es,en}/projects.ts` mantiene
   `minecraft-butler-ai` y `fastapi-react-template` en sus posiciones 1 y 2, y el TFM se añade en
   posición 3 — esto determina el `index` (`"01"`, `"02"`, `"03"`) que `ProjectsGrid` calcula con
   `String(i + 1).padStart(2, '0')`. Coincide con el Requirement "Proyecto TFM visible... como tercera
   fila".

---

## 12. Verificación (OBLIGATORIO)

```powershell
npm run lint && npm run test && npm run build
```

Puntos a vigilar:
- `npm run build` ejecutará `generateStaticParams` de `app/[locale]/proyectos/[projectId]/page.tsx` en
  build time — debe generar 6 páginas (`es`/`en` × 3 proyectos): `/proyectos/minecraft-butler-ai`,
  `/proyectos/fastapi-react-template`, `/proyectos/tfm-sexism-classifier`, y sus equivalentes `/en/...`.
- Verificar en el output de `next build` que aparecen las 6 rutas estáticas nuevas (sección "Route (app)"
  del resumen de build).
- `tsc` (parte de `next build`) fallará si `AnimatedProjectCard`'s `labels` no incluye `viewDetails` (ver
  riesgo 2) o si algún `Project` literal en tests no es asignable al tipo extendido (no debería ocurrir,
  `detail` es opcional).

## 13. E2E Playwright MCP — puntos clave a verificar (lo ejecuta el agente en `/opsx:apply`)

- Home (`/`) → click en zona no interactiva de la fila del TFM → navega a
  `/proyectos/tfm-sexism-classifier`.
- En la página de detalle: resumen (2 párrafos), secciones "Datasets"/"Metodología"/"Conclusiones" en
  orden, grid de 7 resultados, enlace "Memoria (PDF)" (`target="_blank"`).
- Click en "Volver a proyectos" → vuelve a `/` con scroll a `#proyectos`.
- Cambiar a inglés con `LocaleToggle` desde `/proyectos/tfm-sexism-classifier` → debe ir a
  `/en/proyectos/tfm-sexism-classifier` (gracias a que `LocaleToggle` usa `usePathname()` de
  `@/i18n/navigation`, que devuelve el pathname sin prefijo de locale) y todo el contenido en inglés.
- Tab hasta el CTA "Ver detalle →" de una fila + Enter → navega al detalle.
- Tab hasta un enlace externo (GitHub) + Enter → abre nueva pestaña, **sin** navegar al detalle.
- Verificar visualmente el layout del grid de `ProjectCard` en mobile y desktop, ES y EN (riesgo 3).
- Tema claro/oscuro en la página de detalle (tokens `bg-surface`/`border-default`/`text-accent` ya
  cubren ambos modos vía `app/globals.css`, no se introduce ningún color hardcodeado nuevo).
