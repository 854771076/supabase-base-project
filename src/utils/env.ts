import { z } from 'zod';

const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_SECRET: z.string().optional(),
    PAYPAL_API_BASE: z.string().url().default('https://api-m.sandbox.paypal.com'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

// Provide default values or allow undefined during build/linting to prevent crash
const processEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    PAYPAL_SECRET: process.env.PAYPAL_SECRET,
    PAYPAL_API_BASE: process.env.PAYPAL_API_BASE,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
    console.warn('⚠️ Invalid environment variables:', parsed.error.format());
}

export const env = parsed.success
    ? parsed.data
    : (processEnv as z.infer<typeof envSchema>);
