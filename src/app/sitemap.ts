import { MetadataRoute } from 'next';
import { listGuides } from '@/actions/guides';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hijraah.com';

    // Static routes
    const routes = [
        '',
        '/login',
        '/signup',
        '/pricing',
        '/calculator',
        '/documents',
        '/guides',
        '/sop',
        '/chat',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes (Guides)
    let guideRoutes: MetadataRoute.Sitemap = [];
    try {
        const guides = await listGuides({ limit: 100, offset: 0 });
        guideRoutes = guides.map((guide) => ({
            url: `${baseUrl}/guides/${guide.slug}`,
            lastModified: new Date(guide.updatedAt || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));
    } catch (error) {
        console.error('Failed to fetch guides for sitemap', error);
    }

    return [...routes, ...guideRoutes];
}
