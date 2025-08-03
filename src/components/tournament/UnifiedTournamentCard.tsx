/**
 * Unified Tournament Card Component
 * A standardized card component for displaying tournament information
 * with multiple variants to handle different display needs.
 */
import React from 'react';
import { Tournament } from '../../types/tournament';

interface UnifiedTournamentCardProps {
  tournament: Tournament;
  variant?: 'simple' | 'interactive' | 'detailed';
  onView?: (id: string) => void;
  onRegister?: (id: string) => void;
}

export const UnifiedTournamentCard: React.FC<UnifiedTournamentCardProps> = ({ 
  tournament, 
  variant = 'simple',
  onView,
  onRegister
}) => {
  const handleView = () => {
    if (onView) {
      onView(tournament.id);
    }
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegister) {
      onRegister(tournament.id);
    }
  };

  // Simple version with basic info
  if (variant === 'simple') {
    return (
      <div className="card tournament-card simple" onClick={handleView}>
        <h3>{tournament.name}</h3>
        <p>Date: {tournament.date}</p>
        <p>Status: {tournament.status}</p>
      </div>
    );
  }

  // Interactive version with buttons
  if (variant === 'interactive') {
    return (
      <div className="card tournament-card interactive">
        <h3>{tournament.name}</h3>
        <p>Date: {tournament.date}</p>
        <p>Status: {tournament.status}</p>
        <p>Location: {tournament.location}</p>
        <div className="actions">
          {onView && <button onClick={handleView}>View Details</button>}
          {onRegister && <button onClick={handleRegister}>Register</button>}
        </div>
      </div>
    );
  }

  // Detailed version with all information
  return (
    <div className="card tournament-card detailed">
      <h3>{tournament.name}</h3>
      <div className="tournament-details">
        <p>Date: {tournament.date}</p>
        <p>Location: {tournament.location}</p>
        <p>Status: {tournament.status}</p>
        <p>Type: {tournament.type}</p>
        <p>Participants: {tournament.participants}/{tournament.maxParticipants}</p>
      </div>
      <div className="actions">
        {onView && <button onClick={handleView}>View Details</button>}
        {onRegister && <button onClick={handleRegister}>Register</button>}
      </div>
    </div>
  );
};

export default UnifiedTournamentCard;
