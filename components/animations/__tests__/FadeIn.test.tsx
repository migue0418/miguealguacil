import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { FadeIn } from '../FadeIn'

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

describe('FadeIn', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  it('renders children', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<FadeIn><span>Test content</span></FadeIn>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders statically (no FOIC) when element is already in viewport at mount (Hero case)', () => {
    mockRect({ top: 0, bottom: 100 })
    render(<FadeIn><span>Hero content</span></FadeIn>)

    const wrapper = screen.getByTestId('motion-wrapper')
    expect(screen.getByText('Hero content')).toBeInTheDocument()
    expect(wrapper.dataset.initial).toBe('false')
    expect(wrapper.dataset.animate).toBeUndefined()
  })

  it('animates in from hidden when element is off-screen at mount', () => {
    mockRect({ top: 2000, bottom: 2100 })
    render(<FadeIn><span>Below fold content</span></FadeIn>)

    const wrapper = screen.getByTestId('motion-wrapper')
    expect(screen.getByText('Below fold content')).toBeInTheDocument()
    expect(wrapper.dataset.initial).toBe('{"opacity":0}')
  })

  it('renders without motion wrapper when prefers-reduced-motion', () => {
    mockRect({ top: 2000, bottom: 2100 })
    vi.mocked(useReducedMotion).mockReturnValueOnce(true)
    render(<FadeIn><span>Accessible content</span></FadeIn>)
    expect(screen.getByText('Accessible content')).toBeInTheDocument()
    expect(screen.queryByTestId('motion-wrapper')).not.toBeInTheDocument()
  })

  it('accepts className prop', () => {
    mockRect({ top: 0, bottom: 100 })
    render(<FadeIn className="test-class"><span>Styled</span></FadeIn>)
    expect(screen.getByTestId('motion-wrapper')).toHaveClass('test-class')
  })
})
