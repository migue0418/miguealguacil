import { describe, it, expect } from 'vitest'
import { SECURITY_HEADERS } from '../security-headers'

function getHeader(key: string): string | undefined {
  return SECURITY_HEADERS.find((h) => h.key === key)?.value
}

describe('SECURITY_HEADERS', () => {
  it('includes a Content-Security-Policy with the required directives', () => {
    const csp = getHeader('Content-Security-Policy')
    expect(csp).toBeDefined()

    const expectedDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ]

    for (const directive of expectedDirectives) {
      expect(csp).toContain(directive)
    }
  })

  it('includes X-Frame-Options DENY', () => {
    expect(getHeader('X-Frame-Options')).toBe('DENY')
  })

  it('includes X-Content-Type-Options nosniff', () => {
    expect(getHeader('X-Content-Type-Options')).toBe('nosniff')
  })

  it('includes Referrer-Policy strict-origin-when-cross-origin', () => {
    expect(getHeader('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('includes a Permissions-Policy restricting camera, microphone and geolocation', () => {
    const policy = getHeader('Permissions-Policy')
    expect(policy).toBeDefined()
    expect(policy).toContain('camera=()')
    expect(policy).toContain('microphone=()')
    expect(policy).toContain('geolocation=()')
  })
})
