import React from 'react';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { ArenaLogo } from './arena/ArenaLogo';
import { MirrorAvatar } from './arena/MirrorAvatar';
import { ArenaNavigation } from './arena/ArenaNavigation';
import { Loader2 } from 'lucide-react';

const ArenaProfilePage: React.FC = () => {
  const { data: profile, isLoading, error } = useUnifiedProfile();

  if (isLoading) {
    return (
      <div className="profile-page-arena">
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page-arena">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-white text-center">
            <p>Không thể tải thông tin người chơi</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-arena">
      {/* SABO ARENA Header */}
      <ArenaLogo />
      
      {/* Mirror Avatar Effect */}
      <MirrorAvatar 
        avatarUrl={profile.avatar_url}
        username={profile.display_name || profile.full_name || 'Champion'}
        rank={profile.verified_rank || 'Rookie'}
      />
      
      {/* User Info Section */}
      <div className="user-info-section">
        <h1 className="username">
          {profile.display_name || profile.full_name || 'Arena Champion'}
        </h1>
        <div className="rank-badge" data-rank={profile.verified_rank || 'Rookie'}>
          <span className="rank-text">{profile.verified_rank || 'Rookie'}</span>
        </div>
        
        {/* Arena Stats */}
        <div className="arena-stats">
          <div className="stat-circle">
            <span className="stat-number">{profile.spa_points || 0}</span>
            <span className="stat-label">SPA Points</span>
          </div>
          <div className="stat-circle">
            <span className="stat-number">{profile.matches_won || 0}</span>
            <span className="stat-label">Victories</span>
          </div>
          <div className="stat-circle">
            <span className="stat-number">{profile.win_percentage || 0}%</span>
            <span className="stat-label">Win Rate</span>
          </div>
        </div>
      </div>
      
      {/* Arena Navigation */}
      <ArenaNavigation />
    </div>
  );
};

export default ArenaProfilePage;