import React, { useState, useEffect } from 'react';
import { TechTournamentHeader } from './TechTournamentHeader';
import { TechTournamentFilters } from './TechTournamentFilters';
import { TechTournamentCard } from './TechTournamentCard';
import { TechStatCard } from '@/components/ui/sabo-tech-global';
import { supabase } from '@/integrations/supabase/client';
import { Tournament } from '@/types/tournament';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Users, Trophy, Activity } from 'lucide-react';
import { EnhancedTournamentDetailsModal } from '@/components/tournament/EnhancedTournamentDetailsModal';
import { SimpleRegistrationModal } from '@/components/tournament/SimpleRegistrationModal';

export const TechTournamentPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registrationTournament, setRegistrationTournament] = useState<Tournament | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          club_profiles!tournaments_club_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments((data as any) || []);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      toast.error('Không thể tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTournament = () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để tạo giải đấu');
      return;
    }
    navigate('/club-management/tournaments');
  };

  const handleRegister = (tournament: Tournament) => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để đăng ký tham gia giải đấu');
      return;
    }
    setRegistrationTournament(tournament);
    setShowRegistrationModal(true);
  };

  const handleShare = (tournament: Tournament) => {
    if (navigator.share) {
      navigator.share({
        title: tournament.name,
        text: tournament.description || 'Tham gia giải đấu billiards',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã copy link chia sẻ');
    }
  };

  const handleFavorite = (tournament: Tournament) => {
    toast.success('Đã thêm vào yêu thích');
  };

  const stats = [
    {
      label: 'TỔNG GIẢI ĐẤU',
      value: tournaments.length,
      icon: <Trophy className="w-5 h-5" />,
      variant: 'primary' as const
    },
    {
      label: 'ĐANG MỞ ĐK',
      value: tournaments.filter(t => t.status === 'registration_open').length,
      icon: <Users className="w-5 h-5" />,
      variant: 'success' as const
    },
    {
      label: 'ĐANG DIỄN RA',
      value: tournaments.filter(t => t.status === 'ongoing').length,
      icon: <Activity className="w-5 h-5" />,
      variant: 'warning' as const
    },
    {
      label: 'ĐÃ KẾT THÚC',
      value: tournaments.filter(t => t.status === 'completed').length,
      icon: <Calendar className="w-5 h-5" />,
      variant: 'danger' as const
    }
  ];

  if (loading) {
    return (
      <div className="tech-tournament-page tech-loading-container">
        <div className="tech-loading-spinner"></div>
        <p className="tech-loading-text">ĐANG TẢI GIẢI ĐẤU...</p>
      </div>
    );
  }

  return (
    <div className="tech-tournament-page">
      <TechTournamentHeader />
      
      <TechTournamentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onCreateTournament={handleCreateTournament}
      />

      {/* Tech Stats Grid */}
      <div className="tech-stats-grid">
        {stats.map((stat, index) => (
          <TechStatCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
          />
        ))}
      </div>

      {/* Tournament List */}
      <div className="tech-tournament-list">
        {filteredTournaments.length === 0 ? (
          <div className="tech-empty-state">
            <Trophy className="tech-empty-icon" />
            <h3 className="tech-empty-title">KHÔNG TÌM THẤY GIẢI ĐẤU</h3>
            <p className="tech-empty-description">
              {searchTerm || statusFilter !== 'all' 
                ? 'Thử điều chỉnh bộ lọc để tìm giải đấu phù hợp'
                : 'Hiện tại chưa có giải đấu nào được tạo'
              }
            </p>
          </div>
        ) : (
          <div className="tech-tournament-grid">
            {filteredTournaments.map((tournament) => (
              <TechTournamentCard
                key={tournament.id}
                tournament={tournament}
                onViewDetails={() => {
                  setSelectedTournament(tournament);
                  setIsModalOpen(true);
                }}
                onRegister={() => handleRegister(tournament)}
                onShare={() => handleShare(tournament)}
                onFavorite={() => handleFavorite(tournament)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tournament Details Modal */}
      <EnhancedTournamentDetailsModal
        tournament={selectedTournament}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      {/* Registration Modal */}
      {registrationTournament && (
        <SimpleRegistrationModal
          tournament={registrationTournament}
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => {
            fetchTournaments();
            setShowRegistrationModal(false);
            setRegistrationTournament(null);
          }}
        />
      )}
    </div>
  );
};