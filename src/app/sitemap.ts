import { MetadataRoute } from 'next'
import { getURL } from '@/utils/url'
import { locales } from '@/i18n/config'

export default function sitemap(): MetadataRoute.Sitemap {
    const url = getURL()
    const routes = ['', '/login', '/profile', '/api-docs'].flatMap((route) =>
        locales.map((locale) => ({
            url: `${url}${locale}${route}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: route === '' ? 1 : 0.8,
        }))
    )

    return [
        {
            url: url,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        ...routes,
    ]
}
