import { describe, it, expect } from 'vitest'
import { buildPersonJsonLd, getAbsoluteUrl, getLocalizedHomePath, SITE_URL } from '../seo'
import { getPersonal } from '@/lib/content'

describe('getLocalizedHomePath', () => {
  it('returns "/" for the default locale (es)', () => {
    expect(getLocalizedHomePath('es')).toBe('/')
  })

  it('returns "/en" for non-default locales', () => {
    expect(getLocalizedHomePath('en')).toBe('/en')
  })
})

describe('getAbsoluteUrl', () => {
  it('returns SITE_URL without trailing slash for "/"', () => {
    expect(getAbsoluteUrl('/')).toBe(SITE_URL)
  })

  it('concatenates SITE_URL with the given path', () => {
    expect(getAbsoluteUrl('/en')).toBe(`${SITE_URL}/en`)
    expect(getAbsoluteUrl('/proyectos/minecraft-butler-ai')).toBe(
      `${SITE_URL}/proyectos/minecraft-butler-ai`
    )
  })
})

describe('buildPersonJsonLd', () => {
  it('builds a schema.org Person from content/es/personal.ts', async () => {
    const personal = await getPersonal('es')
    const jsonLd = buildPersonJsonLd('es', personal)

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('Person')
    expect(jsonLd.name).toBe(personal.name)
    expect(jsonLd.jobTitle).toBe(personal.title)
    expect(jsonLd.description).toBe(personal.bio)
    expect(jsonLd.email).toBe(`mailto:${personal.email}`)
    expect(jsonLd.url).toBe(SITE_URL)
    expect(jsonLd.sameAs).toEqual([personal.linkedin, personal.github])
  })

  it('builds a Person for en with the /en home URL', async () => {
    const personal = await getPersonal('en')
    const jsonLd = buildPersonJsonLd('en', personal)

    expect(jsonLd.jobTitle).toBe(personal.title)
    expect(jsonLd.description).toBe(personal.bio)
    expect(jsonLd.url).toBe(`${SITE_URL}/en`)
  })
})
