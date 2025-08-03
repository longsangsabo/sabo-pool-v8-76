/**
 * Detailed Tournament Card Component
 * Used to display detailed tournament information in a card format.
 */
import React from 'react';
import { Tournament } from '../../types/tournament';

interface DetailedTournamentCardProps {
  tournament: Tournament;
  onViewDetails?: (id: string) => void;
}

const DetailedTournamentCard: React.FC<DetailedTournamentCardProps> = ({ 
  tournament, 
  onViewDetails 
}) => {
  const handleClick = () => {
    if (onViewDetails) {
      onViewDetails(tournament.id);
    }
  };

  return (
    <div className="tournament-card-detailed" onClick={handleClick}>
      <div className="card-header">
        <h2>{tournament.name}</h2>
        <span className={`status status-${tournament.status}`}>
          {tournament.status}
        </span>
      </div>
      
      <div className="card-body">
        <p><strong>Date:</strong> {tournament.date}</p>
        <p><strong>Location:</strong> {tournament.location}</p>
        <p><strong>Type:</strong> {tournament.type}</p>
        <p><strong>Participants:</strong> {tournament.participants}/{tournament.maxParticipants}</p>
      </div>
      
      <div className="card-footer">
        {onViewDetails && (
          <button className="btn-primary" onClick={handleClick}>
            View Tournament
          </button>
        )}
      </div>
    </div>
  );
};

export default DetailedTournamentCard;
