import { ArrowUpRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  index: string
  labels: {
    viewRepo: string
    viewBackend: string
    viewMod: string
    viewDemo: string
    viewDetails: string
  }
}

export function ProjectCard({ project, index, labels }: ProjectCardProps) {
  const links: { label: string; url: string }[] = []
  if (project.repoUrl) links.push({ label: labels.viewRepo, url: project.repoUrl })
  if (project.repoUrls) {
    for (const repo of project.repoUrls) {
      links.push({
        label: repo.label === 'Backend' ? labels.viewBackend : labels.viewMod,
        url: repo.url,
      })
    }
  }
  if (project.demoUrl) links.push({ label: labels.viewDemo, url: project.demoUrl })

  const detailHref = `/proyectos/${project.id}`

  return (
    <article className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-8 border-t border-default hover:bg-surface-hover transition-colors px-2 -mx-2">
      <Link href={detailHref} aria-hidden="true" tabIndex={-1} className="absolute inset-0" />

      <div className="md:col-span-1 font-mono text-accent text-sm">{index}</div>

      <div className="md:col-span-5 flex flex-col gap-3">
        <h3 className="font-display font-medium text-xl text-primary group-hover:text-accent transition-colors">
          {project.name}
        </h3>
        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="font-mono text-xs uppercase tracking-wide text-muted bg-surface border border-default px-2 py-1 rounded"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="md:col-span-4 bg-background shadow-inner rounded p-4 font-mono text-sm text-muted leading-relaxed">
        {project.description}
      </div>

      <div className="md:col-span-2 flex md:flex-col flex-row flex-wrap gap-3 md:items-end items-start relative z-10">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {link.label}
            <ArrowUpRight size={14} aria-hidden />
          </a>
        ))}
        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors"
        >
          {labels.viewDetails}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  )
}
