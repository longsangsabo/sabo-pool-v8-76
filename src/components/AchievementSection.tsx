import { useState } from 'react';
import { Trophy, Star, Flame, Target, Award, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'tournament' | 'streak' | 'skill' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at: string;
  progress?: {
    current: number;
    total: number;
  };
  is_featured?: boolean;
}

interface AchievementSectionProps {
  achievements: Achievement[];
  user: {
    name: string;
    total_achievements: number;
    rare_achievements: number;
  };
}

const AchievementSection = ({
  achievements,
  user,
}: AchievementSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getAchievementIcon = (iconName: string) => {
    const icons = {
      trophy: Trophy,
      star: Star,
      flame: Flame,
      target: Target,
      award: Award,
      crown: Crown,
    };
    const IconComponent = icons[iconName as keyof typeof icons] || Trophy;
    return <IconComponent className='w-6 h-6' />;
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-br from-gold to-yellow-400 text-white shadow-lg';
      case 'epic':
        return 'bg-gradient-to-br from-primary-purple to-purple-400 text-white shadow-md';
      case 'rare':
        return 'bg-gradient-to-br from-primary-blue to-blue-400 text-white shadow-md';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'tournament':
        return 'bg-gold text-white';
      case 'streak':
        return 'bg-like-red text-white';
      case 'skill':
        return 'bg-primary-blue text-white';
      case 'milestone':
        return 'bg-primary-green text-white';
      case 'special':
        return 'bg-primary-purple text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const categories = [
    { id: 'all', name: 'Tất cả', count: achievements.length },
    {
      id: 'tournament',
      name: 'Giải đấu',
      count: achievements.filter(a => a.category === 'tournament').length,
    },
    {
      id: 'streak',
      name: 'Chuỗi thắng',
      count: achievements.filter(a => a.category === 'streak').length,
    },
    {
      id: 'skill',
      name: 'Kỹ năng',
      count: achievements.filter(a => a.category === 'skill').length,
    },
    {
      id: 'milestone',
      name: 'Cột mốc',
      count: achievements.filter(a => a.category === 'milestone').length,
    },
  ];

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter(a => a.category === selectedCategory);

  const featuredAchievements = achievements
    .filter(a => a.is_featured)
    .slice(0, 3);

  return (
    <div className='space-y-6'>
      {/* Header Stats */}
      <div className='text-center mb-6'>
        <h2 className='heading-secondary text-gray-900 mb-2'>
          Thành tích của {user.name}
        </h2>
        <div className='flex justify-center space-x-6'>
          <div className='text-center'>
            <p className='text-2xl font-bold text-primary-blue'>
              {user.total_achievements}
            </p>
            <p className='text-xs text-comment-gray'>Tổng thành tích</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-gold'>
              {user.rare_achievements}
            </p>
            <p className='text-xs text-comment-gray'>Thành tích hiếm</p>
          </div>
        </div>
      </div>

      {/* Featured Achievements - Instagram Highlights Style */}
      {featuredAchievements.length > 0 && (
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-3'>
            🌟 Nổi bật
          </h3>
          <div className='flex space-x-4 overflow-x-auto scrollbar-hide pb-2'>
            {featuredAchievements.map(achievement => (
              <div key={achievement.id} className='flex-shrink-0 text-center'>
                <div
                  className={`w-20 h-20 rounded-full p-1 ${getRarityStyle(achievement.rarity)}`}
                >
                  <div className='w-full h-full bg-white rounded-full flex items-center justify-center'>
                    {getAchievementIcon(achievement.icon)}
                  </div>
                </div>
                <p className='text-xs mt-2 text-gray-700 font-medium truncate w-20'>
                  {achievement.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className='flex space-x-2 overflow-x-auto scrollbar-hide'>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className='grid gap-4'>
        {filteredAchievements.map(achievement => (
          <Card
            key={achievement.id}
            className='hover:shadow-md transition-shadow'
          >
            <CardContent className='p-4'>
              <div className='flex items-start space-x-4'>
                {/* Achievement Icon */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${getRarityStyle(achievement.rarity)}`}
                >
                  {getAchievementIcon(achievement.icon)}
                </div>

                {/* Achievement Details */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <h4 className='font-bold text-gray-900 mb-1'>
                        {achievement.title}
                      </h4>
                      <p className='text-sm text-gray-600 mb-2'>
                        {achievement.description}
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-1'>
                      <Badge
                        className={getRarityStyle(achievement.rarity)}
                        variant='secondary'
                      >
                        {achievement.rarity.toUpperCase()}
                      </Badge>
                      <Badge
                        className={getCategoryStyle(achievement.category)}
                        variant='secondary'
                      >
                        {achievement.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar (if applicable) */}
                  {achievement.progress && (
                    <div className='mb-2'>
                      <div className='flex justify-between text-xs text-comment-gray mb-1'>
                        <span>Tiến độ</span>
                        <span>
                          {achievement.progress.current}/
                          {achievement.progress.total}
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-primary-blue h-2 rounded-full transition-all'
                          style={{
                            width: `${(achievement.progress.current / achievement.progress.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <p className='text-xs text-comment-gray'>
                    Đạt được: {formatDate(achievement.earned_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className='text-center py-12'>
          <Trophy className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-500 font-medium'>
            Chưa có thành tích nào trong danh mục này
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementSection;
