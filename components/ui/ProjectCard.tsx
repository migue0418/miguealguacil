import { Badge } from './Badge'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  labels: {
    viewRepo: string
    viewBackend: string
    viewMod: string
    viewDemo: string
  }
}

export function ProjectCard({ project, labels }: ProjectCardProps) {
  return (
    <article className="bg-surface border border-default rounded-xl p-6 flex flex-col gap-4 h-full">
      <h3 className="text-primary font-semibold text-[1.25rem] leading-snug">
        {project.name}
      </h3>
      <p className="text-muted text-base leading-relaxed flex-1">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <Badge key={tech} label={tech} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {labels.viewRepo} →
          </a>
        )}
        {project.repoUrls?.map((repo) => (
          <a
            key={repo.label}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {repo.label === 'Backend' ? labels.viewBackend : labels.viewMod} →
          </a>
        ))}
        {project.demoUrl && (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {labels.viewDemo} →
          </a>
        )}
      </div>
    </article>
  )
}
