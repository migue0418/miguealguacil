import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SectionHeading } from '../SectionHeading'

describe('SectionHeading', () => {
  it('renders the section number in brackets', () => {
    render(<SectionHeading number="01" title="Proyectos" />)
    expect(screen.getByText('[01]')).toBeInTheDocument()
  })

  it('renders the section title as a level-2 heading', () => {
    render(<SectionHeading number="01" title="Proyectos" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Proyectos')
  })
})
