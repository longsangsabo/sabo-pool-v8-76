// SABO Pool Arena Rank System Utilities
// Centralized SABO rank conversion and utilities

export const SABO_RANKS = [
  { value: 1, code: 'K', name: 'Hạng K (Mới bắt đầu)', level: 1 },
  { value: 2, code: 'K+', name: 'Hạng K+ (Khá)', level: 2 },
  { value: 3, code: 'I', name: 'Hạng I (Trung bình)', level: 3 },
  { value: 4, code: 'I+', name: 'Hạng I+ (Trung bình khá)', level: 4 },
  { value: 5, code: 'H', name: 'Hạng H (Giỏi)', level: 5 },
  { value: 6, code: 'H+', name: 'Hạng H+ (Giỏi hơn)', level: 6 },
  { value: 7, code: 'G', name: 'Hạng G (Rất giỏi)', level: 7 },
  { value: 8, code: 'G+', name: 'Hạng G+ (Xuất sắc)', level: 8 },
  { value: 9, code: 'F', name: 'Hạng F (Chuyên nghiệp)', level: 9 },
  { value: 10, code: 'F+', name: 'Hạng F+ (Chuyên nghiệp cao)', level: 10 },
  { value: 11, code: 'E', name: 'Hạng E (Bậc thầy)', level: 11 },
  { value: 12, code: 'E+', name: 'Hạng E+ (Đại sư)', level: 12 },
] as const;

// Convert integer (1-12) to SABO rank code (K, K+, I, I+, etc.)
export const integerToSaboRank = (rankInt: number): string => {
  const rank = SABO_RANKS.find(r => r.value === rankInt);
  return rank ? rank.code : 'K'; // Default to K if invalid
};

// Convert SABO rank code to integer
export const saboRankToInteger = (rankCode: string): number => {
  const rank = SABO_RANKS.find(r => r.code === rankCode);
  return rank ? rank.value : 1; // Default to 1 if invalid
};

// Get full rank information
export const getSaboRankInfo = (rankInt: number) => {
  return SABO_RANKS.find(r => r.value === rankInt) || SABO_RANKS[0];
};

// Get rank info by code
export const getSaboRankInfoByCode = (rankCode: string) => {
  return SABO_RANKS.find(r => r.code === rankCode) || SABO_RANKS[0];
};

// Compare ranks (returns negative if rank1 < rank2, positive if rank1 > rank2)
export const compareRanks = (rank1: string, rank2: string): number => {
  const level1 = getSaboRankInfoByCode(rank1).level;
  const level2 = getSaboRankInfoByCode(rank2).level;
  return level1 - level2;
};

// Check if rank1 is higher than rank2
export const isHigherRank = (rank1: string, rank2: string): boolean => {
  return compareRanks(rank1, rank2) > 0;
};

// Get next rank up
export const getNextRank = (currentRank: string): string | null => {
  const currentInfo = getSaboRankInfoByCode(currentRank);
  const nextRank = SABO_RANKS.find(r => r.level === currentInfo.level + 1);
  return nextRank ? nextRank.code : null;
};

// Get previous rank down
export const getPreviousRank = (currentRank: string): string | null => {
  const currentInfo = getSaboRankInfoByCode(currentRank);
  const previousRank = SABO_RANKS.find(r => r.level === currentInfo.level - 1);
  return previousRank ? previousRank.code : null;
};
