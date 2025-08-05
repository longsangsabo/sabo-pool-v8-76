import React from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Edit3,
  Trophy,
  Target,
  Settings,
  Award,
  Zap,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  Share2,
  Heart,
  ChevronRight,
} from 'lucide-react';

interface ProfileQuickActionsProps {
  profile: any;
  variant?: 'mobile' | 'desktop';
  onNavigateToClubTab: () => void;
  onNavigateToRankTab: () => void;
  arenaMode?: boolean;
}

export const ProfileQuickActions: React.FC<ProfileQuickActionsProps> = ({
  profile,
  variant = 'mobile',
  onNavigateToClubTab,
  onNavigateToRankTab,
  arenaMode = false,
}) => {
  if (variant === 'mobile') {
    return (
      <Card className={arenaMode ? 'bg-slate-800/50 border-cyan-500/30' : ''}>
        <CardHeader className='pb-3'>
          <CardTitle
            className={`text-base font-epilogue ${arenaMode ? 'text-cyan-300' : ''}`}
          >
            Hành động nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4 pt-0'>
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant='default'
              size='sm'
              className='h-12 flex-col gap-1'
              onClick={() => (window.location.href = '/profile/edit')}
            >
              <Edit3 className='w-4 h-4' />
              <span className='text-xs'>Chỉnh sửa</span>
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='h-12 flex-col gap-1'
              onClick={() => (window.location.href = '/leaderboard')}
            >
              <Trophy className='w-4 h-4' />
              <span className='text-xs'>Bảng xếp hạng</span>
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='h-12 flex-col gap-1'
              onClick={() => (window.location.href = '/challenges')}
            >
              <Target className='w-4 h-4' />
              <span className='text-xs'>Thách đấu</span>
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='h-12 flex-col gap-1'
              onClick={() => (window.location.href = '/settings')}
            >
              <Settings className='w-4 h-4' />
              <span className='text-xs'>Cài đặt</span>
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='h-12 flex-col gap-1 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
              onClick={onNavigateToRankTab}
            >
              <Award className='w-4 h-4 text-amber-600' />
              <span className='text-xs text-amber-700'>Đăng ký hạng</span>
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='h-12 flex-col gap-1'
              onClick={() => (window.location.href = '/wallet')}
            >
              <Zap className='w-4 h-4' />
              <span className='text-xs'>Ví & Điểm</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop variant - Sidebar style
  return (
    <div className='space-y-4'>
      {/* Profile Actions */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium'>Hành động</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Button
            variant='default'
            className='w-full justify-start'
            onClick={() => (window.location.href = '/profile/edit')}
          >
            <Edit3 className='w-4 h-4 mr-2' />
            Chỉnh sửa hồ sơ
          </Button>

          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => (window.location.href = '/settings')}
          >
            <Settings className='w-4 h-4 mr-2' />
            Cài đặt tài khoản
          </Button>

          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => (window.location.href = '/profile/share')}
          >
            <Share2 className='w-4 h-4 mr-2' />
            Chia sẻ hồ sơ
          </Button>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium'>
            Điều hướng nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={() => (window.location.href = '/leaderboard')}
          >
            <div className='flex items-center'>
              <Trophy className='w-4 h-4 mr-2' />
              Bảng xếp hạng
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>

          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={() => (window.location.href = '/challenges')}
          >
            <div className='flex items-center'>
              <Target className='w-4 h-4 mr-2' />
              Thách đấu
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>

          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={() => (window.location.href = '/tournaments')}
          >
            <div className='flex items-center'>
              <Users className='w-4 h-4 mr-2' />
              Giải đấu
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>

          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={() => (window.location.href = '/schedule')}
          >
            <div className='flex items-center'>
              <Calendar className='w-4 h-4 mr-2' />
              Lịch thi đấu
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>
        </CardContent>
      </Card>

      {/* Profile Features */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium'>
            Tính năng nâng cao
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Button
            variant='ghost'
            className='w-full justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:bg-amber-100'
            onClick={onNavigateToRankTab}
          >
            <div className='flex items-center'>
              <Award className='w-4 h-4 mr-2 text-amber-600' />
              <span className='text-amber-700'>Đăng ký hạng</span>
            </div>
            <ChevronRight className='w-4 h-4 text-amber-600' />
          </Button>

          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={() => (window.location.href = '/statistics')}
          >
            <div className='flex items-center'>
              <BarChart3 className='w-4 h-4 mr-2' />
              Thống kê chi tiết
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>

          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={onNavigateToClubTab}
          >
            <div className='flex items-center'>
              <Users className='w-4 h-4 mr-2' />
              Quản lý câu lạc bộ
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>

          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={() => (window.location.href = '/wallet')}
          >
            <div className='flex items-center'>
              <Zap className='w-4 h-4 mr-2' />
              Ví & SPA Points
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>
        </CardContent>
      </Card>

      {/* Social Features */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium'>Kết nối</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={() => (window.location.href = '/friends')}
          >
            <div className='flex items-center'>
              <Heart className='w-4 h-4 mr-2' />
              Bạn bè
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>

          <Button
            variant='ghost'
            className='w-full justify-between'
            onClick={() => (window.location.href = '/messages')}
          >
            <div className='flex items-center'>
              <MessageSquare className='w-4 h-4 mr-2' />
              Tin nhắn
            </div>
            <ChevronRight className='w-4 h-4' />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
