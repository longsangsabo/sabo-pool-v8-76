import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Send, Users, AlertTriangle } from 'lucide-react';

const AdminNotifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState('all');

  const handleSend = () => {
    console.log('Sending notification:', { title, message, type, target });
    // Reset form
    setTitle('');
    setMessage('');
    setType('info');
    setTarget('all');
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <Bell className='w-6 h-6 text-blue-600' />
        <h1 className='text-2xl font-bold'>Hệ thống thông báo</h1>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Gửi thông báo mới</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Tiêu đề</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder='Nhập tiêu đề thông báo...'
              />
            </div>

            <div>
              <label className='text-sm font-medium'>Nội dung</label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder='Nhập nội dung thông báo...'
                rows={4}
              />
            </div>

            <div>
              <label className='text-sm font-medium'>Loại thông báo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='info'>Thông tin</SelectItem>
                  <SelectItem value='warning'>Cảnh báo</SelectItem>
                  <SelectItem value='urgent'>Khẩn cấp</SelectItem>
                  <SelectItem value='success'>Thành công</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='text-sm font-medium'>Đối tượng</label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả người dùng</SelectItem>
                  <SelectItem value='players'>Người chơi</SelectItem>
                  <SelectItem value='clubs'>Câu lạc bộ</SelectItem>
                  <SelectItem value='admins'>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSend} className='w-full'>
              <Send className='w-4 h-4 mr-2' />
              Gửi thông báo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Users className='w-4 h-4 text-blue-500' />
                  <span className='text-sm'>Đã gửi hôm nay</span>
                </div>
                <span className='font-semibold'>24</span>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Bell className='w-4 h-4 text-green-500' />
                  <span className='text-sm'>Đã đọc</span>
                </div>
                <span className='font-semibold'>89%</span>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <AlertTriangle className='w-4 h-4 text-yellow-500' />
                  <span className='text-sm'>Khẩn cấp</span>
                </div>
                <span className='font-semibold'>3</span>
              </div>
            </div>

            <div className='mt-6 pt-4 border-t'>
              <h4 className='font-medium mb-2'>Thông báo gần đây</h4>
              <div className='space-y-2'>
                <div className='text-sm p-2 bg-muted rounded'>
                  <p className='font-medium'>Bảo trì hệ thống</p>
                  <p className='text-xs text-muted-foreground'>2 giờ trước</p>
                </div>
                <div className='text-sm p-2 bg-muted rounded'>
                  <p className='font-medium'>Giải đấu mới</p>
                  <p className='text-xs text-muted-foreground'>1 ngày trước</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;
