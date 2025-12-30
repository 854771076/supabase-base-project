'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/utils/supabase/client'
import { useLocale } from 'next-intl';

export default function AuthForm() {
    const supabase = createClient()
    const locale = useLocale();

    const localization = locale === 'zh' ? {
        variables: {
            magic_link: {
                email_input_label: '电子邮箱地址',
                email_input_placeholder: '您的电子邮箱地址',
                button_label: '发送魔术链接',
                link_text: '使用魔术链接登录',
                confirmation_text: '检查您的邮箱以获取登录链接',
            }
        }
    } : {
        variables: {
            magic_link: {
                email_input_label: 'Email address',
                email_input_placeholder: 'Your email address',
                button_label: 'Send magic link',
                link_text: 'Use magic link to login',
                confirmation_text: 'Check your email for the login link!',
            }
        }
    };

    return (
        <div className="auth-container">
            <Auth
                supabaseClient={supabase}
                view="magic_link"
                appearance={{
                    theme: ThemeSupa,
                    variables: {
                        default: {
                            colors: {
                                brand: '#1677ff',
                                brandAccent: '#4096ff',
                            }
                        }
                    }
                }}
                theme="light"
                showLinks={false}
                providers={['google']} // Restored Google login provider
                localization={localization}
                redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/auth/callback`}
            />
        </div>
    )
}
