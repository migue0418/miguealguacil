import type { PersonalInfo } from '@/lib/types'
import { routing } from '@/i18n/routing'

/** URL absoluta del sitio en producción. Única fuente de verdad para
 *  metadataBase, sitemap, robots, OG image y JSON-LD. */
export const SITE_URL = 'https://miguealguacil.com'

/**
 * Devuelve el path absoluto (relativo a SITE_URL, sin dominio) de la home
 * para `locale`, siguiendo la misma convención ya usada en
 * app/[locale]/page.tsx (`/` para el locale por defecto, `/en` para el resto).
 */
export function getLocalizedHomePath(locale: string): string {
  return locale === routing.defaultLocale ? '/' : `/${locale}`
}

/**
 * Devuelve la URL absoluta (SITE_URL + path) para `path` (que ya viene con
 * '/' inicial). Evita la doble barra cuando path === '/'.
 */
export function getAbsoluteUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}

export interface PersonJsonLd {
  '@context': 'https://schema.org'
  '@type': 'Person'
  name: string
  jobTitle: string
  description: string
  email: string
  url: string
  sameAs: string[]
}

/**
 * Construye el objeto JSON-LD `Person` (schema.org) para `locale`, a partir
 * de content/{locale}/personal.ts.
 */
export function buildPersonJsonLd(locale: string, personal: PersonalInfo): PersonJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personal.name,
    jobTitle: personal.title,
    description: personal.bio,
    email: `mailto:${personal.email}`,
    url: getAbsoluteUrl(getLocalizedHomePath(locale)),
    sameAs: [personal.linkedin, personal.github],
  }
}
