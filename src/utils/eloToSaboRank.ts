// ELO to SABO rank conversion utility - matches database function exactly
export const eloToSaboRank = (eloValue: number): string => {
  if (eloValue >= 2100) return 'E+';
  if (eloValue >= 2000) return 'E';
  if (eloValue >= 1900) return 'F+';
  if (eloValue >= 1800) return 'F';
  if (eloValue >= 1700) return 'G+';
  if (eloValue >= 1600) return 'G';
  if (eloValue >= 1500) return 'H+';
  if (eloValue >= 1400) return 'H';
  if (eloValue >= 1300) return 'I+';
  if (eloValue >= 1200) return 'I';
  if (eloValue >= 1100) return 'K+';
  return 'K';
};

// Format rank with ELO for display
export const formatRankDisplay = (rank: string, elo: number): string => {
  return `Hạng ${rank} - ${elo} ELO`;
};

// Get ELO from SABO rank (approximation for reverse conversion)
export const saboRankToElo = (rank: string): number => {
  switch (rank) {
    case 'E+':
      return 2100;
    case 'E':
      return 2000;
    case 'F+':
      return 1900;
    case 'F':
      return 1800;
    case 'G+':
      return 1700;
    case 'G':
      return 1600;
    case 'H+':
      return 1500;
    case 'H':
      return 1400;
    case 'I+':
      return 1300;
    case 'I':
      return 1200;
    case 'K+':
      return 1100;
    case 'K':
      return 1000;
    default:
      return 1000;
  }
};
