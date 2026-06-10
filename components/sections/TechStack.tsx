import { getTranslations } from 'next-intl/server'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import { AnimatedSkillChip } from '@/components/ui/AnimatedSkillChip'
import type { SkillCategory } from '@/lib/types'

interface TechStackProps {
  skills: SkillCategory[]
}

export async function TechStack({ skills }: TechStackProps) {
  const t = await getTranslations('sections')

  return (
    <section id="stack" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="02" title={t('stack')} />
      <div className="flex flex-col gap-12">
        {skills.map((category) => (
          <div key={category.id} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <h3 className="font-mono uppercase tracking-widest text-sm text-primary">
                {category.category}
              </h3>
              <div className="flex-grow border-t border-default" />
            </div>
            <StaggerChildren className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {category.skills.map((skill) => (
                <AnimatedSkillChip key={skill.name} name={skill.name} icon={skill.icon} />
              ))}
            </StaggerChildren>
          </div>
        ))}
      </div>
    </section>
  )
}
