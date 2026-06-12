import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Project } from '@/lib/types'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: async () => 'es',
}))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...p}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
}))
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} {...rest} />
  ),
}))

const baseProject: Project = {
  id: 'fastapi-react-template',
  name: 'FastAPI + React Template',
  description: 'A full stack template.',
  stack: ['Python', 'FastAPI'],
  repoUrl: 'https://github.com/test/fastapi-react-template',
  featured: true,
}

const fullProject: Project = {
  id: 'tfm-sexism-classifier',
  name: 'TFM Project',
  description: 'Short description fallback.',
  stack: ['Python', 'PyTorch'],
  repoUrl: 'https://github.com/test/tfm',
  featured: true,
  detail: {
    summary: ['First summary paragraph.', 'Second summary paragraph.'],
    sections: [
      { heading: 'Datasets', paragraphs: ['Datasets paragraph.'] },
      { heading: 'Methodology', paragraphs: ['Methodology paragraph.'] },
    ],
    results: [{ label: 'F1 score', value: '0.843' }],
    links: [{ label: 'Thesis (PDF)', url: 'https://example.com/thesis.pdf' }],
  },
}

const projectWithImages: Project = {
  id: 'tfm-sexism-classifier',
  name: 'TFM Project',
  description: 'Short description fallback.',
  stack: ['Python', 'PyTorch'],
  repoUrl: 'https://github.com/test/tfm',
  featured: true,
  detail: {
    summary: ['Summary paragraph.'],
    images: [
      {
        src: '/images/projects/tfm-sexism-classifier/binary-results-diagram.png',
        alt: 'F1 comparison chart',
        caption: 'F1 (macro) comparison by model and dataset',
        width: 3600,
        height: 1800,
      },
      {
        src: '/images/projects/tfm-sexism-classifier/login-page.png',
        alt: 'Application login screen',
        caption: 'Login screen, dark theme',
        width: 1920,
        height: 945,
      },
      {
        src: '/images/projects/tfm-sexism-classifier/analytics-global.png',
        alt: 'Global analytics dashboard',
        width: 1916,
        height: 939,
      },
    ],
  },
}

describe('ProjectDetail', () => {
  it('renders the project name and stack chips', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: baseProject }))
    expect(screen.getByRole('heading', { name: 'FastAPI + React Template' })).toBeInTheDocument()
    expect(screen.getByText('FastAPI')).toBeInTheDocument()
  })

  it('falls back to description as overview when detail is missing', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: baseProject }))
    expect(screen.getByText('A full stack template.')).toBeInTheDocument()
    expect(screen.queryByText('results')).not.toBeInTheDocument()
    expect(screen.queryByText('links')).not.toBeInTheDocument()
  })

  it('renders detail.summary paragraphs when present', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    expect(screen.getByText('First summary paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second summary paragraph.')).toBeInTheDocument()
  })

  it('renders detail.sections with heading and paragraphs in order', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual(['Datasets', 'Methodology'])
    expect(screen.getByText('Datasets paragraph.')).toBeInTheDocument()
  })

  it('renders detail.results as a stat grid', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    expect(screen.getByText('F1 score')).toBeInTheDocument()
    expect(screen.getByText('0.843')).toBeInTheDocument()
  })

  it('renders detail.links as external links opening in a new tab', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    const link = screen.getByRole('link', { name: /Thesis \(PDF\)/ })
    expect(link).toHaveAttribute('href', 'https://example.com/thesis.pdf')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders detail.images as a screenshots gallery with captions', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: projectWithImages }))

    expect(screen.getByRole('heading', { name: 'screenshots' })).toBeInTheDocument()

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(3)
    expect(screen.getByAltText('F1 comparison chart')).toBeInTheDocument()
    expect(screen.getByAltText('Application login screen')).toBeInTheDocument()
    expect(screen.getByAltText('Global analytics dashboard')).toBeInTheDocument()

    expect(screen.getByText('F1 (macro) comparison by model and dataset')).toBeInTheDocument()
    expect(screen.getByText('Login screen, dark theme')).toBeInTheDocument()
  })

  it('does not render a screenshots section when detail.images is missing', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: fullProject }))
    expect(screen.queryByRole('heading', { name: 'screenshots' })).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders a back link to the projects section', async () => {
    const { ProjectDetail } = await import('../ProjectDetail')
    render(await ProjectDetail({ project: baseProject }))
    const back = screen.getByRole('link', { name: 'back' })
    expect(back).toHaveAttribute('href', '/#proyectos')
  })
})
