import LoginContent from '@/components/auth/LoginContent';


export default async function LoginPage(props: {
    params: Promise<{ locale: string }>;
}) {
    return <LoginContent/>;
}
