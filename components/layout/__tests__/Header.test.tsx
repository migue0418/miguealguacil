import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'

const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))

vi.mock('@/lib/content', () => ({
  getPersonal: async () => ({
    name: 'Test User',
    title: 'AI Engineer',
    bio: 'Test bio',
    email: 'test@example.com',
    linkedin: 'https://linkedin.com/in/test',
    github: 'https://github.com/test',
    location: 'Test City',
    cvUrl: '/cv/cv-miguel-benitez-es.pdf',
  }),
}))

vi.mock('../Nav', () => ({
  Nav: () => <nav data-testid="nav-mock" />,
}))
vi.mock('../MobileNav', () => ({
  MobileNav: () => <nav data-testid="mobile-nav-mock" />,
}))
vi.mock('../MobileMenuToggle', () => ({
  MobileMenuToggle: ({ children }: { children: ReactNode }) => (
    <div data-testid="mobile-menu-toggle-mock">{children}</div>
  ),
}))
vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle-mock" />,
}))
vi.mock('../LocaleToggle', () => ({
  LocaleToggle: () => <button data-testid="locale-toggle-mock" />,
}))

describe('Header', () => {
  it('renders the logo link pointing to the home hero anchor for the default locale (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { Header } = await import('../Header')
    render(await Header())
    const logo = screen.getByRole('link', { name: 'miguealguacil' })
    expect(logo).toHaveAttribute('href', '/#hero')
  })

  it('renders the logo link pointing to the locale-prefixed hero anchor for non-default locale (en)', async () => {
    mockLocale.mockResolvedValue('en')
    const { Header } = await import('../Header')
    render(await Header())
    const logo = screen.getByRole('link', { name: 'miguealguacil' })
    expect(logo).toHaveAttribute('href', '/en#hero')
  })
})
