import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { AnimatedProjectCard } from '@/components/ui/AnimatedProjectCard'
import type { Project } from '@/lib/types'

interface ProjectsGridProps {
  projects: Project[]
}

export async function ProjectsGrid({ projects }: ProjectsGridProps) {
  const t = await getTranslations('sections')
  const tp = await getTranslations('project')

  const labels = {
    viewRepo: tp('view_repo'),
    viewBackend: tp('view_backend'),
    viewMod: tp('view_mod'),
    viewDemo: tp('view_demo'),
    viewDetails: tp('view_details'),
  }

  return (
    <section id="proyectos" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="01" title={t('projects')} />
      <FadeIn delay={0.1}>
        <p className="text-muted text-lg mb-12">{t('projects_subtitle')}</p>
      </FadeIn>
      <StaggerChildren className="flex flex-col border-b border-default">
        {projects.map((project, i) => (
          <AnimatedProjectCard
            key={project.id}
            project={project}
            index={String(i + 1).padStart(2, '0')}
            labels={labels}
          />
        ))}
      </StaggerChildren>
    </section>
  )
}
