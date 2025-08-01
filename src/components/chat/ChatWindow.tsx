import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  timestamp: string;
}

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  currentUserId,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender_id: currentUserId,
        sender_name: 'You',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className='h-96 flex flex-col'>
      <CardHeader className='flex-shrink-0 pb-3'>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <MessageCircle className='h-5 w-5' />
            <span>Chat</span>
          </div>
          {onClose && (
            <Button variant='ghost' size='sm' onClick={onClose}>
              ×
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className='flex-1 flex flex-col space-y-4'>
        <div className='flex-1 overflow-y-auto space-y-2 max-h-64'>
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.sender_id === currentUserId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className='text-sm'>{message.content}</p>
                <p className='text-xs opacity-70 mt-1'>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className='flex space-x-2'>
          <Textarea
            placeholder='Type your message...'
            value={newMessage}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setNewMessage(e.target.value)
            }
            onKeyPress={handleKeyPress}
            className='flex-1 min-h-[40px] max-h-[100px]'
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
            size='sm'
          >
            <Send className='h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
