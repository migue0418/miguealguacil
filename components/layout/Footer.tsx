import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-default mt-24">
      <div className="max-w-[1200px] mx-auto px-5 md:px-20 py-8 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">
          © {year} {t('copyright')}
        </p>
      </div>
    </footer>
  )
}
