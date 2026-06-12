import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Project } from '@/lib/types'
import { ProjectCard } from '../ProjectCard'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const mockProject: Project = {
  id: 'tfm-sexism-classifier',
  name: 'TFM Project',
  description: 'Short description',
  stack: ['Python'],
  repoUrl: 'https://github.com/test/tfm',
  featured: true,
}

const labels = {
  viewRepo: 'View repository',
  viewBackend: 'Backend',
  viewMod: 'Mod',
  viewDemo: 'View demo',
  viewDetails: 'View details',
}

describe('ProjectCard', () => {
  it('renders a stretched link to the project detail page that is hidden from assistive tech', () => {
    render(<ProjectCard project={mockProject} index="01" labels={labels} />)
    const links = screen.getAllByRole('link', { hidden: true })
    const stretched = links.find(
      (l) => l.getAttribute('href') === '/proyectos/tfm-sexism-classifier' && l.getAttribute('aria-hidden') === 'true',
    )
    expect(stretched).toBeDefined()
    expect(stretched).toHaveAttribute('tabindex', '-1')
  })

  it('renders a visible, focusable "View details" CTA pointing to the detail page', () => {
    render(<ProjectCard project={mockProject} index="01" labels={labels} />)
    const cta = screen.getByRole('link', { name: 'View details' })
    expect(cta).toHaveAttribute('href', '/proyectos/tfm-sexism-classifier')
    expect(cta).not.toHaveAttribute('aria-hidden')
    expect(cta).not.toHaveAttribute('tabindex', '-1')
  })

  it('keeps external links (repo) focusable and opening in a new tab', () => {
    render(<ProjectCard project={mockProject} index="01" labels={labels} />)
    const repoLink = screen.getByRole('link', { name: 'View repository' })
    expect(repoLink).toHaveAttribute('href', 'https://github.com/test/tfm')
    expect(repoLink).toHaveAttribute('target', '_blank')
  })
})
