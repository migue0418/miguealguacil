import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowUpRight } from 'lucide-react'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getSectionAnchorId } from '@/lib/navigation'
import type { EducationData } from '@/lib/types'

interface EducationProps {
  data: EducationData
}

export async function Education({ data }: EducationProps) {
  const t = await getTranslations('sections')
  const te = await getTranslations('education')
  const locale = await getLocale()

  return (
    <section id={getSectionAnchorId(locale, 'education')} className="py-24 max-w-[1200px] mx-auto px-5 md:px-20 border-b border-default">
      <SectionHeading number="04" title={t('education')} />

      <div className="space-y-6 mb-16">
        {data.degrees.map((degree, i) => (
          <FadeIn key={degree.id} delay={i * 0.1}>
            <div className="bg-surface border border-default rounded-none p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <h3 className="font-display font-medium text-primary text-[1.0625rem]">{degree.degree}</h3>
                <span className="font-mono text-xs uppercase tracking-wide text-muted shrink-0">
                  {degree.startYear} — {degree.endYear ?? '...'}
                </span>
              </div>
              <p className="text-sm font-medium text-accent mb-1">{degree.institution}</p>
              {degree.specialization && (
                <p className="text-sm text-muted">{degree.specialization}</p>
              )}
              {degree.exchange && (
                <p className="text-sm text-muted mt-1">
                  {te('exchange')} · {degree.exchange.institution}, {degree.exchange.city} ({degree.exchange.startYear}–{degree.exchange.endYear})
                </p>
              )}
            </div>
          </FadeIn>
        ))}
      </div>

      <SlideUp>
        <h3 className="font-mono uppercase tracking-widest text-sm text-primary mb-6">{t('certifications')}</h3>
      </SlideUp>
      <div className="space-y-4">
        {data.certifications.map((cert, i) => (
          <FadeIn key={cert.id} delay={i * 0.08}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-default rounded-none p-5">
              <div>
                <p className="text-primary font-medium">{cert.name}</p>
                <p className="font-mono text-xs uppercase tracking-wide text-muted">{cert.issuer} · {cert.year}</p>
              </div>
              {cert.verifyUrl && (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors shrink-0"
                >
                  {te('verify')}
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
