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
]
