import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { env } from '../env'

export async function createClient() {
    const cookieStore = await cookies()
    const headerStore = await headers();
    const authHeader = headerStore.get('Authorization');

    const options: any = {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet: any) {
                try {
                    cookiesToSet.forEach(({ name, value, options }: any) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    };

    if (authHeader) {
        options.global = {
            headers: {
                Authorization: authHeader,
            },
        };
    }

    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        options
    )
}
/**
 * Create a Supabase client with the service role key to bypass RLS.
 * USE WITH CAUTION: This should only be used in secure server-side environments.
 */
export async function createAdminClient() {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
    }

    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        {
            cookies: {
                getAll() { return [] },
                setAll() { },
            },
        }
    )
}
