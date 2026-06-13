import { describe, it, expect } from 'vitest'
import sitemap from '../sitemap'
import { getProjects } from '@/lib/content'

describe('sitemap', () => {
  it('includes the home entry for es and en with alternates', async () => {
    const entries = await sitemap()

    const es = entries.find((e) => e.url === 'https://miguealguacil.com')
    const en = entries.find((e) => e.url === 'https://miguealguacil.com/en')

    expect(es).toBeDefined()
    expect(en).toBeDefined()
    expect(es?.changeFrequency).toBe('monthly')
    expect(es?.priority).toBe(1)
    expect(es?.alternates?.languages?.en).toBe('https://miguealguacil.com/en')
    expect(en?.alternates?.languages?.es).toBe('https://miguealguacil.com')
  })

  it('includes an entry per project for es and en with cross-locale alternates', async () => {
    const entries = await sitemap()
    const esProjects = await getProjects('es')

    for (const project of esProjects) {
      const esEntry = entries.find(
        (e) => e.url === `https://miguealguacil.com/proyectos/${project.id}`
      )
      expect(esEntry).toBeDefined()
      expect(esEntry?.changeFrequency).toBe('yearly')
      expect(esEntry?.priority).toBe(0.7)
      expect(esEntry?.alternates?.languages?.en).toBe(
        `https://miguealguacil.com/en/projects/${project.id}`
      )

      const enEntry = entries.find(
        (e) => e.url === `https://miguealguacil.com/en/projects/${project.id}`
      )
      expect(enEntry).toBeDefined()
      expect(enEntry?.alternates?.languages?.es).toBe(
        `https://miguealguacil.com/proyectos/${project.id}`
      )
    }
  })
})
