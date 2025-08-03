/**
 * Mock Tournament Card Component
 * Used to display tournament information in a card format.
 */
import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { Tournament } from '../../types/tournament';

interface BaseTournamentCardProps {
  tournament: Tournament;
  onClick?: (id: string) => void;
}

const SimpleTournamentCard: React.FC<BaseTournamentCardProps> = ({ tournament, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(tournament.id);
    }
  };

  return (
    <Box 
      sx={{ 
        border: '1px solid #ccc',
        borderRadius: 2,
        padding: 2,
        marginBottom: 2,
        backgroundColor: '#f5f5f5'
      }}
      onClick={handleClick}
      data-testid="tournament-card"
    >
      <Typography variant="h6">{tournament.name}</Typography>
      <Typography variant="body2">
        Date: {tournament.date}
      </Typography>
      <Typography variant="body2">
        Location: {tournament.location}
      </Typography>
      <Typography variant="body2">
        Status: {tournament.status}
      </Typography>
      
      {onClick && (
        <Button 
          variant="contained" 
          color="primary" 
          size="small" 
          sx={{ marginTop: 1 }}
          onClick={handleClick}
        >
          View Details
        </Button>
      )}
    </Box>
  );
};

export default SimpleTournamentCard;
