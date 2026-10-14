import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from '@/i18n/LanguageContext';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.appearance_title', 'Appearance & Theme settings'),
            href: '/settings/appearance',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.appearance_title', 'Appearance & Theme settings')} />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Setting Tema / Appearance */}
                    <div className="space-y-4">
                        <HeadingSmall
                            title={t('settings.theme_title', 'Appearance settings')}
                            description={t('settings.theme_desc', "Update your account's appearance settings and theme preferences")}
                        />
                        <AppearanceTabs />
                    </div>

                    {/* Setting Bahasa / Language dari LanguageToggle */}
                    <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <HeadingSmall
                            title={t('settings.language_title', 'Language settings')}
                            description={t('settings.language_desc', 'Choose your preferred language for the interface')}
                        />
                        <div className="pt-1">
                            <LanguageToggle theme="auto" />
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

