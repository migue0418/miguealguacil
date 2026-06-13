import { ImageResponse } from 'next/og'
import type { PersonalInfo } from '@/lib/types'

export const OG_IMAGE_ALT = 'miguealguacil — AI Engineer'
export const OG_IMAGE_SIZE = { width: 1200, height: 630 }
export const OG_IMAGE_CONTENT_TYPE = 'image/png'

/**
 * Imagen Open Graph compartida (Decisión 4): misma identidad "Technical
 * Brutalist" para home y detalle de proyecto, sin generar variantes por
 * proyecto.
 */
export function renderProfileOgImage(personal: PersonalInfo) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: '#131314',
          color: '#e5e2e3',
          padding: '80px',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: '#00dce5',
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          miguealguacil.com
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          {personal.name}
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#9aacae',
            fontFamily: 'ui-sans-serif, sans-serif',
            maxWidth: 900,
          }}
        >
          {personal.title}
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  )
}
