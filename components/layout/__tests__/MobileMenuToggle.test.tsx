import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MobileMenuToggle } from '../MobileMenuToggle'

function renderToggle() {
  return render(
    <MobileMenuToggle openLabel="Open menu" closeLabel="Close menu">
      <nav>
        <a href="#proyectos">PROYECTOS</a>
        <a href="#stack">STACK</a>
      </nav>
    </MobileMenuToggle>,
  )
}

describe('MobileMenuToggle', () => {
  it('starts closed and opens/closes the panel on button click', () => {
    renderToggle()
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'PROYECTOS' })).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-label', 'Close menu')
    expect(screen.getByRole('link', { name: 'PROYECTOS' })).toBeInTheDocument()

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'PROYECTOS' })).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the button', () => {
    renderToggle()
    const button = screen.getByRole('button', { name: 'Open menu' })

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'PROYECTOS' })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(button)
  })

  it('closes the panel when clicking an internal link', () => {
    renderToggle()
    const button = screen.getByRole('button', { name: 'Open menu' })

    fireEvent.click(button)
    const link = screen.getByRole('link', { name: 'PROYECTOS' })
    fireEvent.click(link)

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'PROYECTOS' })).not.toBeInTheDocument()
  })
})
