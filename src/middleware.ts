import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/utils/supabase/middleware'
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale
});

export async function middleware(request: NextRequest) {
    const response = intlMiddleware(request);
    return await updateSession(request, response)
}

export const config = {
    matcher: [
        '/',
        '/(zh|en)/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
