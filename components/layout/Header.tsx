import { getLocale, getTranslations } from 'next-intl/server'
import { getPersonal } from '@/lib/content'
import { getSectionHref } from '@/lib/navigation'
import { Nav } from './Nav'
import { ThemeToggle } from './ThemeToggle'
import { LocaleToggle } from './LocaleToggle'

export async function Header() {
  const locale = await getLocale()
  const personal = await getPersonal(locale)
  const t = await getTranslations('nav')

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-default">
      <div className="max-w-[1200px] mx-auto px-5 md:px-20 h-16 flex items-center justify-between">
        <a
          href={getSectionHref(locale, 'hero')}
          className="font-mono text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          miguealguacil
        </a>
        <div className="flex items-center gap-4">
          <Nav />
          <div className="flex items-center gap-1">
            <a
              href={personal.cvUrl}
              download
              className="font-mono text-xs uppercase tracking-wide text-primary border border-default px-3 py-1.5 rounded-none hover:bg-surface-hover hover:text-accent transition-colors"
            >
              {t('cv')}
            </a>
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
