import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Menu, Shield, Home } from 'lucide-react';

interface AdminMobileHeaderProps {
  onMenuClick: () => void;
}

export const AdminMobileHeader: React.FC<AdminMobileHeaderProps> = ({
  onMenuClick,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className='bg-card border-b border-border px-4 py-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onMenuClick}
            className='hover:bg-muted'
          >
            <Menu className='h-5 w-5' />
          </Button>

          <div className='flex items-center gap-2'>
            <Shield className='h-4 w-4 text-primary' />
            <h1 className='text-lg font-bold'>{t('admin.panel')}</h1>
            <Badge
              variant='secondary'
              className='bg-primary/10 text-primary text-xs'
            >
              Admin
            </Badge>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/dashboard')}
            className='hover:bg-primary/10'
          >
            <Home className='h-4 w-4' />
          </Button>

          <Button variant='ghost' size='sm'>
            <Bell className='h-4 w-4' />
          </Button>

          <Avatar className='h-7 w-7'>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className='text-xs'>
              {user?.user_metadata?.full_name?.charAt(0) ||
                user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
