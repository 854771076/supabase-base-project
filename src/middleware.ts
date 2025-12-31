import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { locales, defaultLocale } from './i18n/config';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the pathname already has a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // If no locale in pathname, redirect to default locale
    if (!pathnameHasLocale) {
        // Skip API routes and static files
        if (
            pathname.startsWith('/api') ||
            pathname.startsWith('/_next') ||
            pathname.includes('.')
        ) {
            return await updateSession(request, NextResponse.next());
        }

        // Redirect to default locale
        const url = request.nextUrl.clone();
        url.pathname = `/${defaultLocale}${pathname}`;
        return NextResponse.redirect(url);
    }

    return await updateSession(request, NextResponse.next());
}

export const config = {
    matcher: [
        '/',
        '/(zh|en)/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
