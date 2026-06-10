import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'Agente LLM integrado en Minecraft a través de un mod personalizado. El backend gestiona el contexto del juego en tiempo real mediante WebSocket y ejecuta acciones dentro del mundo usando LangGraph.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'WebSocket', 'Java'],
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
]
