import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { env } from '../env'

export async function createClient() {
    const cookieStore = await cookies()
    const headerStore = await headers();
    const authHeader = headerStore.get('Authorization');

    const options: any = {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
                try {
                    cookieStore.set({ name, value, ...options })
                } catch (error) {
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
            remove(name: string, options: any) {
                try {
                    cookieStore.set({ name, value: '', ...options })
                } catch (error) {
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
