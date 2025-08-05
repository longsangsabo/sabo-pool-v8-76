import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useSPABalance } from '@/hooks/useSPABalance';
import { Plus, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CreateChallengeButtonProps {
  onCreateClick: () => void;
}

const CreateChallengeButton: React.FC<CreateChallengeButtonProps> = ({
  onCreateClick,
}) => {
  const { user } = useAuth();
  const { balance: spaPoints, loading } = useSPABalance();
  const canCreateChallenge = spaPoints >= 100; // Minimum 100 SPA points to create challenge

  const handleClick = () => {
    if (!canCreateChallenge) {
      toast.error('Bạn cần có ít nhất 100 điểm SPA để tạo thách đấu!');
      return;
    }
    onCreateClick();
  };

  if (loading) {
    return (
      <Button disabled className='gap-2'>
        <Plus className='w-4 h-4' />
        Đang tải...
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <div className='flex items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              disabled={!canCreateChallenge}
              className='gap-2'
              variant={canCreateChallenge ? 'default' : 'secondary'}
            >
              {canCreateChallenge ? (
                <Plus className='w-4 h-4' />
              ) : (
                <Lock className='w-4 h-4' />
              )}
              Tạo thách đấu
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className='text-center'>
              {canCreateChallenge ? (
                <p>Bạn có thể tạo thách đấu</p>
              ) : (
                <div>
                  <p>Cần tối thiểu 100 điểm SPA</p>
                  <p className='text-xs text-muted-foreground'>
                    Hiện tại: {spaPoints} SPA
                  </p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <Badge
          variant={canCreateChallenge ? 'default' : 'secondary'}
          className='text-xs'
        >
          {spaPoints} SPA
        </Badge>
      </div>
    </TooltipProvider>
  );
};

export default CreateChallengeButton;
