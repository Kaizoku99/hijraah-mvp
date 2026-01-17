import type { Metadata } from 'next'
import { Noto_Sans_Arabic } from 'next/font/google'
import '../globals.css'
import { Providers } from './providers'
import { DeferredAnalytics } from '@/components/DeferredAnalytics'
import { type Language } from '@/contexts/LanguageContext'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

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
    icons: {
        icon: [
            { url: '/favicomatic/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicomatic/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        ],
        shortcut: '/favicomatic/favicon.ico',
        apple: [
            { url: '/favicomatic/apple-touch-icon-57x57.png', sizes: '57x57', type: 'image/png' },
            { url: '/favicomatic/apple-touch-icon-60x60.png', sizes: '60x60', type: 'image/png' },
            { url: '/favicomatic/apple-touch-icon-72x72.png', sizes: '72x72', type: 'image/png' },
            { url: '/favicomatic/apple-touch-icon-76x76.png', sizes: '76x76', type: 'image/png' },
            { url: '/favicomatic/apple-touch-icon-114x114.png', sizes: '114x114', type: 'image/png' },
            { url: '/favicomatic/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
            { url: '/favicomatic/apple-touch-icon-144x144.png', sizes: '144x144', type: 'image/png' },
            { url: '/favicomatic/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
        ],
        other: [
            { rel: 'icon', url: '/favicomatic/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
            { rel: 'icon', url: '/favicomatic/favicon-128.png', sizes: '128x128', type: 'image/png' },
            { rel: 'icon', url: '/favicomatic/favicon-196x196.png', sizes: '196x196', type: 'image/png' },
        ],
    },
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

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
    children,
    params
}: Props) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages();
    const dir = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={dir} suppressHydrationWarning className={notoSansArabic.variable}>
            <head>
            </head>
            <body>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:outline-ring"
                >
                    Skip to main content
                </a>
                <NextIntlClientProvider messages={messages}>
                    <Providers initialLanguage={locale as Language}>
                        {children}
                    </Providers>
                </NextIntlClientProvider>
                <DeferredAnalytics />
            </body>
        </html>
    )
}
