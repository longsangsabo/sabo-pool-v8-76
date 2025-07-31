import React from 'react';
import { TechCard, TechButton } from '@/components/ui/sabo-tech-global';
import { Calendar, MapPin, Users, Trophy, Share, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tournament } from '@/types/tournament';

interface TechTournamentCardProps {
  tournament: Tournament;
  onViewDetails?: () => void;
  onRegister?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  className?: string;
}

export const TechTournamentCard: React.FC<TechTournamentCardProps> = ({
  tournament,
  onViewDetails,
  onRegister,
  onShare,
  onFavorite,
  className
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open': return 'live';
      case 'ongoing': return 'live';
      case 'upcoming': return 'upcoming';
      case 'completed': return 'completed';
      default: return 'upcoming';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration_open': return 'ĐANG MỞ ĐK';
      case 'ongoing': return 'ĐANG DIỄN RA';
      case 'upcoming': return 'SẮP DIỄN RA';
      case 'completed': return 'ĐÃ KẾT THÚC';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TechCard variant="default" interactive className={cn("tech-tournament-card", className)}>
      {/* Tournament Header */}
      <div className="tournament-card-header">
        <div className={cn("tournament-status-badge", `status-${getStatusColor(tournament.status)}`)} data-status={getStatusColor(tournament.status)}>
          <div className="status-glow"></div>
          <span className="status-text">{getStatusText(tournament.status)}</span>
        </div>
        <div className="tournament-time">
          <span className="time-label">THỜI GIAN:</span>
          <span className="time-value">{formatDate(tournament.tournament_start || tournament.created_at)}</span>
        </div>
      </div>

      {/* Tournament Info */}
      <div className="tournament-info-section">
        <div className="tournament-title">
          <h3 className="title-text">{tournament.name}</h3>
          <div className="tournament-tier">
            HẠNG {tournament.tier_level}
          </div>
        </div>

        <div className="tournament-details">
          <div className="detail-item">
            <Calendar className="w-4 h-4 text-tech-blue" />
            <span>{formatDate(tournament.tournament_start || tournament.created_at)}</span>
          </div>
          
          <div className="detail-item">
            <MapPin className="w-4 h-4 text-tech-blue" />
            <span className="line-clamp-1">{tournament.venue_address || 'Địa điểm sẽ cập nhật'}</span>
          </div>
          
          <div className="detail-item">
            <Users className="w-4 h-4 text-tech-blue" />
            <span>{tournament.current_participants}/{tournament.max_participants} người</span>
          </div>

          {tournament.prize_pool > 0 && (
            <div className="detail-item prize">
              <Trophy className="w-4 h-4 text-tech-gold" />
              <span className="prize-amount">{tournament.prize_pool.toLocaleString('vi-VN')}₫</span>
            </div>
          )}
        </div>

        {tournament.entry_fee > 0 && (
          <div className="entry-fee">
            <span className="fee-label">PHÍ THAM GIA:</span>
            <span className="fee-amount">{tournament.entry_fee.toLocaleString('vi-VN')}₫</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="tournament-actions">
        <div className="main-actions">
          <TechButton
            variant="primary"
            size="md"
            onClick={onViewDetails}
            fullWidth
          >
            XEM CHI TIẾT
          </TechButton>
          
          {tournament.status === 'registration_open' && onRegister && (
            <TechButton
              variant="success"
              size="md"
              onClick={onRegister}
              fullWidth
            >
              ĐĂNG KÝ NGAY
            </TechButton>
          )}
        </div>

        <div className="tournament-social-actions">
          <button className="tech-social-btn" onClick={onShare}>
            <Share className="w-4 h-4" />
            <span>CHIA SẺ</span>
          </button>
          <button className="tech-social-btn" onClick={onFavorite}>
            <Heart className="w-4 h-4" />
            <span>YÊU THÍCH</span>
          </button>
        </div>
      </div>
    </TechCard>
  );
};