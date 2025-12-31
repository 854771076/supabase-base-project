import { z } from 'zod';

const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
});

// Provide default values or allow undefined during build/linting to prevent crash
const processEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
    console.warn('⚠️ Invalid environment variables:', parsed.error.format());
}

export const env = parsed.success
    ? parsed.data
    : (processEnv as z.infer<typeof envSchema>);
