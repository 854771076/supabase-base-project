import HomeClient from '@/components/home/HomeClient';

import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';

const messages = { en: enMessages, zh: zhMessages };

export default async function Home(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const m = messages[locale as keyof typeof messages] || messages.en;
  const t = m.Index;

  const translations = {
    title: t.title,
    description: t.description,
    getStarted: t.getStarted,
    doc: t.doc,
    featuresTitle: t.features.title,
    features: {
      auth: t.features.auth,
      authDesc: t.features.authDesc,
      db: t.features.db,
      dbDesc: t.features.dbDesc,
      ui: t.features.ui,
      uiDesc: t.features.uiDesc,
      i18n: t.features.i18n,
      i18nDesc: t.features.i18nDesc,
    },
  };

  return <HomeClient translations={translations} />;
}
