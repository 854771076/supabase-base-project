'use client'

import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/utils/supabase/client'
import { useTranslations } from '@/i18n/context';
import { getURL } from '@/utils/url';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
    const supabase = createClient()
    const t = useTranslations('Auth');
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    // Prevent hydration mismatch and style flickering
    useEffect(() => {
        setMounted(true);
        
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                //刷新页面
                location.reload()

            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    const authTranslations = {
        sign_in: {
            email_label: t('sign_in.email_label'),
            password_label: t('sign_in.password_label'),
            email_input_placeholder: t('sign_in.email_input_placeholder'),
            password_input_placeholder: t('sign_in.password_input_placeholder'),
            button_label: t('sign_in.button_label'),
            loading_button_label: t('sign_in.loading_button_label'),
            social_provider_text: t('sign_in.social_provider_text'),
            link_text: t('sign_in.link_text'),
            forgot_password_link: t('sign_in.forgot_password_link'),
        },
        sign_up: {
            email_label: t('sign_up.email_label'),
            password_label: t('sign_up.password_label'),
            email_input_placeholder: t('sign_up.email_input_placeholder'),
            password_input_placeholder: t('sign_up.password_input_placeholder'),
            button_label: t('sign_up.button_label'),
            loading_button_label: t('sign_up.loading_button_label'),
            social_provider_text: t('sign_up.social_provider_text'),
            link_text: t('sign_up.link_text'),
            confirmation_text: t('sign_up.confirmation_text'),
        },
        forgotten_password: {
            email_label: t('forgotten_password.email_label'),
            password_label: t('forgotten_password.password_label'),
            email_input_placeholder: t('forgotten_password.email_input_placeholder'),
            button_label: t('forgotten_password.button_label'),
            loading_button_label: t('forgotten_password.loading_button_label'),
            link_text: t('forgotten_password.link_text'),
            confirmation_text: t('forgotten_password.confirmation_text'),
        },
        magic_link: {
            email_input_label: t('magic_link.email_input_label'),
            email_input_placeholder: t('magic_link.email_input_placeholder'),
            button_label: t('magic_link.button_label'),
            link_text: t('magic_link.link_text'),
            confirmation_text: t('magic_link.confirmation_text')
        }
    };

    return (
        <div
            className="auth-container"
            style={{
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
                minHeight: mounted ? 'auto' : '200px'
            }}
        >
            {mounted && (
                <Auth
                    supabaseClient={supabase}
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
                    providers={['google']}
                    localization={{
                        variables: authTranslations
                    }}
                    redirectTo={`${getURL()}api/v1/auth/callback`}
                />
            )}
        </div>
    )
}

