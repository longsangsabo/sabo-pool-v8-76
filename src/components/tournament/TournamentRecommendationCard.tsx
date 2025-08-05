import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Star,
  Loader2,
} from 'lucide-react';
import { TournamentDetailsModal } from './TournamentDetailsModal';

interface TournamentRecommendationCardProps {
  tournament: any;
  onJoin: (tournament: any) => void;
  showRecommendationScore?: boolean;
  isJoining?: boolean;
}

export const TournamentRecommendationCard: React.FC<
  TournamentRecommendationCardProps
> = ({
  tournament,
  onJoin,
  showRecommendationScore = false,
  isJoining = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getRecommendationReason = (tournament: any) => {
    const score = tournament.recommendation_score || 0;
    if (score > 400)
      return {
        text: 'Rất phù hợp với bạn',
        color: 'text-green-600',
        bg: 'bg-green-100',
      };
    if (score > 300)
      return { text: 'Phù hợp', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score > 200)
      return {
        text: 'Có thể quan tâm',
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
      };
    return { text: 'Đề xuất', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const getRecommendationReasons = (tournament: any) => {
    const reasons = [];

    // Distance-based reason
    if (tournament.distance_km !== undefined) {
      if (tournament.distance_km < 5) {
        reasons.push(`Rất gần bạn (${tournament.distance_km}km)`);
      } else if (tournament.distance_km < 15) {
        reasons.push(`Gần bạn (${tournament.distance_km}km)`);
      }
    }

    // Prize-based reason
    if (tournament.total_prize_pool > 1000) {
      reasons.push('Giải thưởng hấp dẫn');
    }

    // Timing-based reason
    const daysUntilStart = Math.floor(
      (new Date(tournament.tournament_start).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysUntilStart <= 7 && daysUntilStart > 0) {
      reasons.push('Sắp diễn ra');
    }

    // Participation-based reason
    const participationRatio =
      tournament.current_participants / tournament.max_participants;
    if (participationRatio > 0.5 && participationRatio < 0.8) {
      reasons.push('Nhiều người quan tâm');
    }

    // SABO club
    if (tournament.club?.is_sabo_owned) {
      reasons.push('CLB SABO chính thức');
    }

    return reasons.length > 0 ? reasons : ['Phù hợp với sở thích của bạn'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const reason = getRecommendationReason(tournament);
  const isRegistrationOpen = tournament.status === 'registration_open';
  const isFull = tournament.current_participants >= tournament.max_participants;

  return (
    <Card className='bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow'>
      {/* Tournament Banner */}
      <div className='h-48 relative'>
        <img
          src={tournament.banner_image || '/placeholder.svg'}
          className='w-full h-full object-cover'
          alt={tournament.title}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />

        {/* Recommendation Badge */}
        {showRecommendationScore && (
          <div className='absolute top-4 left-4'>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${reason.bg} ${reason.color}`}
            >
              {reason.text}
            </span>
          </div>
        )}

        {/* Prize Pool Badge */}
        <div className='absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full font-bold'>
          🏆 {tournament.total_prize_pool?.toLocaleString() || 0} điểm
        </div>

        {/* Tournament Info Overlay */}
        <div className='absolute bottom-4 left-4 text-white'>
          <h3 className='text-xl font-bold mb-1'>
            {tournament.title || tournament.name}
          </h3>
          <div className='flex items-center space-x-2 text-sm'>
            <MapPin className='w-4 h-4' />
            <span>{tournament.club?.name || 'Unknown Club'}</span>
          </div>
        </div>
      </div>

      <CardContent className='p-4'>
        {/* Quick Info Row */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-4 text-sm text-gray-600'>
            <div className='flex items-center space-x-1'>
              <Calendar className='w-4 h-4' />
              <span>
                {formatDate(
                  tournament.tournament_start || tournament.start_date
                )}
              </span>
            </div>
            <div className='flex items-center space-x-1'>
              <Users className='w-4 h-4' />
              <span>
                {tournament.current_participants || 0}/
                {tournament.max_participants}
              </span>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-sm font-semibold text-blue-600'>
              {tournament.entry_fee_points || tournament.entry_fee || 0} điểm
            </div>
            <div className='text-xs text-gray-500'>Phí tham gia</div>
          </div>
        </div>

        {/* Why Recommended Section */}
        {showRecommendationScore && tournament.recommendation_score > 0 && (
          <div className='bg-blue-50 rounded-lg p-3 mb-4'>
            <h4 className='font-semibold text-blue-800 mb-2'>
              🎯 Tại sao phù hợp với bạn?
            </h4>
            <div className='space-y-1 text-sm'>
              {getRecommendationReasons(tournament).map((reason, index) => (
                <div
                  key={index}
                  className='flex items-center space-x-2 text-blue-700'
                >
                  <span className='text-blue-500'>•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Club Info */}
        <div className='bg-gray-50 rounded-lg p-3 mb-4'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>
                {tournament.club?.name?.charAt(0) || 'C'}
              </span>
            </div>
            <div className='flex-1'>
              <h4 className='font-semibold'>
                {tournament.club?.name || 'Unknown Club'}
              </h4>
              <p className='text-sm text-gray-600'>
                {tournament.venue_address || tournament.club?.address}
              </p>
              <div className='flex items-center space-x-2 mt-1'>
                {tournament.distance_km && (
                  <span className='text-xs text-gray-500'>
                    📍 {tournament.distance_km}km
                  </span>
                )}
                {tournament.club?.is_sabo_owned && (
                  <span className='bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold'>
                    SABO
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prize Breakdown */}
        <div className='grid grid-cols-3 gap-3 mb-4'>
          <div className='text-center p-2 bg-yellow-50 rounded-lg'>
            <div className='text-lg font-bold text-yellow-600'>🥇</div>
            <div className='text-xs text-gray-600'>Nhất</div>
            <div className='text-sm font-semibold'>
              {tournament.first_prize?.toLocaleString() || 0}
            </div>
          </div>
          <div className='text-center p-2 bg-gray-50 rounded-lg'>
            <div className='text-lg font-bold text-gray-600'>🥈</div>
            <div className='text-xs text-gray-600'>Nhì</div>
            <div className='text-sm font-semibold'>
              {tournament.second_prize?.toLocaleString() || 0}
            </div>
          </div>
          <div className='text-center p-2 bg-orange-50 rounded-lg'>
            <div className='text-lg font-bold text-orange-600'>🥉</div>
            <div className='text-xs text-gray-600'>Ba</div>
            <div className='text-sm font-semibold'>
              {tournament.third_prize?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-3'>
          <Button
            variant='outline'
            onClick={() => setShowDetails(true)}
            className='flex-1'
          >
            Chi tiết
          </Button>
          <Button
            onClick={() => onJoin(tournament)}
            disabled={isFull || !isRegistrationOpen || isJoining}
            className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          >
            {isJoining ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                Đang xử lý...
              </>
            ) : isFull ? (
              'Đã đầy'
            ) : !isRegistrationOpen ? (
              'Chưa mở ĐK'
            ) : (
              `Tham gia (${tournament.entry_fee_points || tournament.entry_fee || 0} điểm)`
            )}
          </Button>
        </div>
      </CardContent>

      {/* Tournament Details Modal */}
      <TournamentDetailsModal
        tournament={tournament}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </Card>
  );
};
