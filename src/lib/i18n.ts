import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { en } from './i18n/en';
import { ru } from './i18n/ru';
import { es } from './i18n/es';
import { fr } from './i18n/fr';
import { de } from './i18n/de';
import { pt } from './i18n/pt';
import { it } from './i18n/it';
import { zh } from './i18n/zh';
import { ja } from './i18n/ja';
import { ko } from './i18n/ko';
import { ar } from './i18n/ar';
import { hi } from './i18n/hi';
import { tr } from './i18n/tr';
import { pl } from './i18n/pl';
import { uk } from './i18n/uk';
import { nl } from './i18n/nl';

export const LANGUAGES = [
  { code: 'en', native: 'English', flag: '🇺🇸' },
  { code: 'ru', native: 'Русский', flag: '🇷🇺' },
  { code: 'uk', native: 'Українська', flag: '🇺🇦' },
  { code: 'es', native: 'Español', flag: '🇪🇸' },
  { code: 'pt', native: 'Português', flag: '🇧🇷' },
  { code: 'fr', native: 'Français', flag: '🇫🇷' },
  { code: 'de', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', native: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', native: 'Polski', flag: '🇵🇱' },
  { code: 'tr', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'zh', native: '中文', flag: '🇨🇳' },
  { code: 'ja', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', native: '한국어', flag: '🇰🇷' },
  { code: 'ar', native: 'العربية', flag: '🇸🇦' },
  { code: 'hi', native: 'हिन्दी', flag: '🇮🇳' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const DICTS: Record<LanguageCode, any> = {
  en, ru, uk, es, pt, fr, de, it, nl, pl, tr, zh, ja, ko, ar, hi,
};

const RTL: LanguageCode[] = ['ar'];

interface I18nState {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (code) => {
        set({ language: code });
        document.documentElement.lang = code;
        document.documentElement.dir = RTL.includes(code) ? 'rtl' : 'ltr';
      },
    }),
    { name: 'wavebox-i18n' },
  ),
);

// Apply dir/lang on initial load.
if (typeof document !== 'undefined') {
  const code = useI18n.getState().language;
  document.documentElement.lang = code;
  document.documentElement.dir = RTL.includes(code) ? 'rtl' : 'ltr';
}

function lookup(dict: any, key: string): string | undefined {
  return key.split('.').reduce<any>((acc, k) => (acc == null ? acc : acc[k]), dict);
}

export function useT() {
  const lang = useI18n((s) => s.language);
  return (key: string, params?: Record<string, string | number>) => {
    let val = lookup(DICTS[lang], key);
    if (val == null) val = lookup(DICTS.en, key);
    if (typeof val !== 'string') return key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return val;
  };
}
