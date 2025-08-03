import React from 'react';
import { UnifiedTournamentCard } from '@/components/tournament/UnifiedTournamentCard';
import { Tournament } from '@/types/tournament';

interface SocialTournamentCardProps {
  tournament: Tournament;
  onJoin?: () => void;
  onView?: () => void;
}

const SocialTournamentCard: React.FC<SocialTournamentCardProps> = ({
  tournament,
  onView,
}) => {
  return (
    <UnifiedTournamentCard
      tournament={tournament}
      variant='simple'
      onView={onView}
      className='bg-gradient-card border-border/50 shadow-card hover:shadow-intense transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]'
    />
  );
};

export default SocialTournamentCard;
