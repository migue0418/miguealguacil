import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ExperienceItem } from '@/lib/types'

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

const mockExperience: ExperienceItem[] = [
  { id: 'e1', role: 'Senior Dev', company: 'Company A', startDate: '2023-01', endDate: null, location: 'Remote', bullets: ['Built things'] },
  { id: 'e2', role: 'Junior Dev', company: 'Company B', startDate: '2021-06', endDate: '2022-12', location: 'Madrid', bullets: ['Learned things'] },
]

describe('Timeline', () => {
  it('renders all experience roles', async () => {
    const { Timeline } = await import('../Timeline')
    render(await Timeline({ experience: mockExperience }))
    expect(screen.getByText('Senior Dev')).toBeInTheDocument()
    expect(screen.getByText('Junior Dev')).toBeInTheDocument()
  })

  it('renders first item first (most recent)', async () => {
    const { Timeline } = await import('../Timeline')
    render(await Timeline({ experience: mockExperience }))
    const roles = screen.getAllByText(/Dev/)
    expect(roles[0].textContent).toBe('Senior Dev')
  })

  it('renders the section with the localized anchor id (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { Timeline } = await import('../Timeline')
    const { container } = render(await Timeline({ experience: mockExperience }))
    expect(container.querySelector('section')).toHaveAttribute('id', 'experiencia')
  })

  it('renders the section with the localized anchor id (en)', async () => {
    mockLocale.mockResolvedValue('en')
    const { Timeline } = await import('../Timeline')
    const { container } = render(await Timeline({ experience: mockExperience }))
    expect(container.querySelector('section')).toHaveAttribute('id', 'experience')
  })
})
