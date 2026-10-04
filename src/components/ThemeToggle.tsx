import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  compact = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { language } = useLanguage();

  const titleText = isDark
    ? language === 'bn'
      ? 'উচ্চ বৈসাদৃশ্য লাইট মোড চালু করুন'
      : 'Switch to High-Contrast Light Mode'
    : language === 'bn'
    ? 'ডিফল্ট সিনেমা ডার্ক মোড চালু করুন'
    : 'Switch to Default Dark Mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
        isDark
          ? 'bg-white/5 hover:bg-white/10 text-amber-300 hover:text-amber-200 border border-white/10 shadow-sm'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 shadow-sm'
      } ${className}`}
      title={titleText}
      aria-label={titleText}
      aria-pressed={!isDark}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-300" />
      )}

      {!compact && (
        <span className="text-xs font-semibold hidden md:inline font-mono">
          {isDark
            ? language === 'bn'
              ? 'লাইট'
              : 'Light'
            : language === 'bn'
            ? 'ডার্ক'
            : 'Dark'}
        </span>
      )}
    </button>
  );
};
