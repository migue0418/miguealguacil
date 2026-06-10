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

const mockProjects: Project[] = [
  { id: 'p1', name: 'Project Alpha', description: 'Alpha desc', stack: ['Python'], featured: true, repoUrl: 'https://github.com/test/alpha' },
  { id: 'p2', name: 'Project Beta', description: 'Beta desc', stack: ['React'], featured: true, repoUrl: 'https://github.com/test/beta' },
]

describe('ProjectsGrid', () => {
  it('renders all project names', async () => {
    const { ProjectsGrid } = await import('../ProjectsGrid')
    render(await ProjectsGrid({ projects: mockProjects }))
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    expect(screen.getByText('Project Beta')).toBeInTheDocument()
  })

  it('renders the section title', async () => {
    const { ProjectsGrid } = await import('../ProjectsGrid')
    render(await ProjectsGrid({ projects: mockProjects }))
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})
