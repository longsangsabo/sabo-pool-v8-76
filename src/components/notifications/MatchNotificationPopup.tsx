import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  X,
  Zap,
  Trophy,
  Clock,
  MapPin,
  Eye,
  Calendar,
  Target,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  match: {
    id: string;
    tournament_name: string;
    round: string;
    player1: {
      id: string;
      name: string;
      avatar_url?: string;
      rank?: string;
      elo?: number;
      is_online?: boolean;
    };
    player2: {
      id: string;
      name: string;
      avatar_url?: string;
      rank?: string;
      elo?: number;
      is_online?: boolean;
    };
    start_time?: string;
    location?: string;
    status: string;
    match_format?: string;
    head_to_head?: {
      player1_wins: number;
      player2_wins: number;
    };
  };
  currentUserId: string;
  onJoinMatch: () => void;
  onViewBracket: () => void;
  onPostpone?: () => void;
}

export const MatchNotificationPopup: React.FC<MatchNotificationProps> = ({
  isOpen,
  onClose,
  match,
  currentUserId,
  onJoinMatch,
  onViewBracket,
  onPostpone,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldVibrate, setShouldVibrate] = useState(false);

  const isCurrentUserPlayer1 = match.player1.id === currentUserId;
  const currentPlayer = isCurrentUserPlayer1 ? match.player1 : match.player2;
  const opponent = isCurrentUserPlayer1 ? match.player2 : match.player1;

  useEffect(() => {
    if (isOpen) {
      // Debounce the visibility to prevent flickering
      const timer = setTimeout(() => {
        setIsVisible(true);
        setShouldVibrate(true);

        // Vibration feedback on mobile
        if ('navigator' in window && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setShouldVibrate(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShouldVibrate(false);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Longer delay for smoother transition
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case 'final':
        return (
          <Badge className='bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold'>
            CHUNG KẾT
          </Badge>
        );
      case 'semifinal':
        return (
          <Badge className='bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold'>
            BÁN KẾT
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold'>
            ĐÃ LỊCH HẸN
          </Badge>
        );
      default:
        return (
          <Badge className='bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold'>
            ĐÃ BẮT ĐẦU
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'w-[360px] md:w-[400px] max-w-[90vw] p-0 border-0 rounded-xl overflow-hidden',
          'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
          'shadow-2xl shadow-black/50',
          'animate-in fade-in-0 zoom-in-95 duration-300',
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          shouldVibrate && 'animate-pulse'
        )}
      >
        <DialogTitle className='sr-only'>
          Thông báo trận đấu - {match.tournament_name}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          Trận đấu giữa {currentPlayer.name} và {opponent.name} đã bắt đầu
        </DialogDescription>
        {/* Header Section */}
        <div className='relative bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 p-5 text-center border-b border-yellow-500/30'>
          <button
            onClick={handleClose}
            className='absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 transition-colors flex items-center justify-center'
          >
            <X className='w-4 h-4 text-white' />
          </button>

          <div className='flex items-center justify-center gap-2 mb-2'>
            <Flame className='w-6 h-6 text-yellow-500 animate-pulse' />
            <h1 className='text-white font-bold text-xl tracking-wider uppercase'>
              TRẬN ĐẤU ĐÃ BẮT ĐẦU!
            </h1>
            <Flame className='w-6 h-6 text-yellow-500 animate-pulse' />
          </div>

          <div className='flex items-center justify-center gap-2'>
            <Trophy className='w-4 h-4 text-yellow-400' />
            <span className='text-yellow-100 font-medium text-lg'>
              {match.tournament_name}
            </span>
          </div>

          <div className='mt-2'>{getStatusBadge()}</div>
        </div>

        {/* Match Information Section */}
        <div className='p-5 space-y-4'>
          {/* Round Info */}
          <div className='text-center'>
            <span className='text-slate-300 text-sm font-medium uppercase tracking-wide'>
              {match.round}
            </span>
          </div>

          {/* Players Section */}
          <div className='flex items-center justify-between'>
            {/* Current Player */}
            <div className='flex flex-col items-center space-y-2 flex-1'>
              <div className='relative'>
                <Avatar className='w-12 h-12 border-2 border-blue-500 shadow-lg shadow-blue-500/30'>
                  {currentPlayer.avatar_url ? (
                    <img
                      src={currentPlayer.avatar_url}
                      alt={currentPlayer.name}
                      className='w-full h-full object-cover rounded-full'
                    />
                  ) : (
                    <AvatarFallback className='bg-blue-600 text-white font-bold'>
                      {currentPlayer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {currentPlayer.is_online && (
                  <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse' />
                )}
              </div>
              <div className='text-center'>
                <p className='text-white font-bold text-sm'>
                  {currentPlayer.name}
                </p>
                {currentPlayer.rank && (
                  <p className='text-blue-400 text-xs font-medium'>
                    Rank: {currentPlayer.rank}
                  </p>
                )}
                {currentPlayer.elo && (
                  <p className='text-slate-400 text-xs'>
                    ELO: {currentPlayer.elo}
                  </p>
                )}
              </div>
            </div>

            {/* VS Section */}
            <div className='flex flex-col items-center mx-4'>
              <div className='w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30'>
                <Target className='w-8 h-8 text-black animate-spin-slow' />
              </div>
              <span className='text-yellow-400 font-bold text-lg mt-1'>VS</span>

              {/* Head to head record */}
              {match.head_to_head && (
                <div className='text-xs text-slate-400 mt-1'>
                  {match.head_to_head.player1_wins} -{' '}
                  {match.head_to_head.player2_wins}
                </div>
              )}
            </div>

            {/* Opponent */}
            <div className='flex flex-col items-center space-y-2 flex-1'>
              <div className='relative'>
                <Avatar className='w-12 h-12 border-2 border-slate-500 shadow-lg'>
                  {opponent.avatar_url ? (
                    <img
                      src={opponent.avatar_url}
                      alt={opponent.name}
                      className='w-full h-full object-cover rounded-full'
                    />
                  ) : (
                    <AvatarFallback className='bg-slate-600 text-white font-bold'>
                      {opponent.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {opponent.is_online && (
                  <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse' />
                )}
              </div>
              <div className='text-center'>
                <p className='text-white font-bold text-sm'>{opponent.name}</p>
                {opponent.rank && (
                  <p className='text-slate-400 text-xs font-medium'>
                    Rank: {opponent.rank}
                  </p>
                )}
                {opponent.elo && (
                  <p className='text-slate-400 text-xs'>ELO: {opponent.elo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Match Info */}
          <div className='bg-slate-800/50 rounded-lg p-3 space-y-2'>
            {match.start_time && (
              <div className='flex items-center gap-2 text-slate-300 text-sm'>
                <Clock className='w-4 h-4 text-yellow-400' />
                <span>
                  Bắt đầu:{' '}
                  {new Date(match.start_time).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            )}

            {match.location && (
              <div className='flex items-center gap-2 text-slate-300 text-sm'>
                <MapPin className='w-4 h-4 text-yellow-400' />
                <span>{match.location}</span>
              </div>
            )}

            {match.match_format && (
              <div className='flex items-center gap-2 text-slate-300 text-sm'>
                <Calendar className='w-4 h-4 text-yellow-400' />
                <span>Định dạng: {match.match_format}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='space-y-3 pt-2'>
            {/* Primary CTA */}
            <Button
              onClick={onJoinMatch}
              className={cn(
                'w-full h-12 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400',
                'text-black font-bold text-lg uppercase tracking-wide',
                'shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50',
                'transform hover:scale-105 transition-all duration-200',
                'border-0'
              )}
            >
              <Zap className='w-5 h-5 mr-2' />
              CHIẾN THÔI!
            </Button>

            {/* Secondary Actions */}
            <div className='flex gap-2'>
              <Button
                onClick={onViewBracket}
                variant='outline'
                className='flex-1 h-10 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
              >
                <Eye className='w-4 h-4 mr-2' />
                Xem bảng đấu
              </Button>

              {onPostpone && (
                <Button
                  onClick={onPostpone}
                  variant='outline'
                  className='flex-1 h-10 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
                >
                  <Calendar className='w-4 h-4 mr-2' />
                  Dời lịch
                </Button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className='text-center pt-2 border-t border-slate-700'>
            <p className='text-slate-500 text-xs'>
              Thông báo gần đây • {new Date().toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
