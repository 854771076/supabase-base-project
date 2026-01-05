import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { locales, defaultLocale } from './i18n/config';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Skip API routes and static files
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.')
    ) {
        return await updateSession(request, NextResponse.next());
    }

    // Check if the pathname already has a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
        // Extract the current locale from pathname
        const currentLocale = locales.find(locale => 
            pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
        ) || defaultLocale;
        
        // Store the current locale in cookie for future use
        const response = await updateSession(request, NextResponse.next());
        response.cookies.set('locale', currentLocale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        return response;
    }

    // If no locale in pathname, get from cookie or use default
    const preferredLocale = request.cookies.get('locale')?.value || defaultLocale;
    
    // Redirect to preferred locale
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale}${pathname}`;
    return NextResponse.redirect(url);
}

export const config = {
    matcher: [
        '/',
        '/(zh|en)/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
