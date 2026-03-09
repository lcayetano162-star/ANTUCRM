// ============================================
// ANTU CRM - i18n Configuration
// Multi-language support (ES/EN)
// ============================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import esCommon from './locales/es/common.json';
import enCommon from './locales/en/common.json';

// ============================================
// RESOURCES
// ============================================

const resources = {
  es: {
    common: esCommon,
  },
  en: {
    common: enCommon,
  },
};

// ============================================
// CONFIGURATION
// ============================================

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    defaultNS: 'common',
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'antu-language',
    },

    // Interpolation
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Supported languages
    supportedLngs: ['es', 'en'],

    // Debug mode (disable in production)
    debug: false,
  });

// ============================================
// LANGUAGE OPTIONS
// ============================================

export const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español', flag: '🇩🇴', locale: 'es-DO' },
  { code: 'en', label: 'English', flag: '🇺🇸', locale: 'en-US' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getCurrentLocale = (language: string): string => {
  const option = LANGUAGE_OPTIONS.find((opt) => opt.code === language);
  return option?.locale || 'es-DO';
};

export const formatCurrency = (
  value: number,
  currency: string = 'DOP',
  language: string = 'es'
): string => {
  const locale = getCurrentLocale(language);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (
  date: Date | string,
  language: string = 'es',
  options?: Intl.DateTimeFormatOptions
): string => {
  const locale = getCurrentLocale(language);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(
    new Date(date)
  );
};

export const formatNumber = (value: number, language: string = 'es'): string => {
  const locale = getCurrentLocale(language);
  return new Intl.NumberFormat(locale).format(value);
};

export const formatRelativeTime = (
  date: Date | string,
  language: string = 'es'
): string => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }
  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  }
  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  }
  if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  }
  if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  }
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
};

export default i18n;
