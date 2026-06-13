import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockLocale = vi.fn(async () => 'es')

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: () => mockLocale(),
}))

describe('Nav', () => {
  it('renders 5 nav links', async () => {
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })

  it('links point to home anchors for the default locale (es)', async () => {
    mockLocale.mockResolvedValue('es')
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toEqual([
      '/#proyectos',
      '/#stack',
      '/#experiencia',
      '/#educacion',
      '/#contacto',
    ])
  })

  it('links point to locale-prefixed home anchors for non-default locale (en)', async () => {
    mockLocale.mockResolvedValue('en')
    const { Nav } = await import('../Nav')
    const navOutput = await Nav()
    render(navOutput)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toEqual([
      '/en#projects',
      '/en#stack',
      '/en#experience',
      '/en#education',
      '/en#contact',
    ])
  })
})
