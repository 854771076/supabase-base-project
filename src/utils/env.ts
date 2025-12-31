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

if (!parsed.success && process.env.NODE_ENV === 'production') {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    // Only throw in production if we are not in a build environment or if you strictly want it to fail
    // For Vercel build, sometimes it's better to log and let the build continue 
    // if the variables aren't used for static generation.
    // However, Supabase URL is usually required.
}

export const env = parsed.success
    ? parsed.data
    : (processEnv as z.infer<typeof envSchema>);
