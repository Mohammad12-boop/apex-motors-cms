import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'en' | 'ar';
type LanguageValue = { lang: Language; t: (en: string, ar: string) => string; setLanguage: (lang: Language) => void; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const query = new URLSearchParams(window.location.search).get('lang');
    if (query === 'ar' || query === 'en') return query;
    try { return localStorage.getItem('apex-language') === 'ar' ? 'ar' : 'en'; } catch { return 'en'; }
  });
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('apex-language', lang); } catch { /* Preference is optional. */ }
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) { url.searchParams.set('lang', lang); window.history.replaceState(window.history.state, '', url); }
  }, [lang]);
  return <LanguageContext.Provider value={{ lang, t: (en, ar) => lang === 'ar' ? ar : en, setLanguage: setLang, toggleLanguage: () => setLang(l => l === 'en' ? 'ar' : 'en') }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { const value = useContext(LanguageContext); if (!value) throw new Error('LanguageProvider is required.'); return value; }
