import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { useChallengeWorkflow } from '@/hooks/useChallengeWorkflow';
import { useAuth } from '@/hooks/useAuth';

interface ChallengeConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: string;
  opponentName?: string;
}

export function ChallengeConversationModal({
  open,
  onOpenChange,
  challengeId,
  opponentName,
}: ChallengeConversationModalProps) {
  const { user } = useAuth();
  const { getChallengeConversations, sendMessage, isSendingMessage } =
    useChallengeWorkflow();
  const { data: conversations = [] } = getChallengeConversations(challengeId);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage({ challengeId, message });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md h-[500px] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            Chat với {opponentName || 'Đối thủ'}
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <div className='flex-1 overflow-y-auto space-y-3 p-4'>
          {conversations.length === 0 ? (
            <div className='text-center text-muted-foreground py-8'>
              Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
            </div>
          ) : (
            conversations.map(conversation => {
              const isOwn = conversation.sender_id === user?.id;
              return (
                <div
                  key={conversation.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className='w-8 h-8 flex-shrink-0'>
                    <AvatarImage src={conversation.sender?.avatar_url} />
                    <AvatarFallback>
                      {conversation.sender?.display_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg text-sm ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {conversation.message}
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      {new Date(conversation.created_at).toLocaleTimeString(
                        'vi-VN',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className='flex gap-2 p-4 pt-0'>
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder='Nhập tin nhắn...'
            disabled={isSendingMessage}
            className='flex-1'
          />
          <Button
            type='submit'
            disabled={!message.trim() || isSendingMessage}
            size='icon'
          >
            <Send className='w-4 h-4' />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
