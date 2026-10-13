import { useTranslation } from '@/i18n/LanguageContext';
import { Globe } from 'lucide-react';
import React from 'react';

interface LanguageToggleProps {
    variant?: 'pill' | 'compact' | 'dropdown';
    className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
    variant = 'pill',
    className = '',
}) => {
    const { language, setLanguage, toggleLanguage } = useTranslation();

    if (variant === 'compact') {
        return (
            <button
                type="button"
                onClick={toggleLanguage}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer shadow-2xs select-none ${className}`}
                aria-label={`Ubah bahasa ke ${language === 'id' ? 'English' : 'Bahasa Indonesia'}`}
                title={`Ubah bahasa ke ${language === 'id' ? 'English' : 'Bahasa Indonesia'}`}
            >
                <Globe className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{language.toUpperCase()}</span>
            </button>
        );
    }

    return (
        <div
            className={`inline-flex items-center p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs select-none ${className}`}
            role="group"
            aria-label="Pilih Bahasa / Select Language"
        >
            <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    language === 'id'
                        ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
                <span>ID</span>
            </button>
            <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    language === 'en'
                        ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
                <span>EN</span>
            </button>
        </div>
    );
};

export default LanguageToggle;
