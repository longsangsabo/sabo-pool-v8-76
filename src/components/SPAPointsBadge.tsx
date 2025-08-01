import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSPABalance } from '@/hooks/useSPABalance';

export const SPAPointsBadge: React.FC = () => {
  const { user } = useAuth();
  const { balance, loading } = useSPABalance();

  if (loading) {
    return (
      <Badge
        variant='outline'
        className='bg-primary/10 text-primary border-primary/20'
      >
        <Coins className='w-3 h-3 mr-1' />
        <span>...</span>
      </Badge>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Badge
      variant='outline'
      className='bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border-yellow-200 hover:from-yellow-100 hover:to-orange-100'
    >
      <Coins className='w-3 h-3 mr-1' />
      <span className='font-medium'>{balance} SPA</span>
    </Badge>
  );
};

export default SPAPointsBadge;
