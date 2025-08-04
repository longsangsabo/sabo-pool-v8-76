import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  X,
  LayoutDashboard,
  Users,
  Trophy,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Home,
} from 'lucide-react';

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const drawerItems = [
  { icon: LayoutDashboard, path: '/admin', label: 'Dashboard' },
  { icon: Users, path: '/admin/users', label: 'Users' },
  { icon: Trophy, path: '/admin/tournaments', label: 'Tournaments' },
  { icon: Building2, path: '/admin/clubs', label: 'Clubs' },
  { icon: CreditCard, path: '/admin/transactions', label: 'Transactions' },
  { icon: BarChart3, path: '/admin/analytics', label: 'Analytics' },
  { icon: Settings, path: '/admin/settings', label: 'Settings' },
];

export const AdminMobileDrawer: React.FC<AdminMobileDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />

      <div className='absolute left-0 top-0 h-full w-80 bg-card shadow-lg'>
        <div className='p-4 border-b border-border'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-bold'>{t('admin.panel')}</h2>
            <Button variant='ghost' size='sm' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <nav className='flex-1 p-4 space-y-2'>
          {drawerItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className='flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                onClick={onClose}
              >
                <Icon className='h-4 w-4' />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className='p-4 border-t border-border space-y-2'>
          <NavLink to='/' onClick={onClose}>
            <Button variant='ghost' className='w-full justify-start gap-3'>
              <Home className='h-4 w-4' />
              {t('admin.home')}
            </Button>
          </NavLink>

          <Button
            variant='ghost'
            className='w-full justify-start gap-3'
            onClick={() => {
              signOut();
              onClose();
            }}
          >
            <LogOut className='h-4 w-4' />
            {t('admin.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
};
