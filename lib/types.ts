export interface PersonalInfo {
  name: string
  title: string
  bio: string
  email: string
  linkedin: string
  github: string
  location: string
  cvUrl: string
}

export interface ProjectDetailSection {
  heading: string
  paragraphs: string[]
}

export interface ProjectDetailResult {
  label: string
  value: string
}

export interface ProjectDetailLink {
  label: string
  url: string
}

export interface ProjectDetailImage {
  src: string
  alt: string
  caption?: string
  width: number
  height: number
}

export interface ProjectDetailConversationTurn {
  role: 'user' | 'assistant'
  speaker: string
  text: string
}

export interface ProjectDetailDemo {
  video: {
    src: string
    caption?: string
  }
  conversation?: ProjectDetailConversationTurn[]
  images?: ProjectDetailImage[]
}

export interface ProjectDetail {
  summary: string[]
  demo?: ProjectDetailDemo
  sections?: ProjectDetailSection[]
  results?: ProjectDetailResult[]
  images?: ProjectDetailImage[]
  links?: ProjectDetailLink[]
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
  detail?: ProjectDetail
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

export interface Skill {
  name: string
  icon: string
}

export interface SkillCategory {
  id: string
  category: string
  skills: Skill[]
}
