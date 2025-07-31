import React from 'react';
import { Heart, MessageCircle, Share2, Trophy, Target, Flame, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface FeedPost {
  id: string;
  type: 'match_result' | 'achievement' | 'challenge' | 'tournament_update';
  user: {
    id: string;
    name: string;
    avatar: string;
    rank: string;
  };
  content: string;
  timestamp: string;
  stats?: {
    likes: number;
    comments: number;
    shares: number;
    score?: string;
    opponent?: string;
    achievement?: string;
    challenge_type?: string;
    tournament_name?: string;
  };
  isLiked?: boolean;
}

interface MobileFeedCardProps {
  post: FeedPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onAction?: (postId: string, action: string) => void;
}

export const MobileFeedCard: React.FC<MobileFeedCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onAction,
}) => {
  const getPostIcon = () => {
    switch (post.type) {
      case 'match_result':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'achievement':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'challenge':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'tournament_update':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getPostTypeLabel = () => {
    switch (post.type) {
      case 'match_result':
        return 'Kết quả trận đấu';
      case 'achievement':
        return 'Thành tích mới';
      case 'challenge':
        return 'Thách đấu';
      case 'tournament_update':
        return 'Cập nhật giải đấu';
      default:
        return 'Hoạt động';
    }
  };

  const getActionButton = () => {
    switch (post.type) {
      case 'challenge':
        return (
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => onAction?.(post.id, 'accept_challenge')}
          >
            Nhận thách đấu
          </Button>
        );
      case 'tournament_update':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction?.(post.id, 'join_tournament')}
          >
            Tham gia
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full border-0 bg-card shadow-sm">
      <CardContent className="p-4 space-y-3">
        {/* User Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback>
                {post.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{post.user.name}</span>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {post.user.rank}
                </Badge>
                {getPostIcon()}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getPostTypeLabel()}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{post.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{post.content}</p>
          
          {/* Post Stats */}
          {post.stats && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              {post.stats.score && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tỷ số:</span>
                  <span className="font-semibold">{post.stats.score}</span>
                </div>
              )}
              {post.stats.opponent && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đối thủ:</span>
                  <span>{post.stats.opponent}</span>
                </div>
              )}
              {post.stats.achievement && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thành tích:</span>
                  <span className="font-semibold text-green-600">{post.stats.achievement}</span>
                </div>
              )}
              {post.stats.challenge_type && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loại thách đấu:</span>
                  <span>{post.stats.challenge_type}</span>
                </div>
              )}
              {post.stats.tournament_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giải đấu:</span>
                  <span className="font-semibold text-purple-600">{post.stats.tournament_name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike?.(post.id)}
              className={`flex items-center gap-1.5 px-2 ${
                post.isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart 
                className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} 
              />
              <span className="text-xs">{post.stats?.likes || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-1.5 px-2 text-muted-foreground hover:text-blue-500"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{post.stats?.comments || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare?.(post.id)}
              className="flex items-center gap-1.5 px-2 text-muted-foreground hover:text-green-500"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">{post.stats?.shares || 0}</span>
            </Button>
          </div>

          {/* Action Button */}
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileFeedCard;