import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import StyledComponentsRegistry from "@/lib/AntdRegistry";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import MainLayout from "@/components/common/MainLayout";
import { createClient } from "@/utils/supabase/server";
import { Locale, locales } from '@/i18n/config';

import { getURL } from "@/utils/url";

const inter = Inter({ subsets: ["latin"] });

export async function generateStaticParams() {
  return locales.map((locale: string) => ({ locale }));
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: {
    template: '%s | Supabase Base Project',
    default: 'Supabase Base Project',
  },
  description: "Enterprise-grade starter kit with Next.js 14, Supabase, and Ant Design",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Supabase Base Project',
    description: 'Build your project faster with our full-stack template.',
    url: getURL(),
    siteName: 'Supabase Base Project',
    locale: 'en_US',
    type: 'website',
  },
};

export default async function LocaleLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  setRequestLocale(locale);
  const messages = await getMessages();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <StyledComponentsRegistry locale={locale as Locale}>
            <MainLayout user={user}>
              {children}
            </MainLayout>
          </StyledComponentsRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
