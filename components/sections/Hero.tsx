import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { MagneticButton } from '@/components/animations/MagneticButton'
import type { PersonalInfo } from '@/lib/types'

interface HeroProps {
  personal: PersonalInfo
}

export async function Hero({ personal }: HeroProps) {
  const t = await getTranslations('hero')

  return (
    <section id="hero" className="min-h-screen flex items-center py-24 md:py-32">
      <div className="w-full max-w-[1100px] mx-auto px-6">
        <FadeIn delay={0.1}>
          <p className="text-muted font-medium text-sm uppercase tracking-widest mb-4">
            {personal.title}
          </p>
        </FadeIn>
        <SlideUp delay={0.2}>
          <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-extrabold leading-none tracking-tight text-primary mb-6">
            {personal.name}
          </h1>
        </SlideUp>
        <FadeIn delay={0.4}>
          <p className="text-muted text-lg max-w-xl leading-relaxed mb-10">
            {personal.bio}
          </p>
        </FadeIn>
        <FadeIn delay={0.5}>
          <div className="flex gap-4 flex-wrap">
            <MagneticButton>
              <a
                href="#proyectos"
                className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                {t('cta_projects')}
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 border border-default text-primary font-semibold px-6 py-3 rounded-lg hover:bg-surface transition-colors"
              >
                {t('cta_contact')}
              </a>
            </MagneticButton>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
