import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PersonalInfo } from '@/lib/types'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div {...p}>{children}</div>,
  },
  useInView: () => true,
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useReducedMotion: () => true,
}))

const mockPersonal: PersonalInfo = {
  name: 'Test User',
  title: 'Dev',
  bio: 'Bio',
  email: 'test@example.com',
  linkedin: 'https://linkedin.com/in/test',
  github: 'https://github.com/test',
  location: 'City',
}

describe('Contact', () => {
  it('renders email link', async () => {
    const { Contact } = await import('../Contact')
    render(await Contact({ personal: mockPersonal }))
    const emailLink = screen.getByRole('link', { name: /email/i })
    expect(emailLink).toHaveAttribute('href', 'mailto:test@example.com')
  })

  it('renders linkedin link', async () => {
    const { Contact } = await import('../Contact')
    render(await Contact({ personal: mockPersonal }))
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs.some(h => h?.includes('linkedin'))).toBe(true)
  })

  it('renders github link', async () => {
    const { Contact } = await import('../Contact')
    render(await Contact({ personal: mockPersonal }))
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs.some(h => h?.includes('github'))).toBe(true)
  })
})
