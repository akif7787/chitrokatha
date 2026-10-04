import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types/movie';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();

  const handleSelect = (lang: Language) => {
    if (language !== lang) {
      setLanguage(lang);
    }
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5 backdrop-blur-md shadow-inner ${className}`}
        role="group"
        aria-label="Language Switcher"
      >
        <button
          type="button"
          onClick={() => handleSelect('bn')}
          aria-pressed={language === 'bn'}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer ${
            language === 'bn'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="বাংলা ভাষা নির্বাচন করুন"
        >
          বাং
        </button>
        <button
          type="button"
          onClick={() => handleSelect('en')}
          aria-pressed={language === 'en'}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer ${
            language === 'en'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Switch to English"
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-2xl bg-black/40 border border-white/10 p-1 backdrop-blur-md shadow-md ${className}`}
      role="group"
      aria-label="Persistent Language Switcher"
    >
      <div className="flex items-center pl-2 pr-1.5 text-rose-400 pointer-events-none">
        <Globe className="w-3.5 h-3.5" />
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => handleSelect('bn')}
          aria-pressed={language === 'bn'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            language === 'bn'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-950/50 ring-1 ring-rose-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="বাংলা (Bengali)"
        >
          <span>বাংলা</span>
          {language === 'bn' && <Check className="w-3 h-3 stroke-[2.5]" />}
        </button>

        <button
          type="button"
          onClick={() => handleSelect('en')}
          aria-pressed={language === 'en'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            language === 'en'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-950/50 ring-1 ring-rose-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="English"
        >
          <span>English</span>
          {language === 'en' && <Check className="w-3 h-3 stroke-[2.5]" />}
        </button>
      </div>
    </div>
  );
};
