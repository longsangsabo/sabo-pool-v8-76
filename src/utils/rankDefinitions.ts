export interface RankInfo {
  name: string;
  description: string;
  requirements: string[];
}

export const RANK_DEFINITIONS: Record<string, RankInfo> = {
  K: {
    name: 'Hạng K',
    description: '2-4 bi khi hình dễ; mới tập',
    requirements: ['2-4 bi khi hình dễ', 'Mới tập chơi', 'Biết luật cơ bản'],
  },
  'K+': {
    name: 'Hạng K+',
    description: '2-4 bi khi hình dễ; biết luật, kê cơ đúng',
    requirements: ['2-4 bi khi hình dễ', 'Biết luật', 'Kê cơ đúng'],
  },
  I: {
    name: 'Hạng I',
    description: '3-5 bi; chưa điều được chấm',
    requirements: ['3-5 bi', 'Chưa điều được chấm', 'Kỹ thuật cơ bản'],
  },
  'I+': {
    name: 'Hạng I+',
    description: '3-5 bi; tân binh tiến bộ',
    requirements: ['3-5 bi', 'Tân binh tiến bộ', 'Hiểu luật tốt hơn'],
  },
  H: {
    name: 'Hạng H',
    description: 'Đi 5-8 bi; có thể "rùa" 1 chấm hình dễ',
    requirements: [
      'Đi 5-8 bi',
      'Có thể "rùa" 1 chấm hình dễ',
      'Hiểu cơ bản về position',
    ],
  },
  'H+': {
    name: 'Hạng H+',
    description: 'Đi 5-8 bi; chuẩn bị lên G',
    requirements: ['Đi 5-8 bi', 'Chuẩn bị lên G', 'Kỹ thuật ổn định hơn'],
  },
  G: {
    name: 'Hạng G',
    description: 'Clear 1 chấm + 3-7 bi kế; bắt đầu điều bi 3 băng',
    requirements: [
      'Clear 1 chấm + 3-7 bi kế',
      'Bắt đầu điều bi 3 băng',
      'Trình phong trào "ngon"',
    ],
  },
  'G+': {
    name: 'Hạng G+',
    description: 'Clear 1 chấm + 3-7 bi kế; trình phong trào "ngon"',
    requirements: [
      'Clear 1 chấm + 3-7 bi kế',
      'Trình phong trào "ngon"',
      'Điều bi 3 băng khá',
    ],
  },
  F: {
    name: 'Hạng F',
    description: '60-80% clear 1 chấm, đôi khi phá 2 chấm',
    requirements: [
      '60-80% clear 1 chấm',
      'Đôi khi phá 2 chấm',
      'Safety & spin control khá chắc',
    ],
  },
  'F+': {
    name: 'Hạng F+',
    description: '60-80% clear 1 chấm; cao nhất nhóm trung cấp',
    requirements: [
      '60-80% clear 1 chấm',
      'Cao nhất nhóm trung cấp',
      'Safety & spin control chắc',
    ],
  },
  E: {
    name: 'Hạng E',
    description: '90-100% clear 1 chấm, 70% phá 2 chấm',
    requirements: [
      '90-100% clear 1 chấm',
      '70% phá 2 chấm',
      'Điều bi phức tạp, safety chủ động',
    ],
  },
  'E+': {
    name: 'Hạng E+',
    description: '90-100% clear 1 chấm; sát ngưỡng lên D (chưa mở)',
    requirements: [
      '90-100% clear 1 chấm',
      '70% phá 2 chấm',
      'Sát ngưỡng lên D (chưa mở)',
    ],
  },
};

export const getRankInfo = (rank: string): RankInfo => {
  return (
    RANK_DEFINITIONS[rank] || {
      name: rank,
      description: 'Hạng không xác định',
      requirements: [],
    }
  );
};

export const getAllRanks = (): string[] => {
  return Object.keys(RANK_DEFINITIONS);
};

export const getRanksByGroup = () => {
  return {
    beginner: ['K', 'K+'],
    novice: ['I', 'I+'],
    intermediate: ['H', 'H+'],
    advanced: ['G', 'G+'],
    expert: ['F', 'F+'],
    master: ['E', 'E+'],
  };
};
