/**
 * Content-Security-Policy en una sola línea, patrón "Without Nonces" para
 * apps estáticas (SSG) — ver
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
 */
const CONTENT_SECURITY_POLICY =
  [
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
  ].join('; ') + ';'

/**
 * Cabeceras de seguridad HTTP estáticas aplicadas a todas las rutas
 * (`source: '/(.*)'` en next.config.ts `headers()`). Sin Proxy/nonces,
 * preserva el SSG.
 */
export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
]
