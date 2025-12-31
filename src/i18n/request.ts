import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';

// Validate that the incoming `locale` parameter is valid
export default getRequestConfig(async ({ locale }) => {
    if (!locales.includes(locale as any)) notFound();

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
