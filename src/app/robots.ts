import { MetadataRoute } from 'next'
import { getURL } from '@/utils/url'
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
