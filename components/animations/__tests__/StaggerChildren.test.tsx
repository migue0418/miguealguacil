import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { StaggerChildren } from '../StaggerChildren'

vi.mock('framer-motion', async () => {
  const { forwardRef } = await import('react')
  return {
    motion: {
      div: forwardRef<HTMLDivElement, {
        children?: ReactNode
        initial?: unknown
        animate?: unknown
        className?: string
      }>(({ children, initial, animate, className }, ref) => (
        <div
          ref={ref}
          data-testid="motion-wrapper"
          data-initial={JSON.stringify(initial)}
          data-animate={JSON.stringify(animate)}
          className={className}
        >
          {children}
        </div>
      )),
    },
    useInView: () => true,
    useReducedMotion: vi.fn(() => false),
  }
})

function mockRect(rect: Partial<DOMRect>) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
    toJSON: () => '',
    ...rect,
  } as DOMRect)
}

describe('StaggerChildren', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  it('renders all children', () => {
    mockRect({ top: 2000, bottom: 2100 })
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
    mockRect({ top: 2000, bottom: 2100 })
    render(<StaggerChildren staggerDelay={0.2}><span>Item</span></StaggerChildren>)
    expect(screen.getByText('Item')).toBeInTheDocument()
  })

  it('renders statically (no FOIC) when container is already in viewport at mount', () => {
    mockRect({ top: 0, bottom: 100 })
    render(
      <StaggerChildren>
        <span>Child 1</span>
        <span>Child 2</span>
        <span>Child 3</span>
      </StaggerChildren>
    )

    const wrapper = screen.getByTestId('motion-wrapper')
    expect(wrapper.dataset.initial).toBe('false')
    expect(wrapper.dataset.animate).toBe('"visible"')
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  it('animates in from hidden when container is off-screen at mount', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<StaggerChildren><span>Below fold</span></StaggerChildren>)

    const wrapper = screen.getByTestId('motion-wrapper')
    expect(wrapper.dataset.initial).toBe('"hidden"')
    expect(screen.getByText('Below fold')).toBeInTheDocument()
  })

  it('renders without animation when prefers-reduced-motion', () => {
    mockRect({ top: 2000, bottom: 2100 })
    vi.mocked(useReducedMotion).mockReturnValueOnce(true)
    render(<StaggerChildren><span>Accessible</span></StaggerChildren>)
    expect(screen.getByText('Accessible')).toBeInTheDocument()
    expect(screen.queryByTestId('motion-wrapper')).not.toBeInTheDocument()
  })
})
