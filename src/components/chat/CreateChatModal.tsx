import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, User, Plus, Check, X } from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatar_url?: string;
  rank: string;
  is_online: boolean;
  last_seen: Date;
}

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers([
        {
          id: '1',
          username: 'player2',
          avatar_url: '/avatars/player2.jpg',
          rank: 'B+',
          is_online: true,
          last_seen: new Date(),
        },
        {
          id: '2',
          username: 'pool_master',
          avatar_url: '/avatars/pool_master.jpg',
          rank: 'F+',
          is_online: false,
          last_seen: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          id: '3',
          username: 'champion',
          avatar_url: '/avatars/champion.jpg',
          rank: 'G',
          is_online: true,
          last_seen: new Date(),
        },
        {
          id: '4',
          username: 'newbie',
          avatar_url: '/avatars/newbie.jpg',
          rank: 'H',
          is_online: false,
          last_seen: new Date(Date.now() - 1000 * 60 * 60),
        },
        {
          id: '5',
          username: 'veteran',
          avatar_url: '/avatars/veteran.jpg',
          rank: 'A+',
          is_online: true,
          last_seen: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    if (chatType === 'direct') {
      setSelectedUsers([user]);
    } else {
      const isSelected = selectedUsers.some(u => u.id === user.id);
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const chatId = `chat_${Date.now()}`;
      onChatCreated(chatId);
      handleClose();
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUsers([]);
    setGroupName('');
    setChatType('direct');
    onClose();
  };

  const canCreateChat = () => {
    if (chatType === 'direct') {
      return selectedUsers.length === 1;
    } else {
      return selectedUsers.length >= 2 && groupName.trim().length > 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Plus className='h-5 w-5' />
            Tạo cuộc trò chuyện mới
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Chat Type Selection */}
          <Tabs
            value={chatType}
            onValueChange={value => setChatType(value as 'direct' | 'group')}
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='direct' className='flex items-center gap-2'>
                <User className='h-4 w-4' />
                Tin nhắn riêng
              </TabsTrigger>
              <TabsTrigger value='group' className='flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Nhóm chat
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Group Name Input */}
          {chatType === 'group' && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Tên nhóm
              </label>
              <Input
                placeholder='Nhập tên nhóm...'
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
            </div>
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {chatType === 'direct' ? 'Người được chọn:' : 'Thành viên:'}
              </label>
              <div className='space-y-2'>
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className='flex items-center justify-between p-2 bg-gray-50 rounded-lg'
                  >
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                      </Avatar>
                      <span className='text-sm font-medium'>
                        {user.username}
                      </span>
                      <Badge variant='outline' className='text-xs'>
                        {user.rank}
                      </Badge>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleUserSelect(user)}
                      className='h-6 w-6 p-0'
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Search */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Tìm kiếm người dùng
            </label>
            <div className='relative mb-3'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm theo tên...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>

            {isLoading ? (
              <div className='flex items-center justify-center py-4'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
              </div>
            ) : (
              <div className='max-h-48 overflow-y-auto space-y-2'>
                {filteredUsers.map(user => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                      </Avatar>

                      <div className='flex-1 text-left'>
                        <div className='font-medium'>{user.username}</div>
                        <div className='text-sm text-gray-600'>
                          Hạng {user.rank}
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        {user.is_online && (
                          <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        )}
                        {isSelected && (
                          <Check className='h-4 w-4 text-blue-600' />
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredUsers.length === 0 && searchTerm && (
                  <div className='text-center py-4 text-gray-500'>
                    Không tìm thấy người dùng nào
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2'>
            <Button variant='outline' onClick={handleClose} className='flex-1'>
              Hủy
            </Button>
            <Button
              onClick={handleCreateChat}
              disabled={!canCreateChat()}
              className='flex-1'
            >
              Tạo cuộc trò chuyện
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
