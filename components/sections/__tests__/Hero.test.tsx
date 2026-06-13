import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PersonalInfo } from '@/lib/types'

const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...p}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
}))

const mockPersonal: PersonalInfo = {
  name: 'Test User',
  title: 'AI Engineer',
  bio: 'Test bio here',
  email: 'test@example.com',
  linkedin: 'https://linkedin.com/in/test',
  github: 'https://github.com/test',
  location: 'Test City',
  cvUrl: '/cv/cv-miguel-benitez-es.pdf',
}

describe('Hero', () => {
  it('renders the name', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('renders the bio', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByText('Test bio here')).toBeInTheDocument()
  })

  it('renders the title', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByText('AI Engineer')).toBeInTheDocument()
  })

  it('renders the CV download CTA with correct href and download attribute', async () => {
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    const cvLink = screen.getByRole('link', { name: 'cta_cv' })
    expect(cvLink).toHaveAttribute('href', '/cv/cv-miguel-benitez-es.pdf')
    expect(cvLink).toHaveAttribute('download')
  })

  it('renders cta_projects and cta_contact hrefs as home anchors for the default locale (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByRole('link', { name: 'cta_projects' })).toHaveAttribute('href', '/#proyectos')
    expect(screen.getByRole('link', { name: 'cta_contact' })).toHaveAttribute('href', '/#contacto')
  })

  it('renders cta_projects and cta_contact hrefs as locale-prefixed home anchors for non-default locale (en)', async () => {
    mockLocale.mockResolvedValue('en')
    const { Hero } = await import('../Hero')
    render(await Hero({ personal: mockPersonal }))
    expect(screen.getByRole('link', { name: 'cta_projects' })).toHaveAttribute('href', '/en#projects')
    expect(screen.getByRole('link', { name: 'cta_contact' })).toHaveAttribute('href', '/en#contact')
  })
})
