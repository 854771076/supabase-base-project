'use client'

import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/utils/supabase/client'
import { useTranslations } from '@/i18n/context';
import { getURL } from '@/utils/url';

export default function AuthForm() {
    const supabase = createClient()
    const t = useTranslations('Auth');
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch and style flickering
    useEffect(() => {
        setMounted(true);
    }, []);

    // Get translations for magic link authentication
    const magicLinkTranslations = {
        email_input_label: t('magic_link.email_input_label'),
        email_input_placeholder: t('magic_link.email_input_placeholder'),
        button_label: t('magic_link.button_label'),
        link_text: t('magic_link.link_text'),
        confirmation_text: t('magic_link.confirmation_text')
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
                    providers={['google']}
                    localization={{
                        variables: {
                            magic_link: magicLinkTranslations
                        }
                    }}
                    redirectTo={`${getURL()}api/v1/auth/callback`}
                />
            )}
        </div>
    )
}

