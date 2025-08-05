import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UserAvatar from './UserAvatar';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'challenge';
  isRead: boolean;
}

interface Chat {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar: string;
    rank: string;
    isOnline: boolean;
  };
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

interface DirectMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const DirectMessaging = ({ isOpen, onClose }: DirectMessagingProps) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      participant: {
        id: '1',
        name: 'Nguyễn Văn A',
        avatar: '/placeholder.svg',
        rank: 'G+',
        isOnline: true,
      },
      lastMessage: {
        id: '1',
        senderId: '1',
        content: 'Chào bạn! Mai có rảnh đấu không?',
        timestamp: '2 phút trước',
        type: 'text',
        isRead: false,
      },
      unreadCount: 2,
      messages: [
        {
          id: '1',
          senderId: '1',
          content: 'Chào bạn! Mai có rảnh đấu không?',
          timestamp: '2 phút trước',
          type: 'text',
          isRead: false,
        },
        {
          id: '2',
          senderId: 'me',
          content: 'Chào! Mình có thể đấu lúc 7h tối được không?',
          timestamp: '1 phút trước',
          type: 'text',
          isRead: true,
        },
      ],
    },
    {
      id: '2',
      participant: {
        id: '2',
        name: 'Lê Thị B',
        avatar: '/placeholder.svg',
        rank: 'H+',
        isOnline: false,
      },
      lastMessage: {
        id: '3',
        senderId: '2',
        content: 'Cảm ơn bạn về trận đấu hay ho!',
        timestamp: '1 giờ trước',
        type: 'text',
        isRead: true,
      },
      unreadCount: 0,
      messages: [],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      content: newMessage,
      timestamp: 'Vừa xong',
      type: 'text',
      isRead: true,
    };

    setChats(prev =>
      prev.map(chat =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              messages: [...chat.messages, newMsg],
              lastMessage: newMsg,
            }
          : chat
      )
    );

    setNewMessage('');
  };

  const handleSendChallenge = () => {
    if (!selectedChat) return;

    const challengeMsg: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      content: 'Đã gửi lời thách đấu',
      timestamp: 'Vừa xong',
      type: 'challenge',
      isRead: true,
    };

    setChats(prev =>
      prev.map(chat =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              messages: [...chat.messages, challengeMsg],
              lastMessage: challengeMsg,
            }
          : chat
      )
    );
  };

  const filteredChats = chats.filter(chat =>
    chat.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-4xl h-[600px] p-0'>
        <div className='flex h-full'>
          {/* Chat List */}
          <div
            className={`${selectedChat ? 'hidden sm:flex' : 'flex'} w-full sm:w-1/3 flex-col border-r border-gray-200`}
          >
            <DialogHeader className='p-4 border-b border-gray-200'>
              <DialogTitle>Tin nhắn</DialogTitle>
              <div className='relative mt-2'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Tìm kiếm...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </DialogHeader>

            <div className='flex-1 overflow-y-auto'>
              {filteredChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div className='relative'>
                      <UserAvatar user={chat.participant} size='md' />
                      {chat.participant.isOnline && (
                        <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white'></div>
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <p className='font-medium truncate'>
                          {chat.participant.name}
                        </p>
                        <span className='text-xs text-gray-500'>
                          {chat.lastMessage.timestamp}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm text-gray-600 truncate'>
                          {chat.lastMessage.content}
                        </p>
                        {chat.unreadCount > 0 && (
                          <div className='bg-primary-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          {selectedChat && (
            <div className='flex flex-col w-full sm:w-2/3'>
              {/* Chat Header */}
              <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setSelectedChat(null)}
                    className='sm:hidden'
                  >
                    <ArrowLeft className='w-4 h-4' />
                  </Button>
                  <UserAvatar user={selectedChat.participant} size='sm' />
                  <div>
                    <p className='font-medium'>
                      {selectedChat.participant.name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {selectedChat.participant.isOnline
                        ? 'Đang hoạt động'
                        : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Button variant='ghost' size='sm'>
                    <Phone className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm'>
                    <Video className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm'>
                    <MoreVertical className='w-4 h-4' />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                {selectedChat.messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.senderId === 'me'
                          ? 'bg-primary-blue text-white'
                          : message.type === 'challenge'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.type === 'challenge' ? (
                        <div className='text-center'>
                          <p className='font-medium'>🎯 Thách đấu</p>
                          <p className='text-sm'>{message.content}</p>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === 'me'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className='p-4 border-t border-gray-200'>
                <div className='flex gap-2'>
                  <Input
                    placeholder='Nhập tin nhắn...'
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    className='flex-1'
                  />
                  <Button
                    onClick={handleSendChallenge}
                    variant='outline'
                    className='text-purple-600 border-purple-200 hover:bg-purple-50'
                  >
                    Thách đấu
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectMessaging;
