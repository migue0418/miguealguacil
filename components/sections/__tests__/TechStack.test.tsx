import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { SkillCategory } from '@/lib/types'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...p}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
}))

const mockSkills: SkillCategory[] = [
  {
    id: 'ai-data',
    category: 'IA & Datos',
    skills: [
      { name: 'LangChain', icon: 'Workflow' },
      { name: 'Python', icon: 'Code' },
    ],
  },
  {
    id: 'tools',
    category: 'Herramientas',
    skills: [{ name: 'Docker', icon: 'Container' }],
  },
]

describe('TechStack', () => {
  it('renders all category names', async () => {
    const { TechStack } = await import('../TechStack')
    render(await TechStack({ skills: mockSkills }))
    expect(screen.getByText('IA & Datos')).toBeInTheDocument()
    expect(screen.getByText('Herramientas')).toBeInTheDocument()
  })

  it('renders all skill chips', async () => {
    const { TechStack } = await import('../TechStack')
    render(await TechStack({ skills: mockSkills }))
    expect(screen.getByText('LangChain')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('Docker')).toBeInTheDocument()
  })

  it('renders the section heading with [02]', async () => {
    const { TechStack } = await import('../TechStack')
    render(await TechStack({ skills: mockSkills }))
    expect(screen.getByText('[02]')).toBeInTheDocument()
  })
})
