import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-default mt-24">
      <div className="max-w-[1100px] mx-auto px-6 py-8 text-center">
        <p className="text-sm text-muted">
          © {year} {t('copyright')}
        </p>
      </div>
    </footer>
  )
}
