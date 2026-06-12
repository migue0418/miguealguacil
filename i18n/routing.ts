import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'] as const,
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  pathnames: {
    '/proyectos/[projectId]': {
      es: '/proyectos/[projectId]',
      en: '/projects/[projectId]',
    },
  },
})
