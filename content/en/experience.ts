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
      'Design and development of LLM agents with LangChain and LangGraph (multi-agent architecture)',
      'Full-stack development with Python (FastAPI) + ReactJS, applying best practices (pre-commit, Git Flow)',
      'RAG pipelines with Milvus and Qdrant',
      'Monitoring with structured logging and dashboards',
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
      'Leadership of a multidisciplinary software and data team',
      'Implementation of agile methodologies',
      'Centralized MySQL/BigQuery database + Python ETL pipelines',
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
      'Automatic translation project using NLP',
      'Centralized AI-powered platform for content management',
      'Product synchronizer system between databases',
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
      'SQL database design',
      'APIs in Python (FastAPI)',
      'PHP development (Laravel, Phalcon) + CRM',
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
      'Development and maintenance with WordPress and Drupal CMS',
    ],
  },
]
