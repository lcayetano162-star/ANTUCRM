// ============================================
// ANTU CRM - Language Switcher Component
// ES/EN language selector
// ============================================

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '@/i18n';

// ============================================
// LANGUAGE SWITCHER COMPONENT
// ============================================

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function LanguageSwitcher({
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = false,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentOption = LANGUAGE_OPTIONS.find(
    (opt) => opt.code === currentLanguage
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            'gap-2 font-medium',
            variant === 'ghost' && 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
            className
          )}
        >
          <Globe className="w-4 h-4" />
          {showLabel && currentOption && (
            <span className="hidden sm:inline">{currentOption.label}</span>
          )}
          <span className="text-lg">{currentOption?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => handleLanguageChange(option.code)}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              currentLanguage === option.code && 'bg-[var(--primary-50)]'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{option.flag}</span>
              <span
                className={cn(
                  currentLanguage === option.code && 'font-medium text-[var(--color-primary)]'
                )}
              >
                {option.label}
              </span>
            </div>
            {currentLanguage === option.code && (
              <Check className="w-4 h-4 text-[var(--color-primary)]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// COMPACT LANGUAGE SWITCHER (Icon only)
// ============================================

export function LanguageSwitcherCompact({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const currentOption = LANGUAGE_OPTIONS.find(
    (opt) => opt.code === currentLanguage
  );

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium',
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors',
        className
      )}
      title={`Switch to ${currentLanguage === 'es' ? 'English' : 'Español'}`}
    >
      <span className="text-lg">{currentOption?.flag}</span>
      <span className="uppercase text-xs">{currentLanguage}</span>
    </button>
  );
}

export default LanguageSwitcher;
