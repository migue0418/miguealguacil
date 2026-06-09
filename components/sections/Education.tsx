import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import type { EducationData } from '@/lib/types'

interface EducationProps {
  data: EducationData
}

export async function Education({ data }: EducationProps) {
  const t = await getTranslations('sections')
  const te = await getTranslations('education')

  return (
    <section id="educacion" className="py-24 max-w-[1100px] mx-auto px-6">
      <SlideUp>
        <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-primary mb-12">
          {t('education')}
        </h2>
      </SlideUp>

      <div className="space-y-6 mb-16">
        {data.degrees.map((degree, i) => (
          <FadeIn key={degree.id} delay={i * 0.1}>
            <div className="bg-surface border border-default rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <h3 className="text-primary font-semibold text-[1.0625rem]">{degree.degree}</h3>
                <span className="text-sm text-muted shrink-0">
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
        <h3 className="text-xl font-semibold text-primary mb-6">{t('certifications')}</h3>
      </SlideUp>
      <div className="space-y-4">
        {data.certifications.map((cert, i) => (
          <FadeIn key={cert.id} delay={i * 0.08}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-default rounded-xl p-5">
              <div>
                <p className="text-primary font-medium">{cert.name}</p>
                <p className="text-sm text-muted">{cert.issuer} · {cert.year}</p>
              </div>
              {cert.verifyUrl && (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:text-[var(--color-accent-hover)] transition-colors shrink-0"
                >
                  Verificar →
                </a>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
