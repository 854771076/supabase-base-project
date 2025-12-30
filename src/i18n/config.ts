export const locales = ['en', 'zh'] as const;
export const defaultLocale = 'en';

export type Locale = (typeof locales)[number];
