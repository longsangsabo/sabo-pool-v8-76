import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellOff,
  Search,
  Filter,
  Archive,
  Trash2,
  Check,
  Star,
  Clock,
  AlertTriangle,
  Info,
  Trophy,
  Users,
  MessageCircle,
  Calendar,
  Settings,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'tournament' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  auto_popup?: boolean;
  user_id: string;
}

const EnhancedNotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  const {
    notifications = [],
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  // Mock data for development
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Giải đấu mới',
      message: 'Giải đấu SABO 2024 đã được tạo và mở đăng ký',
      type: 'tournament',
      priority: 'high',
      is_read: false,
      created_at: new Date().toISOString(),
      user_id: 'user1',
    },
    {
      id: '2',
      title: 'Thăng hạng',
      message: 'Bạn đã thăng lên hạng I với 1250 điểm ELO',
      type: 'success',
      priority: 'medium',
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      user_id: 'user1',
    },
  ];

  const allNotifications =
    notifications.length > 0
      ? (notifications as Notification[])
      : mockNotifications;

  const filteredNotifications = useMemo(() => {
    return allNotifications.filter(notification => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === 'all' || notification.type === filterType;
      const matchesPriority =
        filterPriority === 'all' || notification.priority === filterPriority;

      let matchesTab = true;
      if (activeTab === 'unread') {
        matchesTab = !notification.is_read;
      } else if (activeTab === 'important') {
        matchesTab =
          notification.priority === 'urgent' ||
          notification.priority === 'high';
      }

      return matchesSearch && matchesType && matchesPriority && matchesTab;
    });
  }, [allNotifications, searchTerm, filterType, filterPriority, activeTab]);

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <Trophy className='w-4 h-4' />;
      case 'success':
        return <Check className='w-4 h-4' />;
      case 'warning':
        return <AlertTriangle className='w-4 h-4' />;
      case 'error':
        return <X className='w-4 h-4' />;
      case 'system':
        return <Settings className='w-4 h-4' />;
      default:
        return <Info className='w-4 h-4' />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'bg-purple-100 text-purple-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'system':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      toast.success('Đã đánh dấu là đã đọc');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      toast.success('Đã xóa thông báo');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleBulkAction = async (action: 'read' | 'delete') => {
    if (selectedNotifications.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một thông báo');
      return;
    }

    try {
      if (action === 'read') {
        for (const id of selectedNotifications) {
          await markAsRead(id);
        }
        toast.success(
          `Đã đánh dấu ${selectedNotifications.length} thông báo là đã đọc`
        );
      } else {
        for (const id of selectedNotifications) {
          await deleteNotification(id);
        }
        toast.success(`Đã xóa ${selectedNotifications.length} thông báo`);
      }
      setSelectedNotifications([]);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  return (
    <>
      {/* Notification Bell Button */}
      <Button
        variant='ghost'
        size='sm'
        className='relative'
        onClick={() => setIsOpen(true)}
      >
        <Bell className='w-5 h-5' />
        {unreadCount > 0 && (
          <Badge
            variant='destructive'
            className='absolute -top-2 -right-2 px-1 min-w-[20px] h-5 flex items-center justify-center text-xs'
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Center Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-4xl max-h-[80vh] p-0'>
          <DialogHeader className='p-6 pb-4'>
            <DialogTitle className='flex items-center gap-2'>
              <Bell className='w-5 h-5' />
              Trung tâm thông báo
              {unreadCount > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {unreadCount} chưa đọc
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Stats Cards */}
          <div className='px-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='text-center p-3 bg-blue-50 rounded-lg'>
                <div className='text-xl font-bold text-blue-600'>
                  {allNotifications.length}
                </div>
                <div className='text-xs text-gray-600'>Tổng cộng</div>
              </div>
              <div className='text-center p-3 bg-red-50 rounded-lg'>
                <div className='text-xl font-bold text-red-600'>
                  {unreadCount}
                </div>
                <div className='text-xs text-gray-600'>Chưa đọc</div>
              </div>
              <div className='text-center p-3 bg-green-50 rounded-lg'>
                <div className='text-xl font-bold text-green-600'>
                  {
                    filteredNotifications.filter(
                      n => n.priority === 'urgent' || n.priority === 'high'
                    ).length
                  }
                </div>
                <div className='text-xs text-gray-600'>Quan trọng</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className='px-6 space-y-4'>
            <div className='flex flex-col lg:flex-row gap-4'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  placeholder='Tìm kiếm thông báo...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
              <div className='flex gap-2'>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Loại' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='tournament'>Giải đấu</SelectItem>
                    <SelectItem value='success'>Thành công</SelectItem>
                    <SelectItem value='warning'>Cảnh báo</SelectItem>
                    <SelectItem value='error'>Lỗi</SelectItem>
                    <SelectItem value='system'>Hệ thống</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Độ ưu tiên' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='urgent'>Khẩn cấp</SelectItem>
                    <SelectItem value='high'>Cao</SelectItem>
                    <SelectItem value='medium'>Trung bình</SelectItem>
                    <SelectItem value='low'>Thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className='flex items-center gap-2 p-3 bg-blue-50 rounded-lg'>
                <span className='text-sm text-blue-700'>
                  Đã chọn {selectedNotifications.length} thông báo
                </span>
                <div className='flex gap-2 ml-auto'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleBulkAction('read')}
                  >
                    <Check className='w-4 h-4 mr-1' />
                    Đánh dấu đã đọc
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setSelectedNotifications([])}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className='px-6'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='all'>
                  Tất cả ({allNotifications.length})
                </TabsTrigger>
                <TabsTrigger value='unread'>
                  Chưa đọc ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value='important'>
                  Quan trọng (
                  {
                    filteredNotifications.filter(
                      n => n.priority === 'urgent' || n.priority === 'high'
                    ).length
                  }
                  )
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className='mt-4'>
                <ScrollArea className='h-[400px] pr-4'>
                  {filteredNotifications.length === 0 ? (
                    <div className='text-center py-8'>
                      <BellOff className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
                      <h3 className='text-lg font-semibold mb-2'>
                        Không có thông báo
                      </h3>
                      <p className='text-muted-foreground'>
                        {searchTerm ||
                        filterType !== 'all' ||
                        filterPriority !== 'all'
                          ? 'Không tìm thấy thông báo phù hợp với bộ lọc'
                          : 'Bạn chưa có thông báo nào'}
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {filteredNotifications.map(notification => (
                        <Card
                          key={notification.id}
                          className={`transition-all hover:shadow-md ${
                            !notification.is_read
                              ? 'bg-blue-50/50 border-blue-200'
                              : ''
                          } ${
                            selectedNotifications.includes(notification.id)
                              ? 'ring-2 ring-blue-500'
                              : ''
                          }`}
                        >
                          <CardContent className='p-4'>
                            <div className='flex items-start gap-3'>
                              {/* Checkbox */}
                              <div className='flex items-center pt-1'>
                                <input
                                  type='checkbox'
                                  checked={selectedNotifications.includes(
                                    notification.id
                                  )}
                                  onChange={() =>
                                    toggleNotificationSelection(notification.id)
                                  }
                                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                />
                              </div>

                              {/* Icon */}
                              <div
                                className={`p-2 rounded-full ${getTypeColor(notification.type)}`}
                              >
                                {getNotificationIcon(notification.type)}
                              </div>

                              {/* Content */}
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-start justify-between gap-2'>
                                  <div className='flex-1'>
                                    <h4
                                      className={`font-medium mb-1 ${
                                        !notification.is_read
                                          ? 'text-gray-900'
                                          : 'text-gray-700'
                                      }`}
                                    >
                                      {notification.title}
                                    </h4>
                                    <p className='text-sm text-gray-600 line-clamp-2'>
                                      {notification.message}
                                    </p>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <Badge
                                      variant='outline'
                                      className={`text-xs ${getPriorityColor(notification.priority)}`}
                                    >
                                      {notification.priority}
                                    </Badge>
                                    {!notification.is_read && (
                                      <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                                    )}
                                  </div>
                                </div>

                                <div className='flex items-center justify-between mt-2'>
                                  <div className='flex items-center gap-2 text-xs text-gray-500'>
                                    <Clock className='w-3 h-3' />
                                    {formatDistanceToNow(
                                      new Date(notification.created_at),
                                      {
                                        addSuffix: true,
                                        locale: vi,
                                      }
                                    )}
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    {!notification.is_read && (
                                      <Button
                                        size='sm'
                                        variant='ghost'
                                        onClick={() =>
                                          handleMarkAsRead(notification.id)
                                        }
                                        className='h-7 px-2 text-xs'
                                      >
                                        <Check className='w-3 h-3 mr-1' />
                                        Đánh dấu đã đọc
                                      </Button>
                                    )}
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      onClick={() =>
                                        handleDelete(notification.id)
                                      }
                                      className='h-7 px-2 text-xs text-red-600 hover:text-red-700'
                                    >
                                      <Trash2 className='w-3 h-3' />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer Actions */}
          <div className='p-6 pt-4 border-t'>
            <div className='flex justify-between items-center'>
              <Button
                variant='outline'
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className='w-4 h-4 mr-2' />
                Đánh dấu tất cả đã đọc
              </Button>
              <Button variant='ghost' onClick={() => setIsOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedNotificationCenter;
