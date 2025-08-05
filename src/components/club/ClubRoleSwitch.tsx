import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Shield, ArrowRight } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';

export const ClubRoleSwitch: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();
  const { t } = useLanguage();

  const handleSwitchToAdmin = () => {
    navigate('/admin');
  };

  // Only show if user has admin privileges
  if (!isAdmin) {
    return null;
  }

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={handleSwitchToAdmin}
        className='flex items-center gap-2 hover:bg-muted'
      >
        <Shield className='h-4 w-4' />
        <span>Chuyển sang Admin</span>
        <ArrowRight className='h-3 w-3' />
      </Button>

      <Badge variant='secondary' className='text-xs bg-red-100 text-red-700'>
        Admin Mode
      </Badge>
    </div>
  );
};
