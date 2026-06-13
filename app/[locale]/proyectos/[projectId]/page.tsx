import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getProjects } from '@/lib/content'
import { ProjectDetail } from '@/components/sections/ProjectDetail'
import { routing } from '@/i18n/routing'
import { getAbsoluteUrl } from '@/lib/seo'

const PROJECT_DETAIL_PATHNAME = '/proyectos/[projectId]' as const

export async function generateStaticParams() {
  const params: { locale: string; projectId: string }[] = []

  for (const locale of routing.locales) {
    const projects = await getProjects(locale)
    for (const project of projects) {
      params.push({ locale, projectId: project.id })
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>
}): Promise<Metadata> {
  const { locale, projectId } = await params

  const projects = await getProjects(locale)
  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    return {}
  }

  const pathnamesForRoute = routing.pathnames[PROJECT_DETAIL_PATHNAME]

  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    const localizedPath = pathnamesForRoute[loc].replace('[projectId]', projectId)
    languages[loc] = loc === routing.defaultLocale ? localizedPath : `/${loc}${localizedPath}`
  }

  return {
    title: project.name,
    description: project.description,
    alternates: {
      languages,
    },
    openGraph: {
      title: project.name,
      description: project.description,
      url: getAbsoluteUrl(languages[locale]),
      siteName: 'miguealguacil',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.name,
      description: project.description,
    },
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>
}) {
  const { locale, projectId } = await params
  setRequestLocale(locale)

  const projects = await getProjects(locale)
  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    notFound()
  }

  return <ProjectDetail project={project} />
}
