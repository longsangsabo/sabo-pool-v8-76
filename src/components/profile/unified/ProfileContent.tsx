import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Trophy, 
  Users, 
  Settings, 
  BarChart3,
  Award,
  Target,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Edit,
  Star,
  ChevronRight
} from 'lucide-react';

interface ProfileContentProps {
  profile: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant?: 'mobile' | 'desktop';
  arenaMode?: boolean;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({ 
  profile, 
  activeTab, 
  onTabChange, 
  variant = 'mobile',
  arenaMode = false 
}) => {
  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: User },
    { id: 'stats', label: 'Thống kê', icon: BarChart3 },
    { id: 'achievements', label: 'Thành tích', icon: Award },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  if (variant === 'mobile') {
    return (
      <Card className={arenaMode ? 'bg-slate-800/50 border-cyan-500/30' : ''}>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className={`grid w-full grid-cols-4 ${arenaMode ? 'bg-slate-700' : ''}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                  <Icon className="w-3 h-3 mr-1" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="space-y-4">
              {/* Profile Completion */}
              <div className={`p-4 rounded-lg ${arenaMode ? 'bg-slate-700/50' : 'bg-muted/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${arenaMode ? 'text-cyan-300' : ''}`}>
                    Hoàn thiện hồ sơ
                  </span>
                  <span className={`text-sm font-racing-sans-one ${arenaMode ? 'text-cyan-400' : 'text-primary'}`}>
                    {profile?.completion_percentage || 0}%
                  </span>
                </div>
                <Progress 
                  value={profile?.completion_percentage || 0} 
                  className="h-2 mb-2" 
                />
                <p className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  Hoàn thiện hồ sơ để tăng uy tín và cơ hội tham gia giải đấu
                </p>
              </div>

              {/* Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    Thông tin cơ bản
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Edit className="w-3 h-3 mr-1" />
                    <span className="text-xs">Chỉnh sửa</span>
                  </Button>
                </div>
                
                {profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                
                {profile?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile.city}{profile.district ? `, ${profile.district}` : ''}
                    </span>
                  </div>
                )}

                {profile?.bio && (
                  <div className={`p-3 rounded-lg ${arenaMode ? 'bg-slate-700/50' : 'bg-muted/50'}`}>
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <div className="space-y-4">
              {/* Recent Performance */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${arenaMode ? 'text-cyan-300' : ''}`}>
                  Hiệu suất gần đây
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg text-center ${arenaMode ? 'bg-slate-700/50' : 'bg-muted/50'}`}>
                    <div className={`text-lg font-racing-sans-one ${arenaMode ? 'text-cyan-400' : 'text-primary'}`}>
                      {profile?.matches_won || 0}
                    </div>
                    <div className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      Trận thắng
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${arenaMode ? 'bg-slate-700/50' : 'bg-muted/50'}`}>
                    <div className={`text-lg font-racing-sans-one ${arenaMode ? 'text-cyan-400' : 'text-primary'}`}>
                      {profile?.current_win_streak || 0}
                    </div>
                    <div className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      Chuỗi thắng
                    </div>
                  </div>
                </div>
              </div>

              {/* Match History Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-medium ${arenaMode ? 'text-cyan-300' : ''}`}>
                    Lịch sử trận đấu
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                    Xem tất cả <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((match, index) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${arenaMode ? 'bg-slate-700/50' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">vs Player {match}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">2 ngày trước</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <div className="space-y-4">
              <h3 className={`text-sm font-medium ${arenaMode ? 'text-cyan-300' : ''}`}>
                Thành tích của bạn
              </h3>
              
              {profile?.achievements?.length > 0 ? (
                <div className="space-y-3">
                  {profile.achievements.map((achievement: any, index: number) => (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${arenaMode ? 'bg-slate-700/50' : 'bg-muted/50'}`}>
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{achievement.name}</div>
                        <div className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                          {achievement.description}
                        </div>
                      </div>
                      <div className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                        {achievement.earned_date}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className={`text-sm ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    Chưa có thành tích nào
                  </p>
                  <p className={`text-xs ${arenaMode ? 'text-slate-500' : 'text-muted-foreground'} mt-1`}>
                    Hãy tham gia thêm trận đấu để mở khóa thành tích!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <h3 className={`text-sm font-medium ${arenaMode ? 'text-cyan-300' : ''}`}>
                Cài đặt tài khoản
              </h3>
              
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Chỉnh sửa thông tin cá nhân
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Cài đặt quyền riêng tư
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Thông báo
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    );
  }

  // Desktop variant - More detailed content
  return (
    <Card>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <CardHeader>
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </CardHeader>

        <CardContent>
          <TabsContent value="overview" className="space-y-6">
            {/* Profile Completion */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Hoàn thiện hồ sơ</span>
                <span className="text-sm font-racing-sans-one text-primary">
                  {profile?.completion_percentage || 0}%
                </span>
              </div>
              <Progress value={profile?.completion_percentage || 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Hoàn thiện hồ sơ để tăng uy tín và cơ hội tham gia giải đấu
              </p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Thông tin cá nhân
                </h3>
                <div className="space-y-3">
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile?.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.city}{profile.district ? `, ${profile.district}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Tham gia {profile?.member_since ? new Date(profile.member_since).getFullYear() : 'Gần đây'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Cấp độ & Hạng
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cấp độ hiện tại</span>
                    <Badge variant="outline">
                      {profile?.skill_level || 'Beginner'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hạng được xác minh</span>
                    <Badge variant={profile?.verified_rank ? "default" : "secondary"}>
                      {profile?.verified_rank || 'Chưa xếp hạng'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ELO Rating</span>
                    <span className="text-sm font-medium">{profile?.elo_rating || 1000}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Biography */}
            {profile?.bio && (
              <div>
                <h3 className="text-sm font-medium mb-3">Giới thiệu</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm leading-relaxed">{profile.bio}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {/* Detailed Statistics would go here */}
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Thống kê chi tiết sẽ được hiển thị ở đây
              </p>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {/* Achievement system would go here */}
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Hệ thống thành tích sẽ được hiển thị ở đây
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Settings would go here */}
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Cài đặt tài khoản sẽ được hiển thị ở đây
              </p>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};
