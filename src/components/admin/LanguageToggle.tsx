import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
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
        {language === 'vi' ? '🇺🇸 EN' : '🇻🇳 VI'}
      </span>
    </Button>
  );
};

export default LanguageToggle;
