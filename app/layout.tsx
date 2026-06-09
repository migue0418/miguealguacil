import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Miguel Á. Benítez Alguacil — AI Engineer',
  description:
    'Portfolio de Miguel Á. Benítez Alguacil, AI Engineer especializado en GenAI, agentes LLM y desarrollo de producto.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${geistMono.variable}`}
    >
      <body className="bg-background text-primary min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  )
}
