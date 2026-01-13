import type { Metadata } from 'next'
import { Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-arabic',
  display: 'swap',
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hijraah.com';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Hijraah - AI Immigration Assistant for Arabs',
    template: '%s | Hijraah'
  },
  description: 'AI-powered immigration assistant helping Arabs navigate the immigration process to Canada, Europe, and more. Bilingual support (Arabic/English).',
  keywords: ['immigration', 'canada', 'crs calculator', 'ai visa assistant', 'arabic immigration'],
  authors: [{ name: 'Hijraah Team' }],
  creator: 'Hijraah',
  publisher: 'Hijraah',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    title: 'Hijraah - AI Immigration Assistant for Arabs',
    description: 'Simplify your immigration journey with Hijraah. AI-powered CRS calculations, document checklists, and bilingual guidance.',
    siteName: 'Hijraah',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hijraah Application',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hijraah - AI Immigration Assistant',
    description: 'Simplify your immigration journey with Hijraah.',
    images: ['/og-image.jpg'],
    creator: '@hijraah_app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={notoSansArabic.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
