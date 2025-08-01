import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  interpolate: (template: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Simple translations
const translations = {
  vi: {
    'admin.panel': 'Quản Trị Viên',
    'admin.home': 'Trang Chủ',
    'admin.logout': 'Đăng Xuất',
    'admin.dashboard': 'Bảng Điều Khiển',
    'admin.users': 'Người Dùng',
    'admin.tournaments': 'Giải Đấu',
    'admin.clubs': 'Câu Lạc Bộ',
    'admin.analytics': 'Phân Tích',
    'admin.settings': 'Cài Đặt',
    'club.management': 'Quản Lý CLB',
    'club.dashboard': 'Bảng Điều Khiển CLB',
    'club.tournaments': 'Giải Đấu CLB',
    'club.members': 'Thành Viên',
    'club.settings': 'Cài Đặt CLB',
  },
  en: {
    'admin.panel': 'Admin Panel',
    'admin.home': 'Home',
    'admin.logout': 'Logout',
    'admin.dashboard': 'Dashboard',
    'admin.users': 'Users',
    'admin.tournaments': 'Tournaments',
    'admin.clubs': 'Clubs',
    'admin.analytics': 'Analytics',
    'admin.settings': 'Settings',
    'club.management': 'Club Management',
    'club.dashboard': 'Club Dashboard',
    'club.tournaments': 'Club Tournaments',
    'club.members': 'Members',
    'club.settings': 'Club Settings',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>('vi');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['vi', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const interpolate = (
    template: string,
    params: Record<string, any> = {}
  ): string => {
    return Object.keys(params).reduce((result, key) => {
      return result.replace(new RegExp(`{${key}}`, 'g'), params[key]);
    }, template);
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t, interpolate }}
    >
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
