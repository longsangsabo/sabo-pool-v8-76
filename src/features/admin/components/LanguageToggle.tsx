import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language === 'vi' ? 'vi' : 'en';

  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === 'vi' ? 'en' : 'vi');
  };

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={toggleLanguage}
      className='flex items-center gap-2 px-3 py-2'
    >
      <Globe className='h-4 w-4' />
      <span className='font-medium'>
        {currentLang === 'vi' ? '🇺🇸 EN' : '🇻🇳 VI'}
      </span>
    </Button>
  );
};

export default LanguageToggle;
