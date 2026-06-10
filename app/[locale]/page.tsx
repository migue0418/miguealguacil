import { getPersonal, getProjects, getExperience, getEducation, getSkills } from '@/lib/content'
import { Hero } from '@/components/sections/Hero'
import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { TechStack } from '@/components/sections/TechStack'
import { Timeline } from '@/components/sections/Timeline'
import { Education } from '@/components/sections/Education'
import { Contact } from '@/components/sections/Contact'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const [personal, projects, experience, educationData, skills] = await Promise.all([
    getPersonal(locale),
    getProjects(locale),
    getExperience(locale),
    getEducation(locale),
    getSkills(locale),
  ])

  return (
    <>
      <Hero personal={personal} />
      <ProjectsGrid projects={projects} />
      <TechStack skills={skills} />
      <Timeline experience={experience} />
      <Education data={educationData} />
      <Contact personal={personal} />
    </>
  )
}
