// Simplified season utilities
export const resetSeason = async () => {

  return { success: true };
};

export const getCurrentSeasonInfo = async () => {
  return { season: 'current', status: 'active' };
};

export const getPlayerSeasonStats = async () => {
  return { stats: {} };
};
