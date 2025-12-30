import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import StyledComponentsRegistry from "@/lib/AntdRegistry";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import MainLayout from "@/components/common/MainLayout";
import { createClient } from "@/utils/supabase/server";
import { Locale } from '@/i18n/config';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Supabase Base Project",
  description: "Built with Next.js, Supabase, and Ant Design",
};

export default async function LocaleLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
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
