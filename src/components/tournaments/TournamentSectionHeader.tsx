import React from 'react';
import { Plus, Radio, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TournamentSectionHeaderProps {
  title?: string;
  description?: string;
  onCreateTournament?: () => void;
  onLiveBroadcast?: () => void;
  showCreateButton?: boolean;
  showLiveButton?: boolean;
  liveBadgeCount?: number;
}

export const TournamentSectionHeader: React.FC<
  TournamentSectionHeaderProps
> = ({
  title = 'Giải đấu',
  description = 'Tham gia các giải đấu hấp dẫn và thể hiện kỹ năng của bạn',
  onCreateTournament,
  onLiveBroadcast,
  showCreateButton = true,
  showLiveButton = true,
  liveBadgeCount = 3,
}) => {
  return (
    <div className='px-4 py-6 space-y-4'>
      {/* Title Section */}
      <div className='text-center space-y-2'>
        <h1 className='brand-title text-foreground flex items-center justify-center gap-3'>
          <Zap className='h-8 w-8 text-primary' />
          {title}
        </h1>
        <p className='body-normal text-muted-foreground text-balance max-w-sm mx-auto'>
          {description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-center space-x-3'>
        {showLiveButton && (
          <Button
            variant='outline'
            onClick={onLiveBroadcast}
            className='relative rounded-2xl border-accent-red/50 text-accent-red hover:bg-accent-red/10'
          >
            <div className='flex items-center space-x-2'>
              <div className='relative'>
                <Radio className='h-4 w-4' />
                <div className='absolute -top-1 -right-1 w-2 h-2 bg-accent-red rounded-full animate-pulse' />
              </div>
              <span className='body-small font-medium'>Trực tiếp</span>
            </div>

            {liveBadgeCount > 0 && (
              <Badge
                variant='destructive'
                className='absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center animate-bounce-in'
              >
                {liveBadgeCount}
              </Badge>
            )}
          </Button>
        )}

        {showCreateButton && (
          <Button
            onClick={onCreateTournament}
            className='social-button-primary rounded-2xl'
          >
            <Plus className='h-4 w-4 mr-2' />
            <span className='body-small font-medium'>Tạo giải đấu</span>
          </Button>
        )}
      </div>
    </div>
  );
};
