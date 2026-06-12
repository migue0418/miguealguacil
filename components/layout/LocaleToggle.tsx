'use client'
import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'

export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  function switchLocale() {
    const next = locale === 'es' ? 'en' : 'es'
    router.replace(
      // @ts-expect-error -- TypeScript will validate that only known `params`
      // are used in combination with a given `pathname`. Since the two will
      // always match for the current route, we can skip runtime checks.
      { pathname, params },
      { locale: next },
    )
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-muted hover:text-accent transition-colors px-2 py-1 rounded-none"
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="text-accent">{locale.toUpperCase()}</span>
      <span className="opacity-40">/</span>
      <span>{locale === 'es' ? 'EN' : 'ES'}</span>
    </button>
  )
}
