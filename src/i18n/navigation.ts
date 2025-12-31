import NextLink from 'next/link';
import { usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation';
import { locales, defaultLocale } from './config';

// Re-export Next.js navigation with locale-aware versions
export const Link = NextLink;

export function usePathname() {
    const pathname = useNextPathname();
    // Remove locale prefix from pathname
    for (const locale of locales) {
        if (pathname.startsWith(`/${locale}/`)) {
            return pathname.substring(locale.length + 1);
        }
        if (pathname === `/${locale}`) {
            return '/';
        }
    }
    return pathname;
}

export function useRouter() {
    return useNextRouter();
}

export { locales, defaultLocale };
