import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            let redirectUrl = new URL(next, origin)

            if (!isLocalEnv && forwardedHost) {
                redirectUrl.host = forwardedHost
                redirectUrl.protocol = 'https:'
            }

            return NextResponse.redirect(redirectUrl.toString())
        } else {
            console.error('Auth callback exchange error:', error)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(new URL('/auth/auth-code-error', origin).toString())
}
