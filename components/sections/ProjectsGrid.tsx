import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
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
  }

  return (
    <section id="proyectos" className="py-24 max-w-[1100px] mx-auto px-6">
      <SlideUp>
        <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-primary mb-3">
          {t('projects')}
        </h2>
      </SlideUp>
      <FadeIn delay={0.1}>
        <p className="text-muted text-lg mb-12">{t('projects_subtitle')}</p>
      </FadeIn>
      <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <AnimatedProjectCard key={project.id} project={project} labels={labels} />
        ))}
      </StaggerChildren>
    </section>
  )
}
