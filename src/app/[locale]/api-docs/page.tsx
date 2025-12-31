import ApiDocsClient from './ApiDocsClient';

export default function ApiDocs({
  params: { locale }
}: {
  params: { locale: string };
}) {
  return <ApiDocsClient />;
}