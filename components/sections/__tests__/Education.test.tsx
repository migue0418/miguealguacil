import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { EducationData } from '@/lib/types'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...p}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
}))

const mockEducation: EducationData = {
  degrees: [{ id: 'd1', degree: 'Bachelor CS', institution: 'Test Uni', startYear: 2017, endYear: 2022 }],
  certifications: [{ id: 'c1', name: 'Test Cert', issuer: 'Test Issuer', year: 2024 }],
}

describe('Education', () => {
  it('renders degree name', async () => {
    const { Education } = await import('../Education')
    render(await Education({ data: mockEducation }))
    expect(screen.getByText('Bachelor CS')).toBeInTheDocument()
  })

  it('renders certification name', async () => {
    const { Education } = await import('../Education')
    render(await Education({ data: mockEducation }))
    expect(screen.getByText('Test Cert')).toBeInTheDocument()
  })
})
