import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SmoothScroll } from '../SmoothScroll'

const lenisRaf = vi.fn()
const lenisDestroy = vi.fn()
const LenisConstructorSpy = vi.fn()

vi.mock('lenis', () => {
  class LenisMock {
    constructor(...args: unknown[]) {
      LenisConstructorSpy(...args)
    }
    raf(...args: unknown[]) {
      return lenisRaf(...args)
    }
    destroy(...args: unknown[]) {
      return lenisDestroy(...args)
    }
  }
  return { default: LenisMock }
})

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('SmoothScroll', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    LenisConstructorSpy.mockClear()
    lenisRaf.mockClear()
    lenisDestroy.mockClear()
  })

  it('does not initialize Lenis when prefers-reduced-motion: reduce is set', () => {
    mockMatchMedia(true)

    render(<SmoothScroll><div>Content</div></SmoothScroll>)
    act(() => {})

    expect(LenisConstructorSpy).not.toHaveBeenCalled()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('initializes Lenis and starts the RAF loop when prefers-reduced-motion is not set', () => {
    mockMatchMedia(false)

    render(<SmoothScroll><div>Content</div></SmoothScroll>)
    act(() => {})

    expect(LenisConstructorSpy).toHaveBeenCalledWith({ duration: 1.2, smoothWheel: true })
    expect(window.requestAnimationFrame).toHaveBeenCalled()
  })

  it('renders children', () => {
    mockMatchMedia(false)
    const { getByText } = render(<SmoothScroll><div>Content</div></SmoothScroll>)
    expect(getByText('Content')).toBeInTheDocument()
  })
})
