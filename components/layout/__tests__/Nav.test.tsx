import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))

describe('Nav', () => {
  it('renders 4 nav links', async () => {
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(4)
  })

  it('links point to section anchors', async () => {
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs.some(h => h?.startsWith('#'))).toBe(true)
  })
})
