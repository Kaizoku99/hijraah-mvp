import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Hijraah - AI Immigration Assistant for Arabs',
  description: 'AI-powered immigration assistant helping Arabs navigate the immigration process',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Arabic Font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
