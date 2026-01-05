import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import StyledComponentsRegistry from "@/lib/AntdRegistry";
import { I18nProvider } from "@/i18n/context";
import MainLayout from "@/components/common/MainLayout";
import { createClient } from "@/utils/supabase/server";
import { Locale, locales } from '@/i18n/config';
import { getURL } from "@/utils/url";
import { App } from 'antd';
const inter = Inter({ subsets: ["latin"] });

export async function generateStaticParams() {
  return locales.map((locale: string) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: {
    template: '%s | Supabase Base Project',
    default: 'Supabase Base Project',
  },
  description: "Enterprise-grade starter kit with Next.js 15, Supabase, and Ant Design",
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

export default async function LocaleLayout(props: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { children } = props;
  const { locale } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <I18nProvider locale={locale as Locale}>
          <StyledComponentsRegistry locale={locale as Locale}>
            <App style={{ minHeight: '100%' }}>
              <MainLayout user={user}>
                {children}
              </MainLayout>
            </App>

          </StyledComponentsRegistry>
        </I18nProvider>
      </body>
    </html>
  );
}
