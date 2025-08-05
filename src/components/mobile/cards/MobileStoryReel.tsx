import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface StoryItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  type: 'live_match' | 'achievement' | 'highlight' | 'tournament';
  thumbnail?: string;
  isLive?: boolean;
  title: string;
}

interface MobileStoryReelProps {
  stories?: StoryItem[];
  onStoryClick?: (storyId: string) => void;
}

export const MobileStoryReel: React.FC<MobileStoryReelProps> = ({
  stories = [],
  onStoryClick,
}) => {
  // Mock data if no stories provided
  const mockStories: StoryItem[] = [
    {
      id: '1',
      user: { name: 'Duc', avatar: '/api/placeholder/64/64' },
      type: 'live_match',
      isLive: true,
      title: 'Đang đấu vs Player2',
    },
    {
      id: '2',
      user: { name: 'Minh', avatar: '/api/placeholder/64/64' },
      type: 'achievement',
      title: 'Lên rank Expert',
    },
    {
      id: '3',
      user: { name: 'Lan', avatar: '/api/placeholder/64/64' },
      type: 'highlight',
      title: 'Shot đẹp nhất',
    },
    {
      id: '4',
      user: { name: 'Tuan', avatar: '/api/placeholder/64/64' },
      type: 'tournament',
      title: 'SABO Arena Open',
    },
    {
      id: '5',
      user: { name: 'Nam', avatar: '/api/placeholder/64/64' },
      type: 'live_match',
      isLive: true,
      title: 'Trận chung kết',
    },
  ];

  const displayStories = stories.length > 0 ? stories : mockStories;

  const getStoryRingClass = (type: StoryItem['type'], isLive?: boolean) => {
    if (isLive)
      return 'ring-2 ring-red-500 ring-offset-2 ring-offset-background';

    switch (type) {
      case 'live_match':
        return 'ring-2 ring-red-500 ring-offset-2 ring-offset-background';
      case 'achievement':
        return 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-background';
      case 'highlight':
        return 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background';
      case 'tournament':
        return 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background';
      default:
        return 'ring-2 ring-muted ring-offset-2 ring-offset-background';
    }
  };

  const getStoryBadge = (type: StoryItem['type'], isLive?: boolean) => {
    if (isLive) {
      return (
        <Badge className='absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 animate-pulse'>
          LIVE
        </Badge>
      );
    }

    switch (type) {
      case 'achievement':
        return <div className='absolute -top-1 -right-1 text-lg'>🏆</div>;
      case 'highlight':
        return <div className='absolute -top-1 -right-1 text-lg'>⭐</div>;
      case 'tournament':
        return <div className='absolute -top-1 -right-1 text-lg'>🎯</div>;
      default:
        return null;
    }
  };

  return (
    <div className='bg-card py-4'>
      <div className='px-4 mb-3'>
        <h3 className='text-sm font-semibold text-foreground'>
          Hoạt động gần đây
        </h3>
      </div>

      <div className='mobile-story-reel'>
        {displayStories.map(story => (
          <div
            key={story.id}
            className='story-item cursor-pointer'
            onClick={() => onStoryClick?.(story.id)}
          >
            <div className='relative'>
              <Avatar
                className={`h-16 w-16 ${getStoryRingClass(story.type, story.isLive)}`}
              >
                <AvatarImage src={story.user.avatar} />
                <AvatarFallback className='text-sm font-semibold'>
                  {story.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {getStoryBadge(story.type, story.isLive)}
            </div>

            <div className='mt-2 text-center'>
              <p className='text-xs font-medium text-foreground truncate max-w-[70px]'>
                {story.user.name}
              </p>
              <p className='text-xs text-muted-foreground truncate max-w-[70px]'>
                {story.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileStoryReel;
