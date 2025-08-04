import { getSaboRankInfoByCode, integerToSaboRank } from '@/utils/saboRanks';

interface RankBadgeProps {
  rank:
    | {
        code: string;
        name: string;
        level: number;
      }
    | string
    | number; // Support legacy formats
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  size = 'md',
  showTooltip = true,
}) => {
  // Normalize rank input to SABO format
  const normalizeRank = () => {
    if (typeof rank === 'string') {
      // If it's already a SABO rank code, get its info
      return getSaboRankInfoByCode(rank);
    } else if (typeof rank === 'number') {
      // Convert integer to SABO rank
      const rankCode = integerToSaboRank(rank);
      return getSaboRankInfoByCode(rankCode);
    } else {
      // Legacy object format - convert to SABO if needed
      if (
        rank.code &&
        (rank.code.includes('K') ||
          rank.code.includes('I') ||
          rank.code.includes('H') ||
          rank.code.includes('G') ||
          rank.code.includes('F') ||
          rank.code.includes('E'))
      ) {
        return getSaboRankInfoByCode(rank.code);
      }
      // Fallback - assume it's a level and convert
      const rankCode = integerToSaboRank(rank.level || 1);
      return getSaboRankInfoByCode(rankCode);
    }
  };

  const rankInfo = normalizeRank();

  const getRankColor = (code: string) => {
    const firstLetter = code.charAt(0);
    switch (firstLetter) {
      case 'K':
        return 'bg-slate-500 text-white border-slate-600';
      case 'I':
        return 'bg-amber-500 text-white border-amber-600';
      case 'H':
        return 'bg-green-500 text-white border-green-600';
      case 'G':
        return 'bg-blue-500 text-white border-blue-600';
      case 'F':
        return 'bg-purple-500 text-white border-purple-600';
      case 'E':
        return 'bg-red-500 text-white border-red-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs min-w-[40px]';
      case 'lg':
        return 'px-4 py-2 text-lg min-w-[60px]';
      default:
        return 'px-3 py-1.5 text-sm min-w-[50px]';
    }
  };

  const badgeClasses = `
    inline-flex items-center justify-center rounded-lg border-2 font-bold
    sabo-tech-border-rank-${rankInfo.code.charAt(0).toLowerCase()}
    ${getRankColor(rankInfo.code)}
    ${getSizeClasses()}
  `;

  const badge = <span className={badgeClasses}>{rankInfo.code}</span>;

  if (showTooltip) {
    return (
      <div className='relative group'>
        {badge}
        <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10'>
          {rankInfo.name}
          <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
        </div>
      </div>
    );
  }

  return badge;
};
