import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  membershipFilter: string;
  setMembershipFilter: (filter: string) => void;
  roleFilter: string;
  setRoleFilter: (filter: string) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  membershipFilter,
  setMembershipFilter,
  roleFilter,
  setRoleFilter,
}) => {
  return (
    <Card className='p-4'>
      <div className='flex gap-4 items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Tìm kiếm theo tên hoặc số điện thoại...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
        <Select value={membershipFilter} onValueChange={setMembershipFilter}>
          <SelectTrigger className='w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả</SelectItem>
            <SelectItem value='premium'>Premium</SelectItem>
            <SelectItem value='free'>Free</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className='w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả quyền</SelectItem>
            <SelectItem value='member'>Member</SelectItem>
            <SelectItem value='club_admin'>Club Admin</SelectItem>
            <SelectItem value='system_admin'>System Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
