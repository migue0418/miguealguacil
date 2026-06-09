export interface PersonalInfo {
  name: string
  title: string
  bio: string
  email: string
  linkedin: string
  github: string
  location: string
}

export interface Project {
  id: string
  name: string
  description: string
  stack: string[]
  repoUrl?: string
  repoUrls?: { label: string; url: string }[]
  demoUrl?: string
  featured: boolean
}

export interface ExperienceItem {
  id: string
  role: string
  company: string
  startDate: string
  endDate: string | null
  location: string
  bullets: string[]
}

export interface EducationItem {
  id: string
  degree: string
  institution: string
  startYear: number
  endYear: number | null
  specialization?: string
  exchange?: {
    institution: string
    city: string
    country: string
    startYear: number
    endYear: number
  }
}

export interface Certification {
  id: string
  name: string
  issuer: string
  year: number
  credentialId?: string
  verifyUrl?: string
}

export interface EducationData {
  degrees: EducationItem[]
  certifications: Certification[]
}
