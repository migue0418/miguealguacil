import { getPersonal } from '@/lib/content'
import { OG_IMAGE_ALT, OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE, renderProfileOgImage } from '@/lib/og-image'

export const alt = OG_IMAGE_ALT
export const size = OG_IMAGE_SIZE
export const contentType = OG_IMAGE_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const personal = await getPersonal(locale)

  return renderProfileOgImage(personal)
}
