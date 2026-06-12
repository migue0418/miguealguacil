import { notFound } from 'next/navigation'
import { getProjects } from '@/lib/content'
import { ProjectDetail } from '@/components/sections/ProjectDetail'
import { routing } from '@/i18n/routing'

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

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>
}) {
  const { locale, projectId } = await params

  const projects = await getProjects(locale)
  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    notFound()
  }

  return <ProjectDetail project={project} />
}
