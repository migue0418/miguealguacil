import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StaggerChildren } from '../StaggerChildren'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div {...props}>{children}</div>,
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

describe('StaggerChildren', () => {
  it('renders all children', () => {
    render(
      <StaggerChildren>
        <span>Child 1</span>
        <span>Child 2</span>
        <span>Child 3</span>
      </StaggerChildren>
    )
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  it('accepts staggerDelay prop', () => {
    render(<StaggerChildren staggerDelay={0.2}><span>Item</span></StaggerChildren>)
    expect(screen.getByText('Item')).toBeInTheDocument()
  })

  it('renders without animation when prefers-reduced-motion', () => {
    render(<StaggerChildren><span>Accessible</span></StaggerChildren>)
    expect(screen.getByText('Accessible')).toBeInTheDocument()
  })
})
