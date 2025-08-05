import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Building } from 'lucide-react';

interface RoleSelectorProps {
  userRole: 'player' | 'club_owner' | 'both';
  activeRole: 'player' | 'club_owner';
  onRoleChange: (role: 'player' | 'club_owner') => void;
}

const RoleSelector = ({
  userRole,
  activeRole,
  onRoleChange,
}: RoleSelectorProps) => {
  const { user } = useAuth();

  const updateActiveRole = async (newRole: 'player' | 'club_owner') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', user.id);

      if (error) throw error;

      onRoleChange(newRole);
      toast.success(
        `Đã chuyển sang chế độ ${newRole === 'player' ? 'người chơi' : 'chủ câu lạc bộ'}`
      );
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Lỗi khi chuyển chế độ: ' + error.message);
    }
  };

  if (userRole !== 'both') {
    return null;
  }

  return (
    <div className='flex items-center space-x-2'>
      <Select value={activeRole} onValueChange={updateActiveRole}>
        <SelectTrigger className='w-[180px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='player'>
            <div className='flex items-center'>
              <Users className='w-4 h-4 mr-2' />
              Người chơi
            </div>
          </SelectItem>
          <SelectItem value='club_owner'>
            <div className='flex items-center'>
              <Building className='w-4 h-4 mr-2' />
              Chủ CLB
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoleSelector;
