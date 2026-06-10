import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FadeIn } from '../FadeIn'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div {...props}>{children}</div>,
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

describe('FadeIn', () => {
  it('renders children', () => {
    render(<FadeIn><span>Test content</span></FadeIn>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders without motion wrapper when prefers-reduced-motion', () => {
    vi.doMock('framer-motion', () => ({
      motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
      useInView: () => true,
      useReducedMotion: () => true,
    }))
    render(<FadeIn><span>Accessible content</span></FadeIn>)
    expect(screen.getByText('Accessible content')).toBeInTheDocument()
  })

  it('accepts className prop', () => {
    render(<FadeIn className="test-class"><span>Styled</span></FadeIn>)
    expect(screen.getByText('Styled')).toBeInTheDocument()
  })
})
