import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Search, MoreVertical, Edit, Users, Filter, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  rank: string;
  is_online: boolean;
  last_seen: Date;
}

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: Date;
  is_read: boolean;
  type: 'text' | 'image' | 'file' | 'system';
}

interface ChatConversation {
  id: string;
  type: 'direct' | 'group';
  participants: ChatUser[];
  last_message: ChatMessage;
  unread_count: number;
  is_pinned: boolean;
  updated_at: Date;
}

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  onSelectChat,
  onCreateNewChat,
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'unread' | 'pinned'
  >('all');

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setConversations([
          {
            id: '1',
            type: 'direct',
            participants: [
              {
                id: '2',
                username: 'player2',
                avatar_url: '/avatars/player2.jpg',
                rank: 'B+',
                is_online: true,
                last_seen: new Date(),
              },
            ],
            last_message: {
              id: 'msg1',
              content: 'Bạn có muốn thách đấu không?',
              sender_id: '2',
              created_at: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
              is_read: false,
              type: 'text',
            },
            unread_count: 2,
            is_pinned: true,
            updated_at: new Date(Date.now() - 1000 * 60 * 5),
          },
          {
            id: '2',
            type: 'direct',
            participants: [
              {
                id: '3',
                username: 'pool_master',
                avatar_url: '/avatars/pool_master.jpg',
                rank: 'E+',
                is_online: false,
                last_seen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
              },
            ],
            last_message: {
              id: 'msg2',
              content: 'Trận đấu hôm qua rất hay!',
              sender_id: 'current-user',
              created_at: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
              is_read: true,
              type: 'text',
            },
            unread_count: 0,
            is_pinned: false,
            updated_at: new Date(Date.now() - 1000 * 60 * 15),
          },
          {
            id: '3',
            type: 'group',
            participants: [
              {
                id: '4',
                username: 'champion',
                avatar_url: '/avatars/champion.jpg',
                rank: 'G',
                is_online: true,
                last_seen: new Date(),
              },
              {
                id: '5',
                username: 'newbie',
                avatar_url: '/avatars/newbie.jpg',
                rank: 'I',
                is_online: false,
                last_seen: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
              },
            ],
            last_message: {
              id: 'msg3',
              content: 'Ai muốn tham gia giải đấu cuối tuần?',
              sender_id: '4',
              created_at: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
              is_read: false,
              type: 'text',
            },
            unread_count: 1,
            is_pinned: false,
            updated_at: new Date(Date.now() - 1000 * 60 * 60),
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const filteredConversations = conversations
    .filter(conversation => {
      const matchesSearch =
        conversation.participants.some(user =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        conversation.last_message.content
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'unread' && conversation.unread_count > 0) ||
        (selectedFilter === 'pinned' && conversation.is_pinned);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by pinned first, then by unread, then by last message time
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (a.unread_count === 0 && b.unread_count > 0) return 1;
      return b.updated_at.getTime() - a.updated_at.getTime();
    });

  const getConversationTitle = (conversation: ChatConversation) => {
    if (conversation.type === 'group') {
      return `Nhóm ${conversation.participants.map(p => p.username).join(', ')}`;
    }
    return conversation.participants[0]?.username || 'Unknown';
  };

  const getConversationAvatar = (conversation: ChatConversation) => {
    if (conversation.type === 'group') {
      return (
        <div className='relative'>
          <Avatar className='h-12 w-12'>
            <AvatarImage src={conversation.participants[0]?.avatar_url} />
            <AvatarFallback>
              <Users className='h-6 w-6' />
            </AvatarFallback>
          </Avatar>
          <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center'>
            <span className='text-xs text-white font-bold'>
              {conversation.participants.length}
            </span>
          </div>
        </div>
      );
    }

    const user = conversation.participants[0];
    return (
      <div className='relative'>
        <Avatar className='h-12 w-12'>
          <AvatarImage src={user?.avatar_url} />
          <AvatarFallback>{user?.username[0]}</AvatarFallback>
        </Avatar>
        {user?.is_online && (
          <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white'></div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='p-4 border-b'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-bold'>Tin nhắn</h2>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={onCreateNewChat}>
              <Plus className='h-4 w-4' />
            </Button>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className='relative mb-4'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Tìm kiếm tin nhắn...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        {/* Filters */}
        <div className='flex gap-2'>
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedFilter('all')}
          >
            Tất cả
          </Button>
          <Button
            variant={selectedFilter === 'unread' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedFilter('unread')}
          >
            Chưa đọc
          </Button>
          <Button
            variant={selectedFilter === 'pinned' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedFilter('pinned')}
          >
            Ghim
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className='flex-1 overflow-y-auto'>
        {filteredConversations.length > 0 ? (
          <div className='space-y-1'>
            {filteredConversations.map(conversation => (
              <Card
                key={conversation.id}
                className='cursor-pointer hover:bg-gray-50 transition-colors border-0 rounded-none border-b'
                onClick={() => onSelectChat(conversation.id)}
              >
                <CardContent className='p-4'>
                  <div className='flex items-center gap-3'>
                    {getConversationAvatar(conversation)}

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <h3 className='font-medium truncate'>
                          {getConversationTitle(conversation)}
                        </h3>
                        <div className='flex items-center gap-2'>
                          {conversation.is_pinned && (
                            <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                          )}
                          <span className='text-xs text-gray-500'>
                            {formatDistanceToNow(
                              conversation.last_message.created_at,
                              {
                                addSuffix: true,
                                locale: vi,
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <p className='text-sm text-gray-600 truncate flex-1'>
                          {conversation.last_message.sender_id ===
                            'current-user' && 'Bạn: '}
                          {conversation.last_message.content}
                        </p>

                        <div className='flex items-center gap-2 ml-2'>
                          {conversation.unread_count > 0 && (
                            <Badge className='bg-red-500 text-white text-xs'>
                              {conversation.unread_count}
                            </Badge>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 w-6 p-0'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-gray-500'>
            {searchTerm
              ? 'Không tìm thấy cuộc trò chuyện nào'
              : 'Chưa có cuộc trò chuyện nào'}
          </div>
        )}
      </div>
    </div>
  );
};
