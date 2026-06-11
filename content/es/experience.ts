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
      'Diseño y desarrollo de agentes LLM con LangChain y LangGraph, siguiendo una arquitectura multiagente y separación por capas (Clean Architecture), integrados en canales como WhatsApp, Microsoft Teams y una interfaz web.',
      'Desarrollo de proyectos desde cero en Python (FastAPI) + ReactJS, aplicando buenas prácticas: arquitectura modular, tipado, validación, manejo de errores y trazabilidad (pre-commit, Git Flow).',
      'Implementación de pipelines de extracción y transformación de datos en Python para alimentar el RAG, indexando en bases de datos vectoriales (Milvus/Qdrant).',
      'Monitorización de modelos y agentes basada en logging y seguimiento con dashboards para control de rendimiento, errores y uso.',
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
      'Liderar un equipo multidisciplinario de software y data, asegurando la entrega de proyectos de alta calidad alineados con los objetivos de la empresa.',
      'Coordinar la comunicación del equipo con los distintos departamentos, garantizando que las expectativas y requerimientos de cada proyecto se cumplan de manera eficiente.',
      'Implementar metodologías ágiles para optimizar el flujo de trabajo, mejorar la colaboración del equipo y reducir los tiempos de entrega.',
      'Diseño y mantenimiento de una BBDD centralizada (MySQL/BigQuery) y desarrollo de pipelines ETL en Python para ingestar y unificar datos desde herramientas analíticas y otras BBDDs internas.',
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
      'Implementar un proyecto de traducción automática de texto, video e imágenes, utilizando técnicas avanzadas de procesamiento del lenguaje natural (NLP).',
      'Colaborar con el departamento de marketing para realizar análisis de las webs, detectando incongruencias en los contenidos mediante el uso de conectores analíticos.',
      'Diseñar y desarrollar una plataforma centralizada alimentada con IA, destinada a albergar los contenidos de todas las webs del grupo, optimizando la gestión y distribución de información.',
      'Diseñar un sistema sincronizador de información de productos entre distintas bases de datos, garantizando la coherencia y actualización de datos en la plataforma central.',
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
      'Diseñar bases de datos SQL, asegurando una estructura eficiente y escalable.',
      'Desarrollar APIs en Python (FastAPI), facilitando la comunicación y la integración entre sistemas.',
      'Apoyar en el desarrollo de proyectos de software utilizando PHP (Laravel y Phalcon), así como en el desarrollo del CRM de la empresa.',
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
      'Gestionar y mantener CMS (WordPress y Drupal), incluyendo la implementación de nuevas funcionalidades en Drupal para mejorar la estabilidad y la usabilidad de las plataformas web.',
    ],
  },
]
