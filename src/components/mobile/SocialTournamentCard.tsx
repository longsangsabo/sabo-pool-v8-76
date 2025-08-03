import React from 'react';
import { Calendar, Users, Trophy, Star, Clock, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TournamentCardProps {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  currentParticipants: number;
  maxParticipants: number;
  entryFee: number;
  status: 'upcoming' | 'registration_open' | 'in_progress' | 'completed';
  imageUrl?: string;
  isHot?: boolean;
  isPremium?: boolean;
  onJoin?: () => void;
  onView?: () => void;
}

const SocialTournamentCard: React.FC<TournamentCardProps> = ({
  name,
  description,
  startDate,
  location,
  currentParticipants,
  maxParticipants,
  entryFee,
  status,
  imageUrl,
  isHot = false,
  isPremium = false,
  onJoin,
  onView,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'registration_open':
        return <Badge className='bg-accent-green text-white'>Đang mở</Badge>;
      case 'in_progress':
        return (
          <Badge className='bg-accent-red text-white animate-pulse'>
            Đang diễn ra
          </Badge>
        );
      case 'upcoming':
        return <Badge className='bg-accent-blue text-white'>Sắp diễn ra</Badge>;
      case 'completed':
        return (
          <Badge className='bg-muted text-muted-foreground'>Đã kết thúc</Badge>
        );
      default:
        return null;
    }
  };

  const progressPercentage = (currentParticipants / maxParticipants) * 100;

  return (
    <Card className='relative overflow-hidden bg-gradient-card border border-border/50 rounded-2xl shadow-card hover:shadow-intense transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]'>
      {/* Background Image with Overlay */}
      {imageUrl && (
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className='absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-background/20' />
        </div>
      )}

      {/* Hot/Premium badges */}
      <div className='absolute top-3 right-3 flex gap-2'>
        {isHot && (
          <Badge className='bg-accent-red/90 text-white backdrop-blur-sm animate-pulse'>
            🔥 HOT
          </Badge>
        )}
        {isPremium && (
          <Badge className='bg-accent-purple/90 text-white backdrop-blur-sm'>
            ⭐ PREMIUM
          </Badge>
        )}
      </div>

      {/* Card Content */}
      <div className='relative p-4 space-y-4'>
        {/* Header */}
        <div className='space-y-2'>
          <div className='flex items-start justify-between'>
            <h3 className='font-epilogue font-bold text-lg text-foreground leading-tight line-clamp-2'>
              {name}
            </h3>
            {getStatusBadge()}
          </div>

          {description && (
            <p className='font-outfit text-sm text-muted-foreground line-clamp-2'>
              {description}
            </p>
          )}
        </div>

        {/* Tournament Info */}
        <div className='space-y-3'>
          {/* Date & Location */}
          <div className='flex flex-col gap-2'>
            <div className='flex items-center text-sm text-muted-foreground'>
              <Calendar className='h-4 w-4 mr-2 text-accent-blue' />
              <span className='font-outfit'>
                {new Date(startDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>

            {location && (
              <div className='flex items-center text-sm text-muted-foreground'>
                <MapPin className='h-4 w-4 mr-2 text-accent-green' />
                <span className='font-outfit'>{location}</span>
              </div>
            )}
          </div>

          {/* Participants Progress */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <div className='flex items-center text-muted-foreground'>
                <Users className='h-4 w-4 mr-2 text-accent-purple' />
                <span className='font-outfit'>Người tham gia</span>
              </div>
              <span className='font-racing text-foreground'>
                {currentParticipants}/{maxParticipants}
              </span>
            </div>

            {/* Progress bar */}
            <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all duration-500'
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Entry Fee */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center text-sm text-muted-foreground'>
              <Trophy className='h-4 w-4 mr-2 text-primary' />
              <span className='font-outfit'>Phí tham gia</span>
            </div>
            <span className='font-racing text-lg text-primary'>
              {entryFee === 0
                ? 'Miễn phí'
                : `${entryFee.toLocaleString('vi-VN')} VNĐ`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 pt-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={onView}
            className='flex-1 font-epilogue font-medium border-border/50 hover:bg-muted/50'
          >
            Chi tiết
          </Button>

          {status === 'registration_open' && (
            <Button
              onClick={onJoin}
              size='sm'
              className='flex-1 bg-gradient-to-r from-primary to-primary-glow text-background font-epilogue font-semibold hover:scale-105 transition-transform duration-200'
            >
              Tham gia
            </Button>
          )}
        </div>
      </div>

      {/* Ripple effect */}
      <div className='absolute inset-0 rounded-2xl overflow-hidden pointer-events-none'>
        <div className='absolute inset-0 bg-primary/5 rounded-2xl opacity-0 transition-opacity duration-150 active:opacity-100' />
      </div>
    </Card>
  );
};

export default SocialTournamentCard;
