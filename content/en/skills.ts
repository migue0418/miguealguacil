import type { SkillCategory } from '@/lib/types'

export const skills: SkillCategory[] = [
  {
    id: 'ai-data',
    category: 'AI & Data',
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
    category: 'Development',
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
    category: 'Databases',
    skills: [
      { name: 'Milvus', icon: 'Boxes' },
      { name: 'Qdrant', icon: 'Layers' },
      { name: 'SQL Server', icon: 'Server' },
      { name: 'MongoDB', icon: 'Leaf' },
      { name: 'MySQL', icon: 'Database' },
    ],
  },
  {
    id: 'tools',
    category: 'Tools',
    skills: [
      { name: 'Docker', icon: 'Container' },
      { name: 'Git', icon: 'GitBranch' },
      { name: 'GCP', icon: 'Cloud' },
      { name: 'Azure', icon: 'CloudCog' },
    ],
  },
  {
    id: 'languages',
    category: 'Languages',
    skills: [
      { name: 'Spanish (Native)', icon: 'Languages' },
      { name: 'English (C1 - Cambridge)', icon: 'Globe' },
    ],
  },
]
