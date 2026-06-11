import type { SkillCategory } from '@/lib/types'

export const skills: SkillCategory[] = [
  {
    id: 'ai-data',
    category: 'IA & Datos',
    skills: [
      { name: 'LangChain', icon: 'Workflow' },
      { name: 'LangGraph', icon: 'GitGraph' },
      { name: 'RAG', icon: 'Database' },
      { name: 'PyTorch', icon: 'Flame' },
      { name: 'TensorFlow', icon: 'Hexagon' },
    ],
  },
  {
    id: 'development',
    category: 'Desarrollo',
    skills: [
      { name: 'Python', icon: 'Code' },
      { name: 'FastAPI', icon: 'Zap' },
      { name: 'React', icon: 'Atom' },
      { name: 'TypeScript', icon: 'FileCode' },
      { name: 'Next.js', icon: 'Triangle' },
    ],
  },
  {
    id: 'databases',
    category: 'Bases de Datos',
    skills: [
      { name: 'SQL Server', icon: 'Server' },
      { name: 'MySQL', icon: 'Database' },
      { name: 'MongoDB', icon: 'Leaf' },
      { name: 'Milvus', icon: 'Boxes' },
      { name: 'Qdrant', icon: 'Layers' },
    ],
  },
  {
    id: 'tools',
    category: 'Herramientas',
    skills: [
      { name: 'Docker', icon: 'Container' },
      { name: 'Git', icon: 'GitBranch' },
      { name: 'GCP', icon: 'Cloud' },
      { name: 'Azure', icon: 'CloudCog' },
    ],
  },
  {
    id: 'languages',
    category: 'Idiomas',
    skills: [
      { name: 'Español (Nativo)', icon: 'Languages' },
      { name: 'Inglés (C1 - Cambridge)', icon: 'Globe' },
    ],
  },
]
