import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { useTranslation } from '@/i18n/LanguageContext';
import { Globe, Monitor, Moon, Sun } from 'lucide-react';
import React from 'react';

export interface LanguageToggleProps {
    variant?: 'pill' | 'compact' | 'dropdown';
    className?: string;
    theme?: 'auto' | 'dark' | 'light';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
    variant = 'pill',
    className = '',
    theme = 'auto',
}) => {
    const { language, setLanguage, toggleLanguage } = useTranslation();

    // Pisahkan styling secara tegas: 'light' (paksa terang), 'dark' (paksa gelap), dan 'auto' (mengikuti sistem/root dark mode)
    const isDark = theme === 'dark';
    const isLight = theme === 'light';

    if (variant === 'compact') {
        let compactButtonClass = 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700';
        let globeIconClass = 'size-3.5 text-emerald-600 dark:text-emerald-400';

        if (isDark) {
            compactButtonClass = 'bg-white/10 hover:bg-white/15 text-white border-white/15';
            globeIconClass = 'size-3.5 text-emerald-400';
        } else if (isLight) {
            compactButtonClass = 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200 shadow-2xs';
            globeIconClass = 'size-3.5 text-emerald-600';
        }

        return (
            <button
                type="button"
                onClick={toggleLanguage}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${compactButtonClass} text-xs font-semibold border transition-all active:scale-95 cursor-pointer shadow-2xs select-none ${className}`}
                aria-label={`Ubah bahasa ke ${language === 'id' ? 'English' : 'Bahasa Indonesia'}`}
                title={`Ubah bahasa ke ${language === 'id' ? 'English' : 'Bahasa Indonesia'}`}
            >
                <Globe className={globeIconClass} />
                <span>{language.toUpperCase()}</span>
            </button>
        );
    }

    // Styling container group
    let containerClass = 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700/80';
    if (isDark) {
        containerClass = 'bg-white/10 border-white/15 shadow-inner';
    } else if (isLight) {
        containerClass = 'bg-zinc-100 border-zinc-200 shadow-inner';
    }

    // Styling tombol aktif
    let activeBtnClass = 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs';
    if (isDark) {
        activeBtnClass = 'bg-emerald-600 text-white shadow-xs';
    } else if (isLight) {
        activeBtnClass = 'bg-white text-emerald-600 shadow-xs border border-zinc-200/80';
    }

    // Styling tombol tidak aktif
    let inactiveBtnClass = 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200';
    if (isDark) {
        inactiveBtnClass = 'text-white/60 hover:text-white';
    } else if (isLight) {
        inactiveBtnClass = 'text-zinc-500 hover:text-zinc-800';
    }

    return (
        <div
            className={`inline-flex items-center p-0.5 rounded-full ${containerClass} border shadow-2xs select-none ${className}`}
            role="group"
            aria-label="Pilih Bahasa / Select Language"
        >
            <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    language === 'id' ? activeBtnClass : inactiveBtnClass
                }`}
            >
                <span>ID</span>
            </button>
            <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    language === 'en' ? activeBtnClass : inactiveBtnClass
                }`}
            >
                <span>EN</span>
            </button>
        </div>
    );
};

export interface ThemeToggleProps {
    variant?: 'pill' | 'compact';
    className?: string;
    theme?: 'auto' | 'dark' | 'light';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    variant = 'pill',
    className = '',
    theme = 'auto',
}) => {
    const { appearance, updateAppearance } = useAppearance();
    const { t } = useTranslation();

    const isDark = theme === 'dark';
    const isLight = theme === 'light';

    const tabs: { value: Appearance; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
        { value: 'light', icon: Sun, label: t('settings.theme_light', 'Light') },
        { value: 'dark', icon: Moon, label: t('settings.theme_dark', 'Dark') },
        { value: 'system', icon: Monitor, label: t('settings.theme_system', 'System') },
    ];

    if (variant === 'compact') {
        const nextTheme: Appearance = appearance === 'light' ? 'dark' : appearance === 'dark' ? 'system' : 'light';
        const CurrentIcon = appearance === 'light' ? Sun : appearance === 'dark' ? Moon : Monitor;

        let compactButtonClass = 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700';
        let iconClass = 'size-3.5 text-emerald-600 dark:text-emerald-400';

        if (isDark) {
            compactButtonClass = 'bg-white/10 hover:bg-white/15 text-white border-white/15';
            iconClass = 'size-3.5 text-emerald-400';
        } else if (isLight) {
            compactButtonClass = 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200 shadow-2xs';
            iconClass = 'size-3.5 text-emerald-600';
        }

        return (
            <button
                type="button"
                onClick={() => updateAppearance(nextTheme)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${compactButtonClass} text-xs font-semibold border transition-all active:scale-95 cursor-pointer shadow-2xs select-none ${className}`}
                aria-label={`Ubah tema ke ${nextTheme}`}
                title={`Ubah tema ke ${nextTheme}`}
            >
                <CurrentIcon className={iconClass} />
                <span className="capitalize">{appearance}</span>
            </button>
        );
    }

    let containerClass = 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700/80';
    if (isDark) {
        containerClass = 'bg-white/10 border-white/15 shadow-inner';
    } else if (isLight) {
        containerClass = 'bg-zinc-100 border-zinc-200 shadow-inner';
    }

    let activeBtnClass = 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs';
    if (isDark) {
        activeBtnClass = 'bg-emerald-600 text-white shadow-xs';
    } else if (isLight) {
        activeBtnClass = 'bg-white text-emerald-600 shadow-xs border border-zinc-200/80';
    }

    let inactiveBtnClass = 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200';
    if (isDark) {
        inactiveBtnClass = 'text-white/60 hover:text-white';
    } else if (isLight) {
        inactiveBtnClass = 'text-zinc-500 hover:text-zinc-800';
    }

    return (
        <div
            className={`inline-flex items-center p-0.5 rounded-full ${containerClass} border shadow-2xs select-none ${className}`}
            role="group"
            aria-label="Pilih Tema / Select Theme"
        >
            {tabs.map(({ value, icon: Icon, label }) => {
                const isActive = appearance === value;
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            isActive ? activeBtnClass : inactiveBtnClass
                        }`}
                    >
                        <Icon className="size-3.5" />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default LanguageToggle;

