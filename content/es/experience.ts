import type { ExperienceItem } from '@/lib/types'

export const experience: ExperienceItem[] = [
  {
    id: 'gpu-solutions',
    role: 'Data Scientist & AI Engineer',
    company: 'GPU Solutions (BIAI Technology)',
    startDate: '2024-12',
    endDate: '2026-04',
    location: 'Granada, España',
    bullets: [
      'Diseño y desarrollo de agentes LLM con LangChain y LangGraph (arquitectura multiagente)',
      'Desarrollo desde cero con Python (FastAPI) + ReactJS, aplicando buenas prácticas (pre-commit, Git Flow)',
      'Pipelines RAG con Milvus y Qdrant',
      'Monitorización con logging estructurado y dashboards',
    ],
  },
  {
    id: 'educa-lead',
    role: 'Technical Lead (Proyectos de IA)',
    company: 'Educa Edtech Group',
    startDate: '2023-10',
    endDate: '2024-11',
    location: 'Granada, España',
    bullets: [
      'Liderazgo de equipo multidisciplinario de software y datos',
      'Implementación de metodologías ágiles',
      'Base de datos centralizada MySQL/BigQuery + pipelines ETL en Python',
    ],
  },
  {
    id: 'educa-ds',
    role: 'Junior Data Scientist',
    company: 'Educa Edtech Group',
    startDate: '2022-08',
    endDate: '2023-10',
    location: 'Granada, España',
    bullets: [
      'Proyecto de traducción automática con NLP',
      'Plataforma centralizada con IA para gestión de contenidos',
      'Sistema sincronizador de productos entre bases de datos',
    ],
  },
  {
    id: 'educa-dev',
    role: 'Junior Software Developer',
    company: 'Educa Edtech Group',
    startDate: '2022-05',
    endDate: '2022-08',
    location: 'Granada, España',
    bullets: [
      'Diseño de bases de datos SQL',
      'APIs en Python (FastAPI)',
      'Desarrollo PHP (Laravel, Phalcon) + CRM',
    ],
  },
  {
    id: 'ceprud',
    role: 'Prácticas - Área Web',
    company: 'CEPRUD (Universidad de Granada)',
    startDate: '2021-03',
    endDate: '2021-10',
    location: 'Granada, España',
    bullets: [
      'Desarrollo y mantenimiento con CMS WordPress y Drupal',
    ],
  },
]
