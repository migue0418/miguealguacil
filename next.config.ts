import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { SECURITY_HEADERS } from './lib/security-headers'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
