'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface MobileMenuToggleProps {
  children: ReactNode
  openLabel: string
  closeLabel: string
}

export function MobileMenuToggle({ children, openLabel, closeLabel }: MobileMenuToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const firstLink = panelRef.current?.querySelector<HTMLAnchorElement>('a')
      firstLink?.focus()
    }
  }, [isOpen])

  function handlePanelClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('a')) {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label={isOpen ? closeLabel : openLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-none text-muted hover:text-accent transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {isOpen ? (
            <>
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </>
          ) : (
            <>
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        // top-16 coincide con la altura h-16 del Header (ver Header.tsx)
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          onClick={handlePanelClick}
          className="fixed top-16 left-0 right-0 z-40 bg-surface border-b border-default rounded-none shadow-sm"
        >
          {children}
        </div>
      )}
    </div>
  )
}
