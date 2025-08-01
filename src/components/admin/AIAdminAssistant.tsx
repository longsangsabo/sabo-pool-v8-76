import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  MessageCircle,
  BarChart3,
  Users,
  TrendingUp,
} from 'lucide-react';

export const AIAdminAssistant = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content:
        'Xin chào! Tôi là trợ lý AI của hệ thống. Tôi có thể giúp bạn phân tích dữ liệu, tạo báo cáo và quản lý hệ thống. Bạn cần hỗ trợ gì?',
      timestamp: new Date(),
    },
  ]);

  const quickActions = [
    {
      title: 'Phân tích người dùng',
      description: 'Thống kê và xu hướng người dùng',
      icon: Users,
      action: () =>
        setQuery('Phân tích xu hướng người dùng đăng ký trong 30 ngày qua'),
    },
    {
      title: 'Báo cáo doanh thu',
      description: 'Tổng quan về doanh thu và giao dịch',
      icon: TrendingUp,
      action: () => setQuery('Tạo báo cáo doanh thu chi tiết theo tháng'),
    },
    {
      title: 'Thống kê trận đấu',
      description: 'Phân tích dữ liệu trận đấu và tournament',
      icon: BarChart3,
      action: () => setQuery('Thống kê số lượng trận đấu và tỷ lệ hoàn thành'),
    },
  ];

  const handleSendMessage = () => {
    if (!query.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: query,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setQuery('');

    // Simulate AI response
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        type: 'assistant' as const,
        content:
          'Tôi đang xử lý yêu cầu của bạn. Tính năng AI Assistant sẽ được hoàn thiện trong phiên bản tiếp theo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  return (
    <div className='space-y-6'>
      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Card
              key={index}
              className='hover:shadow-md transition-shadow cursor-pointer'
              onClick={action.action}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-center space-x-2'>
                  <IconComponent className='h-5 w-5 text-primary' />
                  <CardTitle className='text-sm'>{action.title}</CardTitle>
                </div>
                <CardDescription className='text-xs'>
                  {action.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Bot className='h-5 w-5' />
            <span>AI Assistant Chat</span>
          </CardTitle>
          <CardDescription>
            Đặt câu hỏi hoặc yêu cầu phân tích dữ liệu
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Messages */}
          <div className='min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 border rounded-lg p-4 bg-muted/20'>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  <div className='flex items-start space-x-2'>
                    {message.type === 'assistant' && (
                      <Bot className='h-4 w-4 mt-1 flex-shrink-0' />
                    )}
                    <div className='flex-1'>
                      <p className='text-sm'>{message.content}</p>
                      <p className='text-xs opacity-70 mt-1'>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className='flex space-x-2'>
            <Textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Nhập câu hỏi hoặc yêu cầu của bạn...'
              className='flex-1 min-h-[60px]'
              onKeyPress={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} className='px-6'>
              <Send className='h-4 w-4' />
            </Button>
          </div>

          <div className='text-xs text-muted-foreground'>
            <Badge variant='outline' className='mr-2'>
              Beta
            </Badge>
            Tính năng đang trong giai đoạn phát triển
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
