import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Project } from '@/lib/types'

const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...p}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
}))
type LinkHref = string | { pathname: string; params?: Record<string, string> }

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: React.ComponentProps<'a'> & { href: LinkHref }) => {
    const resolvedHref =
      typeof href === 'string'
        ? href
        : href.pathname.replace(/\[(\w+)\]/g, (_match, key: string) => href.params?.[key] ?? '')
    return <a href={resolvedHref} {...rest}>{children}</a>
  },
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

  it('renders a "view details" link for each project pointing to its detail page', async () => {
    const { ProjectsGrid } = await import('../ProjectsGrid')
    render(await ProjectsGrid({ projects: mockProjects }))
    const links = screen.getAllByRole('link', { name: 'view_details' })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/proyectos/p1')
    expect(links[1]).toHaveAttribute('href', '/proyectos/p2')
  })

  it('renders the section with the localized anchor id (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { ProjectsGrid } = await import('../ProjectsGrid')
    const { container } = render(await ProjectsGrid({ projects: mockProjects }))
    expect(container.querySelector('section')).toHaveAttribute('id', 'proyectos')
  })

  it('renders the section with the localized anchor id (en)', async () => {
    mockLocale.mockResolvedValue('en')
    const { ProjectsGrid } = await import('../ProjectsGrid')
    const { container } = render(await ProjectsGrid({ projects: mockProjects }))
    expect(container.querySelector('section')).toHaveAttribute('id', 'projects')
  })
})
