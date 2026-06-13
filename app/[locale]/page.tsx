import type { Metadata } from 'next'
import { getPersonal, getProjects, getExperience, getEducation, getSkills } from '@/lib/content'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Hero } from '@/components/sections/Hero'
import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { TechStack } from '@/components/sections/TechStack'
import { Timeline } from '@/components/sections/Timeline'
import { Education } from '@/components/sections/Education'
import { Contact } from '@/components/sections/Contact'
import { routing } from '@/i18n/routing'
import { buildPersonJsonLd, getAbsoluteUrl, getLocalizedHomePath } from '@/lib/seo'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    languages[loc] = loc === routing.defaultLocale ? '/' : `/${loc}`
  }

  const title = t('home_title')
  const description = t('home_description')

  return {
    title,
    description,
    alternates: {
      languages,
    },
    openGraph: {
      title,
      description,
      url: getAbsoluteUrl(getLocalizedHomePath(locale)),
      siteName: 'miguealguacil',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [personal, projects, experience, educationData, skills] = await Promise.all([
    getPersonal(locale),
    getProjects(locale),
    getExperience(locale),
    getEducation(locale),
    getSkills(locale),
  ])

  const personJsonLd = buildPersonJsonLd(locale, personal)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Hero personal={personal} />
      <ProjectsGrid projects={projects} />
      <TechStack skills={skills} />
      <Timeline experience={experience} />
      <Education data={educationData} />
      <Contact personal={personal} />
    </>
  )
}
