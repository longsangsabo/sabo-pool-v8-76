import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const UserModeSwitch: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSwitchToUser = () => {
    navigate('/');
  };

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={handleSwitchToUser}
        className='flex items-center gap-2 hover:bg-muted'
      >
        <Users className='h-4 w-4' />
        <span>Chế độ người chơi</span>
        <ArrowRight className='h-3 w-3' />
      </Button>

      <Badge
        variant='secondary'
        className='text-xs bg-green-100 text-green-700'
      >
        Player Mode
      </Badge>
    </div>
  );
};
