import { getLocale, getTranslations } from 'next-intl/server'
import { getSectionHref } from '@/lib/navigation'
import type { SectionKey } from '@/lib/navigation'

const NAV_ITEMS: SectionKey[] = ['projects', 'stack', 'experience', 'education', 'contact']

export async function MobileNav() {
  const t = await getTranslations('nav')
  const locale = await getLocale()

  return (
    <nav className="flex flex-col">
      {NAV_ITEMS.map((key) => (
        <a
          key={key}
          href={getSectionHref(locale, key)}
          className="block w-full font-mono text-xs uppercase tracking-wide text-muted hover:text-accent hover:bg-surface-hover transition-colors px-5 py-3 border-b border-default last:border-b-0"
        >
          {t(key)}
        </a>
      ))}
    </nav>
  )
}
