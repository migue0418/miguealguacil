import type { PersonalInfo, Project, ExperienceItem, EducationData } from './types'

export async function getPersonal(locale: string): Promise<PersonalInfo> {
  const mod = await import(`@/content/${locale}/personal`)
  return mod.personal
}

export async function getProjects(locale: string): Promise<Project[]> {
  const mod = await import(`@/content/${locale}/projects`)
  return mod.projects
}

export async function getExperience(locale: string): Promise<ExperienceItem[]> {
  const mod = await import(`@/content/${locale}/experience`)
  return mod.experience
}

export async function getEducation(locale: string): Promise<EducationData> {
  const mod = await import(`@/content/${locale}/education`)
  return mod.educationData
}
