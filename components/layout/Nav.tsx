import { getTranslations } from 'next-intl/server'

const NAV_ITEMS = [
  { key: 'projects', href: '#proyectos' },
  { key: 'stack', href: '#stack' },
  { key: 'experience', href: '#experiencia' },
  { key: 'education', href: '#educacion' },
  { key: 'contact', href: '#contacto' },
] as const

export async function Nav() {
  const t = await getTranslations('nav')

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.key}
          href={item.href}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors"
        >
          {t(item.key)}
        </a>
      ))}
    </nav>
  )
}
