import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ThemeToggle } from '../ThemeToggle'

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn(), resolvedTheme: 'dark' }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(performance.now())
      return 0
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a button with aria-label after mount', () => {
    render(<ThemeToggle />)
    act(() => {})
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label')
  })
})
