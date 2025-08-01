import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { fixBracketProgression } from '@/services/tournament/bracketAdvancement';

interface BracketFixButtonProps {
  tournamentId: string;
  onFixed?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg';
  showIcon?: boolean;
}

export const BracketFixButton: React.FC<BracketFixButtonProps> = ({
  tournamentId,
  onFixed,
  variant = 'outline',
  size = 'sm',
  showIcon = true,
}) => {
  const [isFixing, setIsFixing] = useState(false);

  const handleFixBracket = async () => {
    setIsFixing(true);
    toast.info('🔧 Đang sửa bracket progression...');

    try {
      const result = await fixBracketProgression(tournamentId);

      if (result.success) {
        toast.success('✅ ' + result.message);
        onFixed?.();
      } else {
        toast.error('❌ Không thể sửa bracket: ' + result.error);
      }
    } catch (error: any) {
      console.error('❌ Error fixing bracket:', error);
      toast.error('❌ Lỗi khi sửa bracket: ' + error.message);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      onClick={handleFixBracket}
      disabled={isFixing}
      variant={variant}
      size={size}
      className='gap-2'
    >
      {showIcon &&
        (isFixing ? (
          <RefreshCw className='w-4 h-4 animate-spin' />
        ) : (
          <Wrench className='w-4 h-4' />
        ))}
      {isFixing ? 'Đang sửa...' : 'Sửa Bracket'}
    </Button>
  );
};
