import { describe, it, expect } from 'vitest'
import { getSectionAnchorId, getSectionHref } from '../navigation'
import type { SectionKey } from '../navigation'

describe('getSectionAnchorId', () => {
  it('returns the Spanish anchor id for translatable sections in es', () => {
    expect(getSectionAnchorId('es', 'projects')).toBe('proyectos')
    expect(getSectionAnchorId('es', 'experience')).toBe('experiencia')
    expect(getSectionAnchorId('es', 'education')).toBe('educacion')
    expect(getSectionAnchorId('es', 'contact')).toBe('contacto')
  })

  it('returns the English anchor id for translatable sections in en', () => {
    expect(getSectionAnchorId('en', 'projects')).toBe('projects')
    expect(getSectionAnchorId('en', 'experience')).toBe('experience')
    expect(getSectionAnchorId('en', 'education')).toBe('education')
    expect(getSectionAnchorId('en', 'contact')).toBe('contact')
  })

  it('returns invariable anchor ids for hero and stack in both locales', () => {
    const invariableSections: SectionKey[] = ['hero', 'stack']
    for (const section of invariableSections) {
      expect(getSectionAnchorId('es', section)).toBe(section)
      expect(getSectionAnchorId('en', section)).toBe(section)
    }
  })
})

describe('getSectionHref', () => {
  it('returns root + anchor for the default locale (es)', () => {
    expect(getSectionHref('es', 'hero')).toBe('/#hero')
    expect(getSectionHref('es', 'projects')).toBe('/#proyectos')
  })

  it('returns locale-prefixed path + localized anchor without trailing slash for non-default locales (en)', () => {
    expect(getSectionHref('en', 'hero')).toBe('/en#hero')
    expect(getSectionHref('en', 'contact')).toBe('/en#contact')
    expect(getSectionHref('en', 'projects')).toBe('/en#projects')
    expect(getSectionHref('en', 'experience')).toBe('/en#experience')
    expect(getSectionHref('en', 'education')).toBe('/en#education')
  })
})
