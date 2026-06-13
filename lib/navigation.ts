import { routing } from '@/i18n/routing'

/**
 * Claves canónicas de sección, en inglés, iguales a las claves de
 * traducción `nav.*` en `messages/{es,en}.json` (`projects`, `stack`,
 * `experience`, `education`, `contact`), más `hero`.
 */
export type SectionKey = 'hero' | 'projects' | 'stack' | 'experience' | 'education' | 'contact'

type Locale = (typeof routing.locales)[number]

/**
 * Mapa de cada `SectionKey` al `id` HTML real de la sección en cada locale.
 * `hero` y `stack` son identificadores técnicos invariables; el resto se
 * traduce para que la URL/ancla esté en el idioma del locale activo
 * (p. ej. `/en#projects` en lugar de `/en#proyectos`).
 */
const SECTION_ANCHORS: Record<SectionKey, Record<Locale, string>> = {
  hero: { es: 'hero', en: 'hero' },
  projects: { es: 'proyectos', en: 'projects' },
  stack: { es: 'stack', en: 'stack' },
  experience: { es: 'experiencia', en: 'experience' },
  education: { es: 'educacion', en: 'education' },
  contact: { es: 'contacto', en: 'contact' },
}

/**
 * Devuelve el `id` HTML de la sección `sectionKey` en el idioma de `locale`.
 * Si `locale` no es uno de `routing.locales`, recurre a
 * `routing.defaultLocale` (mismo criterio de fallback que `getSectionHref`).
 */
export function getSectionAnchorId(locale: string, sectionKey: SectionKey): string {
  const anchors = SECTION_ANCHORS[sectionKey]
  return anchors[locale as Locale] ?? anchors[routing.defaultLocale]
}

/**
 * Devuelve el href a la home del locale activo seguido del ancla de sección
 * localizada, de forma que funcione tanto desde la home (scroll suave) como
 * desde cualquier otra página (navegación completa a la home + ancla).
 *
 * - locale por defecto (`es`, sin prefijo): `/#<ancla-es>`
 * - otros locales (`en`): `/en#<ancla-en>` (sin barra antes de `#`, para que
 *   el pathname coincida exactamente con `/en` y se evite un redirect 308
 *   por trailing slash al navegar dentro de la home).
 *
 * El ancla devuelta coincide exactamente con el `id` HTML de la sección
 * destino para ese locale (ver `getSectionAnchorId` / `SECTION_ANCHORS`).
 */
export function getSectionHref(locale: string, sectionKey: SectionKey): string {
  const home = locale === routing.defaultLocale ? '/' : `/${locale}`
  return `${home}#${getSectionAnchorId(locale, sectionKey)}`
}
