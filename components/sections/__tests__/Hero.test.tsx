import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PersonalInfo } from '@/lib/types'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
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
})
