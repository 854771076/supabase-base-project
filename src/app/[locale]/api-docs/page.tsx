import { setRequestLocale } from 'next-intl/server';
import ApiDocsClient from './ApiDocsClient';

export default function ApiDocs({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return <ApiDocsClient />;
}