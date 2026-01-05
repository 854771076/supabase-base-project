import HomeClient from '@/components/home/HomeClient';

export default async function Home(props: {
  params: Promise<{ locale: string }>;
}) {
  return <HomeClient />;
}
