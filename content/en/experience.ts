import type { ExperienceItem } from '@/lib/types'

export const experience: ExperienceItem[] = [
  {
    id: 'gpu-solutions',
    role: 'Data Scientist & AI Engineer',
    company: 'GPU Solutions (BIAI Technology)',
    startDate: '2024-12',
    endDate: '2026-04',
    location: 'Granada, Spain',
    bullets: [
      'Design and development of LLM agents using LangChain and LangGraph, following a multi-agent architecture with layer separation (Clean Architecture), integrated into channels such as WhatsApp, Microsoft Teams, and a web interface.',
      'End-to-end project development in Python (FastAPI) + ReactJS, applying best practices: modular architecture, typing, validation, error handling, and traceability (pre-commit, Git Flow).',
      'Implementation of data extraction and transformation pipelines in Python to feed the RAG system, indexing into vector databases (Milvus/Qdrant).',
      'Model and agent monitoring based on logging and dashboards for tracking performance, errors, and usage.',
    ],
  },
  {
    id: 'educa-lead',
    role: 'Technical Lead (AI Projects)',
    company: 'Educa Edtech Group',
    startDate: '2023-10',
    endDate: '2024-11',
    location: 'Granada, Spain',
    bullets: [
      'Leadership of a multidisciplinary software and data team, ensuring delivery of high-quality projects aligned with company objectives.',
      'Implemented agile methodologies  to optimise workflow, improve team collaboration, and reduce delivery times.',
      'Designed and maintained a centralised database (MySQL/BigQuery) and developed ETL pipelines in Python to ingest and unify data from analytics tools and other internal databases.',
      'Coordinated team communication with different departments, ensuring that expectations and project requirements were met efficiently.',
    ],
  },
  {
    id: 'educa-ds',
    role: 'Junior Data Scientist',
    company: 'Educa Edtech Group',
    startDate: '2022-08',
    endDate: '2023-10',
    location: 'Granada, Spain',
    bullets: [
      'Implemented an automatic translation project for text, video, and images using advanced NLP techniques.',
      'Collaborated with the marketing department to analyse websites, detecting content inconsistencies using analytics connectors.',
      'Designed and developed an AI-powered centralised platform to host content from all group websites, optimising information management and distribution.',
      'Designed a product information synchronisation system across different databases, ensuring data consistency and currency throughout the central platform.',
    ],
  },
  {
    id: 'educa-dev',
    role: 'Junior Software Developer',
    company: 'Educa Edtech Group',
    startDate: '2022-05',
    endDate: '2022-08',
    location: 'Granada, Spain',
    bullets: [
      'Designed SQL databases, ensuring efficient and scalable data structures.',
      'Developed APIs in Python (FastAPI), facilitating communication and integration between systems.',
      'Supported software project development using PHP (Laravel and Phalcon), as well as contributing to the company\'s CRM development.',
    ],
  },
  {
    id: 'ceprud',
    role: 'Internship - Web Area',
    company: 'CEPRUD (Universidad de Granada)',
    startDate: '2021-03',
    endDate: '2021-10',
    location: 'Granada, Spain',
    bullets: [
      'Managed and maintained CMS platforms (WordPress and Drupal), including the implementation of new features in Drupal to improve platform stability and usability.',
    ],
  },
]
