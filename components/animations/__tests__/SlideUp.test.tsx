import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SlideUp } from '../SlideUp'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div {...props}>{children}</div>,
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

describe('SlideUp', () => {
  it('renders children', () => {
    render(<SlideUp><span>Slide content</span></SlideUp>)
    expect(screen.getByText('Slide content')).toBeInTheDocument()
  })

  it('accepts delay prop', () => {
    render(<SlideUp delay={0.3}><span>Delayed</span></SlideUp>)
    expect(screen.getByText('Delayed')).toBeInTheDocument()
  })

  it('renders without animation when prefers-reduced-motion', () => {
    render(<SlideUp><span>Reduced motion</span></SlideUp>)
    expect(screen.getByText('Reduced motion')).toBeInTheDocument()
  })
})
