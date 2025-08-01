// Tournament helper utilities
export const getTournamentTypeText = (type: string): string => {
  switch (type) {
    case 'single_elimination':
      return '1 Mạng';
    case 'double_elimination':
      return '2 Mạng';
    case 'round_robin':
      return 'Vòng tròn';
    case 'swiss':
      return 'Swiss';
    default:
      return type;
  }
};

export const getTierText = (tier: string | number): string => {
  switch (tier) {
    case 'K':
    case 1:
      return 'Hạng K (Mới bắt đầu)';
    case 'I':
    case 2:
      return 'Hạng I (Cơ bản)';
    case 'H':
    case 3:
      return 'Hạng H (Trung cấp)';
    case 'G':
    case 4:
      return 'Hạng G (Cao cấp)';
    case 'F':
    case 5:
      return 'Hạng F (Chuyên nghiệp)';
    case 'E':
    case 6:
      return 'Hạng E (Chuyên nghiệp cao cấp)';
    default:
      return `Hạng ${tier}`;
  }
};

export const getRankRequirementText = (
  minRank?: string,
  maxRank?: string,
  rankRequirement?: string
): string => {
  if (rankRequirement && rankRequirement !== 'all') {
    return `Chỉ hạng ${rankRequirement}`;
  }

  if (minRank && maxRank) {
    return `Từ hạng ${minRank} đến ${maxRank}`;
  }

  if (minRank) {
    return `Từ hạng ${minRank} trở lên`;
  }

  if (maxRank) {
    return `Tối đa hạng ${maxRank}`;
  }

  return 'Tất cả hạng';
};

export const formatTournamentDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Chưa xác định';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return 'Chưa xác định';
  }
};

export const formatTournamentDateRange = (
  startDate: string | null,
  endDate: string | null
): string => {
  if (!startDate && !endDate) return 'Chưa xác định';

  if (startDate && endDate) {
    const start = formatTournamentDateTime(startDate);
    const end = formatTournamentDateTime(endDate);

    if (start === 'Chưa xác định' || end === 'Chưa xác định') {
      return 'Chưa xác định';
    }

    // If same date, just show time range
    const startDateOnly = startDate.split('T')[0];
    const endDateOnly = endDate.split('T')[0];

    if (startDateOnly === endDateOnly) {
      const startTime = new Date(startDate).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const endTime = new Date(endDate).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const dateStr = new Date(startDate).toLocaleDateString('vi-VN');
      return `${dateStr} (${startTime} - ${endTime})`;
    }

    return `${start} - ${end}`;
  }

  if (startDate) return `Từ ${formatTournamentDateTime(startDate)}`;
  if (endDate) return `Đến ${formatTournamentDateTime(endDate)}`;

  return 'Chưa xác định';
};

// Prize formatting function to fix scientific notation display
export const formatPrizeAmount = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount) || numAmount === 0) return '0 VND';

  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M VND`;
  } else if (numAmount >= 1000) {
    return `${Math.round(numAmount / 1000)}K VND`;
  } else {
    return `${Math.round(numAmount)} VND`;
  }
};

// Tournament automation status helpers
export const getAutomationStatusText = (
  automationType: 'registration' | 'bracket' | 'progression' | 'completion',
  isActive: boolean
): string => {
  const texts = {
    registration: isActive ? '✅ Tự động đóng đăng ký' : '⏳ Chờ đóng đăng ký',
    bracket: isActive ? '✅ Tự động tạo bracket' : '⏳ Chờ tạo bracket',
    progression: isActive ? '✅ Tự động tiến vòng' : '⏳ Chờ tiến vòng',
    completion: isActive ? '✅ Tự động hoàn thành' : '⏳ Chờ hoàn thành',
  };

  return texts[automationType];
};

// Calculate tournament round requirements
export const calculateTournamentRounds = (participantCount: number): number => {
  if (participantCount <= 1) return 0;
  return Math.ceil(Math.log2(participantCount));
};

// Generate tournament seeding for single elimination
export const generateSeeding = (
  participantCount: number
): Array<[number, number | null]> => {
  const rounds = calculateTournamentRounds(participantCount);
  const maxParticipants = Math.pow(2, rounds);
  const pairs: Array<[number, number | null]> = [];

  for (let i = 1; i <= maxParticipants / 2; i++) {
    const opponent = maxParticipants + 1 - i;
    pairs.push([i, opponent <= participantCount ? opponent : null]);
  }

  return pairs;
};
