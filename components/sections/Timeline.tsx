import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TimelineItem } from '@/components/ui/TimelineItem'
import type { ExperienceItem } from '@/lib/types'

interface TimelineProps {
  experience: ExperienceItem[]
}

export async function Timeline({ experience }: TimelineProps) {
  const t = await getTranslations('sections')
  const tl = await getTranslations('timeline')

  return (
    <section id="experiencia" className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="03" title={t('experience')} />
      <div className="space-y-10">
        {experience.map((item, i) => (
          <SlideUp key={item.id} delay={i * 0.08}>
            <TimelineItem item={item} presentLabel={tl('present')} />
          </SlideUp>
        ))}
      </div>
    </section>
  )
}
