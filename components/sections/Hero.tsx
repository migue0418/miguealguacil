import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { MagneticButton } from '@/components/animations/MagneticButton'
import { WireframeBackground } from '@/components/ui/WireframeBackground'
import type { PersonalInfo } from '@/lib/types'

interface HeroProps {
  personal: PersonalInfo
}

export async function Hero({ personal }: HeroProps) {
  const t = await getTranslations('hero')

  return (
    <section
      id="hero"
      className="relative overflow-hidden min-h-screen flex items-center py-24 md:py-32 border-b border-default"
    >
      <WireframeBackground />
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-5 md:px-20">
        <FadeIn delay={0.1}>
          <p className="font-mono text-muted text-sm uppercase tracking-widest mb-4">
            {personal.title}
          </p>
        </FadeIn>
        <SlideUp delay={0.2}>
          <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] font-bold leading-none tracking-tight text-primary mb-10">
            {personal.name}
          </h1>
        </SlideUp>
        <FadeIn delay={0.4}>
          <blockquote className="flex items-start gap-4 border-l-2 border-accent pl-4 md:pl-6 mb-10 max-w-2xl">
            <span className="font-mono text-accent text-sm shrink-0 mt-1">
              {t('bio_label')}
            </span>
            <p className="text-muted text-lg leading-relaxed">
              {personal.bio}
            </p>
          </blockquote>
        </FadeIn>
        <FadeIn delay={0.5}>
          <div className="flex gap-4 flex-wrap">
            <MagneticButton>
              <a
                href="#proyectos"
                className="inline-flex items-center gap-2 bg-accent text-background font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                {t('cta_projects')}
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 border border-default text-primary font-mono uppercase tracking-wide text-sm font-medium px-6 py-3 rounded-none hover:bg-surface-hover transition-colors"
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
