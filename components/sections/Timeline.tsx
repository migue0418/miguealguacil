import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { TimelineItem } from '@/components/ui/TimelineItem'
import type { ExperienceItem } from '@/lib/types'

interface TimelineProps {
  experience: ExperienceItem[]
}

export async function Timeline({ experience }: TimelineProps) {
  const t = await getTranslations('sections')
  const tl = await getTranslations('timeline')

  return (
    <section id="experiencia" className="py-24 bg-surface">
      <div className="max-w-[1100px] mx-auto px-6">
        <SlideUp>
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-primary mb-12">
            {t('experience')}
          </h2>
        </SlideUp>
        <div className="space-y-10">
          {experience.map((item, i) => (
            <SlideUp key={item.id} delay={i * 0.08}>
              <TimelineItem item={item} presentLabel={tl('present')} />
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  )
}
