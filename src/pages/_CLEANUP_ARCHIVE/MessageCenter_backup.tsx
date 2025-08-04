import React, { Suspense, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2, MessageCircle, Bell, Inbox, Settings, Send, Users, Plus, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Lazy load message components
const ChatPage = React.lazy(() => import('@/pages/ChatPage'));
const NotificationsPage = React.lazy(() => import('@/pages/NotificationsPage'));
const InboxPage = React.lazy(() => import('@/pages/InboxPage'));

// Loading component
const TabLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-muted-foreground">Đang tải...</span>
  </div>
);

// Enhanced Message Overview component
const EnhancedMessageOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    unreadMessages: 3,
    unreadNotifications: 7,
    totalConversations: 12,
    onlineFriends: 8
  });

  const statCards = [
    { title: 'Tin nhắn chưa đọc', value: stats.unreadMessages, icon: MessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { title: 'Thông báo mới', value: stats.unreadNotifications, icon: Bell, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { title: 'Cuộc trò chuyện', value: stats.totalConversations, icon: Users, color: 'text-green-500', bgColor: 'bg-green-50' },
    { title: 'Bạn bè online', value: stats.onlineFriends, icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              Bắt đầu chat mới
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground mb-4">Tìm và chat với người chơi khác</p>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Tạo cuộc trò chuyện
            </Button>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Cài đặt thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground mb-4">Quản lý cách bạn nhận thông báo</p>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Cài đặt
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">8</div>
            <div className="text-sm text-muted-foreground">Tin nhắn chưa đọc</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">3</div>
            <div className="text-sm text-muted-foreground">Thông báo mới</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">15</div>
            <div className="text-sm text-muted-foreground">Tin nhắn hôm nay</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">42</div>
            <div className="text-sm text-muted-foreground">Cuộc trò chuyện</div>
          </div>
        </Card>
      </div>

      {/* Recent Messages */}
      <div>
        <h4 className="font-semibold mb-3">Tin nhắn gần đây</h4>
        <div className="space-y-3">
          <Card className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">P</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">ProPlayer123</div>
                    <div className="text-sm text-muted-foreground">
                      Chào bạn! Mình muốn thách đấu bạn...
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">2 phút</div>
                </div>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">M</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">PoolMaster</div>
                    <div className="text-sm text-muted-foreground">
                      Giải đấu ngày mai bạn có tham gia không?
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">15 phút</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Hệ thống</div>
                    <div className="text-sm text-muted-foreground">
                      Bạn có thông báo mới về tournament
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">1 giờ</div>
                </div>
              </div>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </Card>
);

// Quick Chat component
const QuickChat = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Send className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Chat nhanh</h3>
      </div>
      
      {/* Online friends */}
      <div>
        <h4 className="font-medium mb-3 text-sm text-muted-foreground">ĐANG ONLINE (8)</h4>
        <div className="space-y-2">
          {['ProPlayer123', 'PoolMaster', 'Champion99', 'SkillfulOne'].map((name, index) => (
            <Card key={index} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{name.charAt(0)}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{name}</div>
                  <div className="text-xs text-muted-foreground">Online</div>
                </div>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick message input */}
      <div className="border-t pt-4">
        <div className="flex space-x-2">
          <input 
            placeholder="Nhập tin nhắn nhanh..." 
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
            Gửi
          </button>
        </div>
      </div>
    </div>
  </Card>
);

// Communication Settings component
const CommunicationSettings = () => (
  <Card className="p-6">
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Cài đặt giao tiếp</h3>
      </div>

      {/* Notification preferences */}
      <div className="space-y-4">
        <h4 className="font-medium">Tùy chọn thông báo</h4>
        
        <div className="space-y-3">
          {[
            { label: 'Tin nhắn mới', desc: 'Nhận thông báo khi có tin nhắn mới', enabled: true },
            { label: 'Thách đấu mới', desc: 'Nhận thông báo khi có thách đấu mới', enabled: true },
            { label: 'Kết quả tournament', desc: 'Nhận thông báo về kết quả tournament', enabled: true },
            { label: 'Hoạt động bạn bè', desc: 'Nhận thông báo về hoạt động của bạn bè', enabled: false },
            { label: 'Tin tức hệ thống', desc: 'Nhận thông báo về cập nhật hệ thống', enabled: true },
          ].map((setting, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-sm">{setting.label}</div>
                <div className="text-xs text-muted-foreground">{setting.desc}</div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors ${
                setting.enabled ? 'bg-primary' : 'bg-muted'
              }`}>
                <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
                  setting.enabled ? 'translate-x-5' : 'translate-x-1'
                }`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy settings */}
      <div className="space-y-4">
        <h4 className="font-medium">Cài đặt riêng tư</h4>
        
        <div className="space-y-3">
          <Card className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-sm">Ai có thể nhắn tin cho bạn?</div>
                <div className="text-xs text-muted-foreground">Kiểm soát ai có thể gửi tin nhắn</div>
              </div>
              <select className="text-sm border rounded px-2 py-1">
                <option>Tất cả mọi người</option>
                <option>Chỉ bạn bè</option>
                <option>Không ai</option>
              </select>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-sm">Hiển thị trạng thái online</div>
                <div className="text-xs text-muted-foreground">Cho phép người khác thấy bạn đang online</div>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full">
                <div className="w-4 h-4 bg-white rounded-full mt-1 translate-x-5"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </Card>
);

const MessageCenter: React.FC = () => {
  return (
    <div className="compact-container compact-layout desktop-high-density">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="compact-title">Message Center</h1>
          <p className="compact-subtitle">
            Trung tâm quản lý tin nhắn, thông báo và giao tiếp
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-9 md:h-10">
          <TabsTrigger value="overview" className="compact-nav-item flex items-center space-x-1">
            <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline responsive-text-xs">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="compact-nav-item flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Thông báo</span>
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center space-x-2">
            <Inbox className="h-4 w-4" />
            <span className="hidden sm:inline">Hộp thư</span>
          </TabsTrigger>
          <TabsTrigger value="quick-chat" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Chat nhanh</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Cài đặt</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="overview" className="mt-6">
          <MessageOverview />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <Suspense fallback={<TabLoadingSpinner />}>
            <ChatPage />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Suspense fallback={<TabLoadingSpinner />}>
            <NotificationsPage />
          </Suspense>
        </TabsContent>

        <TabsContent value="inbox" className="mt-6">
          <Suspense fallback={<TabLoadingSpinner />}>
            <InboxPage />
          </Suspense>
        </TabsContent>

        <TabsContent value="quick-chat" className="mt-6">
          <QuickChat />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <CommunicationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessageCenter;
