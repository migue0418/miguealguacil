import { describe, it, expect } from 'vitest'
import robots from '../robots'
import { SITE_URL } from '@/lib/seo'

describe('robots', () => {
  it('allows all user agents and references the sitemap', () => {
    const result = robots()

    expect(result.rules).toEqual({ userAgent: '*', allow: '/' })
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
  })
})
