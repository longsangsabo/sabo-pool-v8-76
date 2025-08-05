import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Ban, Eye } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  current_rank: string;
  role: string;
  created_at: string;
  avatar_url?: string;
  user_id: string;
  clubs?: { name: string };
  membership_type?: string;
  membership_status?: string;
}

interface UserListItemProps {
  user: UserProfile;
}

export const UserListItem: React.FC<UserListItemProps> = ({ user }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'bg-red-100 text-red-800';
      case 'club_admin':
        return 'bg-orange-100 text-orange-800';
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className='p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Avatar>
            <AvatarFallback>
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className='font-medium'>{user.full_name}</h3>
            <p className='text-sm text-gray-600'>{user.phone}</p>
            {user.clubs && (
              <p className='text-xs text-gray-500'>CLB: {user.clubs.name}</p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className='text-center'>
            <div className='text-sm font-medium'>{user.current_rank}</div>
            <div className='text-xs text-gray-500'>Hạng</div>
          </div>

          <Badge className={getRoleColor(user.role || 'member')}>
            {user.role === 'system_admin'
              ? 'System Admin'
              : user.role === 'club_admin'
                ? 'Club Admin'
                : 'Member'}
          </Badge>

          <Badge
            variant={
              user.membership_type === 'premium' ? 'default' : 'secondary'
            }
          >
            {user.membership_type === 'premium' ? 'Premium' : 'Free'}
          </Badge>

          <div className='text-xs text-gray-500'>
            {new Date(user.created_at).toLocaleDateString('vi-VN')}
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' size='sm'>
              <Eye className='h-4 w-4' />
            </Button>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
            <Button variant='outline' size='sm'>
              <Ban className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
