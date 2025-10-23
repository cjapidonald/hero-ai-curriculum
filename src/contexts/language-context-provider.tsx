import { useState, useEffect, ReactNode } from "react";
import { LanguageContext, type Language, type TranslationDictionary, type LanguageContextType } from "./language-context-hook";

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en"; // Default to English
  });

  const [translations, setTranslations] = useState<TranslationDictionary>({});

  useEffect(() => {
    // Load translations dynamically
    const loadTranslations = async () => {
      try {
        const module = (await import(`../translations/${language}.ts`)) as {
          default: TranslationDictionary;
        };
        setTranslations(module.default);
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
    };
    loadTranslations();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: TranslationValue = translations;

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === "string" ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};