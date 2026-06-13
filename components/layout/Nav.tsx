import { getLocale, getTranslations } from 'next-intl/server'
import { getSectionHref } from '@/lib/navigation'
import type { SectionKey } from '@/lib/navigation'

const NAV_ITEMS: SectionKey[] = ['projects', 'stack', 'experience', 'education', 'contact']

export async function Nav() {
  const t = await getTranslations('nav')
  const locale = await getLocale()

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_ITEMS.map((key) => (
        <a
          key={key}
          href={getSectionHref(locale, key)}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors"
        >
          {t(key)}
        </a>
      ))}
    </nav>
  )
}
