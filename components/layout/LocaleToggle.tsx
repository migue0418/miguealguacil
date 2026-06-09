'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale() {
    const next = locale === 'es' ? 'en' : 'es'
    router.replace(pathname, { locale: next })
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1 text-sm font-medium text-muted hover:text-accent transition-colors px-2 py-1 rounded"
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="font-semibold text-accent">{locale.toUpperCase()}</span>
      <span className="opacity-40">/</span>
      <span>{locale === 'es' ? 'EN' : 'ES'}</span>
    </button>
  )
}
