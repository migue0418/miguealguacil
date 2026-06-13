import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TimelineItem } from '../TimelineItem'
import type { ExperienceItem } from '@/lib/types'

const baseItem: ExperienceItem = {
  id: 'e1',
  role: 'AI Engineer',
  company: 'Acme',
  startDate: '2024-12',
  endDate: null,
  location: 'Remote',
  bullets: ['Did things'],
}

describe('TimelineItem', () => {
  it('formats the date in Spanish when locale is "es"', () => {
    render(<TimelineItem item={baseItem} presentLabel="Presente" locale="es" />)
    expect(screen.getByText(/dic 2024/i)).toBeInTheDocument()
  })

  it('formats the date in English when locale is "en"', () => {
    render(<TimelineItem item={baseItem} presentLabel="Present" locale="en" />)
    expect(screen.getByText(/Dec 2024/)).toBeInTheDocument()
    expect(screen.queryByText(/DIC/)).not.toBeInTheDocument()
  })
})
