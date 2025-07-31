import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Target,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Users,
  Zap,
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'combat' | 'social' | 'collection' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked_at?: Date;
  progress?: {
    current: number;
    total: number;
  };
  is_unlocked: boolean;
}

interface ProfileAchievementsProps {
  userId: string;
}

export const ProfileAchievements: React.FC<ProfileAchievementsProps> = ({
  userId,
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setAchievements([
          {
            id: '1',
            title: 'Chiến thắng đầu tiên',
            description: 'Thắng trận đấu đầu tiên',
            icon: '🏆',
            category: 'combat',
            points: 50,
            rarity: 'common',
            unlocked_at: new Date('2023-02-15'),
            is_unlocked: true,
          },
          {
            id: '2',
            title: 'Chuỗi chiến thắng',
            description: 'Thắng 5 trận đấu liên tiếp',
            icon: '🔥',
            category: 'combat',
            points: 200,
            rarity: 'rare',
            unlocked_at: new Date('2023-03-20'),
            is_unlocked: true,
          },
          {
            id: '3',
            title: 'Vô địch giải đấu',
            description: 'Thắng một giải đấu',
            icon: '👑',
            category: 'combat',
            points: 500,
            rarity: 'epic',
            unlocked_at: new Date('2023-05-10'),
            is_unlocked: true,
          },
          {
            id: '4',
            title: 'Người bạn tốt',
            description: 'Có 50 người theo dõi',
            icon: '👥',
            category: 'social',
            points: 100,
            rarity: 'common',
            unlocked_at: new Date('2023-04-05'),
            is_unlocked: true,
          },
          {
            id: '5',
            title: 'Người nổi tiếng',
            description: 'Có 200 người theo dõi',
            icon: '⭐',
            category: 'social',
            points: 300,
            rarity: 'rare',
            progress: { current: 180, total: 200 },
            is_unlocked: false,
          },
          {
            id: '6',
            title: 'Luyện tập chăm chỉ',
            description: 'Chơi 100 trận đấu',
            icon: '💪',
            category: 'collection',
            points: 150,
            rarity: 'common',
            progress: { current: 85, total: 100 },
            is_unlocked: false,
          },
          {
            id: '7',
            title: 'Thách đấu không giới hạn',
            description: 'Thách đấu 50 lần',
            icon: '⚡',
            category: 'combat',
            points: 250,
            rarity: 'rare',
            progress: { current: 32, total: 50 },
            is_unlocked: false,
          },
          {
            id: '8',
            title: 'Huyền thoại',
            description: 'Đạt hạng G',
            icon: '🌟',
            category: 'special',
            points: 1000,
            rarity: 'legendary',
            is_unlocked: false,
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [userId]);

  const categories = [
    { id: 'all', name: 'Tất cả', icon: <Trophy className='h-4 w-4' /> },
    { id: 'combat', name: 'Chiến đấu', icon: <Target className='h-4 w-4' /> },
    { id: 'social', name: 'Xã hội', icon: <Users className='h-4 w-4' /> },
    { id: 'collection', name: 'Thu thập', icon: <Award className='h-4 w-4' /> },
    { id: 'special', name: 'Đặc biệt', icon: <Star className='h-4 w-4' /> },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800';
      case 'rare':
        return 'bg-blue-100 text-blue-800';
      case 'epic':
        return 'bg-purple-100 text-purple-800';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'Phổ biến';
      case 'rare':
        return 'Hiếm';
      case 'epic':
        return 'Huyền thoại';
      case 'legendary':
        return 'Thần thoại';
      default:
        return 'Phổ biến';
    }
  };

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const totalPoints = achievements
    .filter(a => a.is_unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Tổng quan thành tích
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {unlockedCount}
              </div>
              <div className='text-sm text-gray-600'>Đã mở khóa</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {totalPoints}
              </div>
              <div className='text-sm text-gray-600'>Tổng điểm</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {achievements.length}
              </div>
              <div className='text-sm text-gray-600'>Tổng cộng</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </div>
              <div className='text-sm text-gray-600'>Hoàn thành</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap gap-2'>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            {categories.find(c => c.id === selectedCategory)?.name} (
            {filteredAchievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filteredAchievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.is_unlocked
                    ? 'bg-white border-gray-200 hover:shadow-md'
                    : 'bg-gray-50 border-gray-200 opacity-75'
                }`}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      achievement.is_unlocked ? 'bg-yellow-100' : 'bg-gray-200'
                    }`}
                  >
                    {achievement.icon}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <h3
                        className={`font-medium truncate ${
                          achievement.is_unlocked
                            ? 'text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {achievement.title}
                      </h3>
                      <Badge
                        className={`text-xs ${getRarityColor(achievement.rarity)}`}
                      >
                        {getRarityName(achievement.rarity)}
                      </Badge>
                    </div>

                    <p
                      className={`text-sm mb-2 ${
                        achievement.is_unlocked
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {achievement.description}
                    </p>

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-1 text-sm text-yellow-600 font-medium'>
                        <Star className='h-3 w-3' />
                        {achievement.points}
                      </div>

                      {achievement.is_unlocked && achievement.unlocked_at && (
                        <div className='text-xs text-gray-500'>
                          {achievement.unlocked_at.toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>

                    {!achievement.is_unlocked && achievement.progress && (
                      <div className='mt-3'>
                        <div className='flex justify-between text-xs text-gray-500 mb-1'>
                          <span>Tiến độ</span>
                          <span>
                            {achievement.progress.current}/
                            {achievement.progress.total}
                          </span>
                        </div>
                        <Progress
                          value={
                            (achievement.progress.current /
                              achievement.progress.total) *
                            100
                          }
                          className='h-2'
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              Không có thành tích nào trong danh mục này
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
