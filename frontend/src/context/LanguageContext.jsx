import React, { createContext, useState, useEffect, useContext } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'en' || savedLang === 'vi') {
      setLanguageState(savedLang);
    } else {
      // Default to English, or try to detect browser language
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang && browserLang.startsWith('vi')) {
        setLanguageState('vi');
      } else {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'vi') {
      setLanguageState(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = (key, variables = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (!value) return key;
      value = value[k];
    }
    
    if (typeof value !== 'string') return key;
    
    let result = value;
    Object.keys(variables).forEach((varKey) => {
      result = result.replace(`{${varKey}}`, variables[varKey]);
    });
    
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
