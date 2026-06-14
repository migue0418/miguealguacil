import { getLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { getSectionHref } from '@/lib/navigation'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerChildren } from '@/components/animations/StaggerChildren'
import type { Project } from '@/lib/types'

interface ProjectDetailProps {
  project: Project
}

export async function ProjectDetail({ project }: ProjectDetailProps) {
  const t = await getTranslations('projectDetail')
  const tp = await getTranslations('project')
  const locale = await getLocale()
  const backHref = getSectionHref(locale, 'projects')

  const externalLinks: { label: string; url: string }[] = []
  if (project.repoUrl) externalLinks.push({ label: tp('view_repo'), url: project.repoUrl })
  if (project.repoUrls) {
    for (const repo of project.repoUrls) {
      externalLinks.push({
        label: repo.label === 'Backend' ? tp('view_backend') : tp('view_mod'),
        url: repo.url,
      })
    }
  }
  if (project.demoUrl) externalLinks.push({ label: tp('view_demo'), url: project.demoUrl })

  const summary = project.detail?.summary ?? [project.description]

  return (
    <article className="py-24 max-w-[1200px] mx-auto px-5 md:px-20">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors mb-12"
      >
        <ArrowLeft size={14} aria-hidden />
        {t('back')}
      </Link>

      <FadeIn>
        <header className="mb-12 pb-12 border-b border-default">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-primary mb-6">
            {project.name}
          </h1>
          <div className="flex flex-wrap gap-2 mb-6">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="font-mono text-xs uppercase tracking-wide text-muted bg-surface border border-default px-2 py-1 rounded"
              >
                {tech}
              </span>
            ))}
          </div>
          {externalLinks.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {externalLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs uppercase text-accent hover:text-[var(--color-accent-hover)] transition-colors"
                >
                  {link.label}
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              ))}
            </div>
          )}
        </header>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-col gap-4 max-w-3xl mb-16 text-muted text-lg leading-relaxed">
          {summary.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </FadeIn>

      {project.detail?.demo && (
        <div className="mb-16">
          <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-6">
            {t('demo')}
          </h2>
          <FadeIn className="mb-10">
            <video
              src={project.detail.demo.video.src}
              controls
              playsInline
              preload="metadata"
              className="w-full aspect-[1920/1012] rounded border border-default bg-black"
            />
            {project.detail.demo.video.caption && (
              <p className="mt-2 font-mono text-xs text-muted">{project.detail.demo.video.caption}</p>
            )}
          </FadeIn>

          {project.detail.demo.conversation && (
            <StaggerChildren className="flex flex-col gap-4 max-w-3xl mb-10">
              {project.detail.demo.conversation.map((turn, i) => (
                <div key={i}>
                  <span
                    className={`font-mono text-xs uppercase tracking-wide ${
                      turn.role === 'assistant' ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {turn.speaker}
                  </span>
                  <p className="text-muted leading-relaxed mt-1">{turn.text}</p>
                </div>
              ))}
            </StaggerChildren>
          )}

          {project.detail.demo.images && (
            <>
              <h3 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-4">
                {t('underTheHood')}
              </h3>
              <StaggerChildren className="flex flex-col gap-8">
                {project.detail.demo.images.map((img) => (
                  <figure key={img.src}>
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={img.width}
                      height={img.height}
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className="rounded border border-default w-full h-auto"
                    />
                    {img.caption && (
                      <figcaption className="mt-2 font-mono text-xs text-muted">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </StaggerChildren>
            </>
          )}
        </div>
      )}

      {project.detail?.sections && (
        <StaggerChildren className="flex flex-col gap-12 mb-16">
          {project.detail.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-4">
                {section.heading}
              </h3>
              <div className="flex flex-col gap-3 max-w-3xl text-muted leading-relaxed">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </StaggerChildren>
      )}

      {project.detail?.results && (
        <div className="mb-16">
          <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-6">
            {t('results')}
          </h2>
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.detail.results.map((result) => (
              <div
                key={result.label}
                className="bg-surface border border-default rounded p-4 flex flex-col gap-2"
              >
                <span className="font-mono text-xs uppercase text-muted">{result.label}</span>
                <span className="font-mono text-2xl text-accent">{result.value}</span>
              </div>
            ))}
          </StaggerChildren>
        </div>
      )}

      {project.detail?.images && (
        <div className="mb-16">
          <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-6">
            {t('screenshots')}
          </h2>
          <StaggerChildren className="flex flex-col gap-8">
            {project.detail.images.map((img) => (
              <figure key={img.src}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="rounded border border-default w-full h-auto"
                />
                {img.caption && (
                  <figcaption className="mt-2 font-mono text-xs text-muted">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </StaggerChildren>
        </div>
      )}

      {project.detail?.links && (
        <div>
          <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base mb-6">
            {t('links')}
          </h2>
          <div className="flex flex-col gap-3">
            {project.detail.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-sm text-accent hover:text-[var(--color-accent-hover)] transition-colors"
              >
                {link.label}
                <ArrowUpRight size={14} aria-hidden />
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
