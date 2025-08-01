import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Shield, ArrowRight } from 'lucide-react';
import { useClubRole } from '@/hooks/useClubRole';
import { useLanguage } from '@/contexts/LanguageContext';

export const AdminRoleSwitch: React.FC = () => {
  const navigate = useNavigate();
  const { isClubOwner, clubProfile } = useClubRole();
  const { t } = useLanguage();

  const handleSwitchToClub = () => {
    navigate('/club-management');
  };

  // Only show if user has club owner privileges
  if (!isClubOwner) {
    return null;
  }

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={handleSwitchToClub}
        className='flex items-center gap-2 hover:bg-muted'
      >
        <Building className='h-4 w-4' />
        <span>Chuyển sang CLB</span>
        <ArrowRight className='h-3 w-3' />
      </Button>

      {clubProfile && (
        <Badge variant='secondary' className='text-xs'>
          {clubProfile.club_name}
        </Badge>
      )}
    </div>
  );
};
