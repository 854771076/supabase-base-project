import ApiDocsClient from './ApiDocsClient';

export default async function ApiDocs(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  return <ApiDocsClient />;
}