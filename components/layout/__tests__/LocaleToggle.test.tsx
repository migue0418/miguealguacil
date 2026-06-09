import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LocaleToggle } from '../LocaleToggle'

vi.mock('next-intl', () => ({
  useLocale: () => 'es',
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}))

describe('LocaleToggle', () => {
  it('renders a button', () => {
    render(<LocaleToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows active locale', () => {
    render(<LocaleToggle />)
    expect(screen.getByText(/ES/i)).toBeInTheDocument()
  })
})
