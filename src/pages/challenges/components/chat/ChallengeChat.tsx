import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Message {
  id: string;
  challenge_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface ChallengeChatProps {
  challengeId: string;
  challengerName: string;
  opponentName: string;
  challengerId: string;
  opponentId: string;
  isOpen: boolean;
  onToggle: () => void;
}

const ChallengeChat: React.FC<ChallengeChatProps> = ({
  challengeId,
  challengerName,
  opponentName,
  challengerId,
  opponentId,
  isOpen,
  onToggle,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUserId = user?.id === challengerId ? opponentId : challengerId;
  const otherUserName =
    user?.id === challengerId ? opponentName : challengerName;

  // Load messages - Mock implementation since challenge_messages table doesn't exist
  const loadMessages = async () => {
    if (!isOpen) return;

    setIsLoading(true);
    try {
      // Mock messages for now
      const mockMessages: Message[] = [
        {
          id: '1',
          challenge_id: challengeId,
          sender_id: challengerId === user?.id ? opponentId : challengerId,
          message: 'Chào bạn! Sẵn sàng cho trận đấu chưa? 🎱',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          sender_name:
            challengerId === user?.id ? opponentName : challengerName,
          sender_avatar: undefined,
        },
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Lỗi tải tin nhắn');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message - Mock implementation since challenge_messages table doesn't exist
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !user) return;

    setIsSending(true);
    try {
      // Mock sending message
      const newMsg: Message = {
        id: Date.now().toString(),
        challenge_id: challengeId,
        sender_id: user.id,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        sender_name: user.user_metadata?.full_name || 'Bạn',
        sender_avatar: user.user_metadata?.avatar_url,
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      toast.success('Đã gửi tin nhắn!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Lỗi gửi tin nhắn');
    } finally {
      setIsSending(false);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Setup realtime subscription - Disabled since challenge_messages table doesn't exist
  useEffect(() => {
    if (!isOpen) return;

    loadMessages();

    // Disabled realtime subscription for now
    // const channel = supabase...

    return () => {
      // cleanup if needed
    };
  }, [challengeId, isOpen]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <MessageCircle className='h-5 w-5 text-primary' />
            <CardTitle className='text-lg'>Chat với {otherUserName}</CardTitle>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={onToggle}
            className='gap-1'
          >
            {isOpen ? (
              <>
                <ChevronUp className='h-4 w-4' />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronDown className='h-4 w-4' />
                Mở rộng
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className='space-y-4'>
          {/* Messages area */}
          <div className='h-64 overflow-y-auto border rounded-lg p-3 space-y-3 bg-muted/20'>
            {isLoading ? (
              <div className='text-center text-muted-foreground'>
                Đang tải tin nhắn...
              </div>
            ) : messages.length === 0 ? (
              <div className='text-center text-muted-foreground'>
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.sender_id === user?.id
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  {message.sender_id !== user?.id && (
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={message.sender_avatar} />
                      <AvatarFallback>
                        {message.sender_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    }`}
                  >
                    <p className='text-sm'>{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender_id === user?.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(new Date(message.created_at), 'HH:mm', {
                        locale: vi,
                      })}
                    </p>
                  </div>

                  {message.sender_id === user?.id && (
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user?.user_metadata?.full_name
                          ?.charAt(0)
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className='flex gap-2'>
            <Input
              placeholder='Nhập tin nhắn...'
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className='flex-1'
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              size='sm'
              className='gap-2'
            >
              <Send className='h-4 w-4' />
              Gửi
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ChallengeChat;
