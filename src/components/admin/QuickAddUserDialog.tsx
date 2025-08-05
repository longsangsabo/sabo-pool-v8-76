import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id?: string;
  user_id: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  verified_rank?: string;
  current_rank?: string;
  elo?: number;
}

interface Tournament {
  id: string;
  name: string;
  max_participants: number;
  current_participants: number;
}

interface QuickAddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament;
  onSuccess: () => void;
}

export const QuickAddUserDialog: React.FC<QuickAddUserDialogProps> = ({
  open,
  onOpenChange,
  tournament,
  onSuccess,
}) => {
  const [users, setUsers] = useState<Player[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Player[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  // Load available users
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading users for quick add...');

      // Get all users with ranking data
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select(
          `
          id, user_id, full_name, display_name, avatar_url, verified_rank, elo
        `
        )
        .limit(200);

      if (usersError) {
        console.error('❌ Error loading users:', usersError);
        throw usersError;
      }

      // Get existing registrations
      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('user_id')
        .eq('tournament_id', tournament.id);

      if (regError) {
        console.error('❌ Error loading registrations:', regError);
        throw regError;
      }

      const registeredUserIds = new Set(
        registrations?.map(r => r.user_id) || []
      );

      // Filter out already registered users
      const availableUsers = (allUsers || []).filter(
        user => !registeredUserIds.has(user.user_id)
      );

      console.log('✅ Available users for adding:', availableUsers.length);
      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (error: any) {
      console.error('❌ Error in loadUsers:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => {
      const name = (user.full_name || user.display_name || '').toLowerCase();
      const rank = (
        user.verified_rank ||
        user.current_rank ||
        ''
      ).toLowerCase();
      const search = searchTerm.toLowerCase();

      return name.includes(search) || rank.includes(search);
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Toggle user selection
  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Add selected users
  const addSelectedUsers = async () => {
    if (selectedUsers.size === 0) return;

    setAdding(true);
    try {
      const registrations = Array.from(selectedUsers).map(userId => ({
        tournament_id: tournament.id,
        user_id: userId,
        registration_status: 'confirmed' as const,
        payment_status: 'paid' as const,
        created_at: new Date().toISOString(),
      }));

      console.log('🚀 Bulk adding participants:', registrations);

      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert(registrations)
        .select();

      console.log('✅ Bulk insert result:', { data, error });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      toast({
        title: 'Thành công',
        description: `Đã thêm ${selectedUsers.size} người tham gia vào giải đấu ${tournament.name}!`,
      });

      // Reset state
      setSelectedUsers(new Set());
      setSearchTerm('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Error adding participants:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm người tham gia: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
      setSelectedUsers(new Set());
      setSearchTerm('');
    }
  }, [open, tournament.id]);

  const availableSlots =
    tournament.max_participants - tournament.current_participants;
  const canAddMore = selectedUsers.size <= availableSlots;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus className='h-5 w-5' />
            Thêm nhanh người tham gia
          </DialogTitle>
          <DialogDescription>
            Giải đấu: {tournament.name} • Còn lại: {availableSlots} chỗ
            {selectedUsers.size > 0 && (
              <span className='ml-2'>
                • Đã chọn: {selectedUsers.size}
                {!canAddMore && (
                  <span className='text-red-500'> (vượt quá giới hạn)</span>
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className='flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Tìm kiếm theo tên hoặc hạng...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {/* Users list */}
        <ScrollArea className='flex-1 border rounded-lg'>
          {loading ? (
            <div className='p-4 text-center'>
              Đang tải danh sách người dùng...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className='p-4 text-center text-muted-foreground'>
              {searchTerm
                ? 'Không tìm thấy người dùng phù hợp'
                : 'Không có người dùng khả dụng'}
            </div>
          ) : (
            <div className='p-2 space-y-2'>
              {filteredUsers.map(user => (
                <div
                  key={user.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUsers.has(user.user_id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleUser(user.user_id)}
                >
                  <Checkbox
                    checked={selectedUsers.has(user.user_id)}
                    onChange={() => toggleUser(user.user_id)}
                  />

                  <div className='flex-1'>
                    <div className='font-medium'>
                      {user.full_name || user.display_name || 'Không có tên'}
                    </div>
                    <div className='flex gap-2 mt-1'>
                      {(user.verified_rank || user.current_rank) && (
                        <Badge variant='outline' className='text-xs'>
                          {user.verified_rank || user.current_rank}
                        </Badge>
                      )}
                      {user.elo && (
                        <Badge variant='secondary' className='text-xs'>
                          ELO: {user.elo}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className='flex justify-between items-center pt-4 border-t'>
          <div className='text-sm text-muted-foreground'>
            {selectedUsers.size > 0 ? (
              canAddMore ? (
                `Sẽ thêm ${selectedUsers.size} người tham gia`
              ) : (
                <span className='text-red-500'>
                  Chỉ có thể thêm tối đa {availableSlots} người
                </span>
              )
            ) : (
              'Chọn người dùng để thêm vào giải đấu'
            )}
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              onClick={addSelectedUsers}
              disabled={selectedUsers.size === 0 || !canAddMore || adding}
            >
              {adding ? 'Đang thêm...' : `Thêm ${selectedUsers.size} người`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
