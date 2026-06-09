import { getTranslations } from 'next-intl/server'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { MagneticButton } from '@/components/animations/MagneticButton'
import type { PersonalInfo } from '@/lib/types'

interface ContactProps {
  personal: PersonalInfo
}

export async function Contact({ personal }: ContactProps) {
  const t = await getTranslations('sections')
  const tc = await getTranslations('contact')

  return (
    <section id="contacto" className="py-24 bg-surface">
      <div className="max-w-[1100px] mx-auto px-6">
        <SlideUp>
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-primary mb-4">
            {t('contact')}
          </h2>
        </SlideUp>
        <FadeIn delay={0.1}>
          <p className="text-muted text-lg max-w-lg mb-12">{t('contact_invite')}</p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="flex flex-wrap gap-4">
            <MagneticButton>
              <a
                href={`mailto:${personal.email}`}
                aria-label={tc('email_label')}
                className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                {tc('email_label')}
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href={personal.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tc('linkedin_label')}
                className="inline-flex items-center gap-2 border border-default text-primary font-semibold px-6 py-3 rounded-lg hover:bg-background transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect width="4" height="12" x="2" y="9"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                {tc('linkedin_label')}
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href={personal.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tc('github_label')}
                className="inline-flex items-center gap-2 border border-default text-primary font-semibold px-6 py-3 rounded-lg hover:bg-background transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                  <path d="M9 18c-4.51 2-5-2-7-2"/>
                </svg>
                {tc('github_label')}
              </a>
            </MagneticButton>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
