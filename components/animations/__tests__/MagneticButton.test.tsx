import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MagneticButton } from '../MagneticButton'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div {...props}>{children}</div>,
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useReducedMotion: () => false,
}))

describe('MagneticButton', () => {
  it('renders children', () => {
    render(<MagneticButton><button>Click me</button></MagneticButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders children without crashing when no pointer events', () => {
    render(<MagneticButton><span>Static</span></MagneticButton>)
    expect(screen.getByText('Static')).toBeInTheDocument()
  })

  it('accepts onClick on children', () => {
    const onClick = vi.fn()
    render(<MagneticButton><button onClick={onClick}>Action</button></MagneticButton>)
    expect(screen.getByText('Action')).toBeInTheDocument()
  })
})
