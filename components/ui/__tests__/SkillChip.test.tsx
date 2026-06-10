import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SkillChip } from '../SkillChip'

describe('SkillChip', () => {
  it('renders the skill name', () => {
    render(<SkillChip name="Python" icon="Code" />)
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('renders an icon when a valid lucide icon name is given', () => {
    const { container } = render(<SkillChip name="Python" icon="Code" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders only the label when the icon name is invalid, without crashing', () => {
    const { container } = render(<SkillChip name="Mystery Tech" icon="NotARealIcon" />)
    expect(screen.getByText('Mystery Tech')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })
})
