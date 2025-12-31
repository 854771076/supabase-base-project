import { MetadataRoute } from 'next'
import { getURL } from '@/utils/url'
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/api/',
        },
        sitemap: `${getURL()}sitemap.xml`,
    }
}
