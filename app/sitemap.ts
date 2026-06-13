import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getProjects } from '@/lib/content'
import { getAbsoluteUrl, getLocalizedHomePath } from '@/lib/seo'

const PROJECT_DETAIL_PATHNAME = '/proyectos/[projectId]' as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  const lastModified = new Date()

  for (const locale of routing.locales) {
    const languages: Record<string, string> = {}
    for (const loc of routing.locales) {
      languages[loc] = getAbsoluteUrl(getLocalizedHomePath(loc))
    }

    entries.push({
      url: getAbsoluteUrl(getLocalizedHomePath(locale)),
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
      alternates: { languages },
    })
  }

  const pathnamesForRoute = routing.pathnames[PROJECT_DETAIL_PATHNAME]

  for (const locale of routing.locales) {
    const projects = await getProjects(locale)

    for (const project of projects) {
      const languages: Record<string, string> = {}
      for (const loc of routing.locales) {
        const localizedPath = pathnamesForRoute[loc].replace('[projectId]', project.id)
        const path = loc === routing.defaultLocale ? localizedPath : `/${loc}${localizedPath}`
        languages[loc] = getAbsoluteUrl(path)
      }

      const currentPath = pathnamesForRoute[locale].replace('[projectId]', project.id)
      const url = locale === routing.defaultLocale ? currentPath : `/${locale}${currentPath}`

      entries.push({
        url: getAbsoluteUrl(url),
        lastModified,
        changeFrequency: 'yearly',
        priority: 0.7,
        alternates: { languages },
      })
    }
  }

  return entries
}
