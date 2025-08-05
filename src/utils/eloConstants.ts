// ELO Constants cho SABO Pool Arena - Hệ thống đơn giản hóa
// K-factor cố định = 32, tự động thăng hạng theo ELO

export const RANK_ELO = {
  K: 1000,
  'K+': 1100,
  I: 1200,
  'I+': 1300,
  H: 1400,
  'H+': 1500,
  G: 1600,
  'G+': 1700,
  F: 1800,
  'F+': 1900,
  E: 2000,
  'E+': 2100,
} as const;

// Official Tournament ELO Rewards from RANK_SYSTEM_README.md
export const TOURNAMENT_ELO_REWARDS = {
  CHAMPION: 80, // Champion gets +80 ELO
  RUNNER_UP: 40, // Runner-up gets +40 ELO
  THIRD_PLACE: 20, // 3rd place gets +20 ELO
  FOURTH_PLACE: 15, // 4th place gets +15 ELO
  TOP_8: 10, // Top 8 gets +10 ELO
  TOP_16: 5, // Top 16 gets +5 ELO
  PARTICIPATION: 0, // No participation bonus
} as const;

export const SPA_TOURNAMENT_REWARDS = {
  'E+': {
    CHAMPION: 1600,
    RUNNER_UP: 1200,
    THIRD_PLACE: 1000,
    FOURTH_PLACE: 700,
    TOP_8: 350,
    PARTICIPATION: 130,
  },
  E: {
    CHAMPION: 1500,
    RUNNER_UP: 1100,
    THIRD_PLACE: 900,
    FOURTH_PLACE: 650,
    TOP_8: 320,
    PARTICIPATION: 120,
  },
  F: {
    CHAMPION: 1350,
    RUNNER_UP: 1000,
    THIRD_PLACE: 800,
    FOURTH_PLACE: 550,
    TOP_8: 280,
    PARTICIPATION: 110,
  },
  G: {
    CHAMPION: 1200,
    RUNNER_UP: 900,
    THIRD_PLACE: 700,
    FOURTH_PLACE: 500,
    TOP_8: 250,
    PARTICIPATION: 100,
  },
  H: {
    CHAMPION: 1100,
    RUNNER_UP: 850,
    THIRD_PLACE: 650,
    FOURTH_PLACE: 450,
    TOP_8: 200,
    PARTICIPATION: 100,
  },
  I: {
    CHAMPION: 1000,
    RUNNER_UP: 800,
    THIRD_PLACE: 600,
    FOURTH_PLACE: 400,
    TOP_8: 150,
    PARTICIPATION: 100,
  },
  K: {
    CHAMPION: 900,
    RUNNER_UP: 700,
    THIRD_PLACE: 500,
    FOURTH_PLACE: 350,
    TOP_8: 120,
    PARTICIPATION: 100,
  },
  'K+': {
    CHAMPION: 950,
    RUNNER_UP: 750,
    THIRD_PLACE: 550,
    FOURTH_PLACE: 375,
    TOP_8: 135,
    PARTICIPATION: 100,
  },
  'I+': {
    CHAMPION: 1050,
    RUNNER_UP: 825,
    THIRD_PLACE: 625,
    FOURTH_PLACE: 425,
    TOP_8: 165,
    PARTICIPATION: 100,
  },
  'H+': {
    CHAMPION: 1150,
    RUNNER_UP: 875,
    THIRD_PLACE: 675,
    FOURTH_PLACE: 475,
    TOP_8: 220,
    PARTICIPATION: 100,
  },
  'G+': {
    CHAMPION: 1275,
    RUNNER_UP: 950,
    THIRD_PLACE: 750,
    FOURTH_PLACE: 525,
    TOP_8: 265,
    PARTICIPATION: 100,
  },
  'F+': {
    CHAMPION: 1425,
    RUNNER_UP: 1050,
    THIRD_PLACE: 850,
    FOURTH_PLACE: 575,
    TOP_8: 295,
    PARTICIPATION: 110,
  },
} as const;

// SPA Challenge rewards have been removed as they contained incorrect information

// Helper function to get default rank
export const getDefaultRank = (): RankCode => 'K';

export type RankCode = keyof typeof RANK_ELO;
export type TournamentPosition = keyof typeof TOURNAMENT_ELO_REWARDS;
