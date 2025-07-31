export interface PlayerRanking {
  id: string;
  nickname: string;
  rank_code: 'G' | 'H+' | 'H' | 'I+' | 'I' | 'K+' | 'K';
  balls_consistent: number;
  can_do_cham_don: boolean;
  can_do_cham_pha: boolean;
  is_stable: boolean;
  tournament_achievement?: string;
  promotion_ready: boolean;
  club_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  type: 'player' | 'table' | 'tournament';
  data: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  scan_count: number;
}

export interface TableQRCode {
  id: string;
  club_id: string;
  table_number: number;
  qr_code: string;
  table_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  club?: Club;
}

export interface QuickMatch {
  id: string;
  table_id: string;
  player1_id: string;
  player2_id: string;
  game_type: '8_ball' | '9_ball' | 'song_to';
  bet_points: number;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  player1_score: number;
  player2_score: number;
  winner_id?: string;
  player1_confirmed: boolean;
  player2_confirmed: boolean;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  table?: TableQRCode;
  player1?: UserProfile;
  player2?: UserProfile;
  winner?: UserProfile;
}

export interface MatchResult {
  id: string;
  match_id: string;
  winner_id: string;
  loser_id: string;
  winner_score: number;
  loser_score: number;
  elo_points_exchanged: number;
  winner_elo_change: number;
  loser_elo_change: number;
  match_duration_minutes?: number;
  created_at: string;
  match?: QuickMatch;
  winner?: UserProfile;
  loser?: UserProfile;
}

export interface Season2Info {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  registration_fee: number;
  status: 'active' | 'completed' | 'cancelled';
  total_participants: number;
  total_matches: number;
  created_at: string;
  updated_at: string;
}

export interface Season2Prize {
  id: string;
  rank_min: number;
  rank_max: number;
  prize_description: string;
  prize_value: number;
  voucher_amount: number;
  member_months: number;
  created_at: string;
}

// Player ranking configuration based on the provided classification
export const PLAYER_RANKING_CONFIGS = [
  {
    rank_code: 'G',
    description: 'Hạng G - Cao cấp nhất',
    balls_consistent: { min: 7, max: 8 },
    can_do_cham_don: true,
    can_do_cham_pha: true,
    is_stable: true,
    requirements: [
      'Đi được 7-8 bi ổn định',
      'Có thể đi 1 chấm phá + 1 chấm đơn trong trận',
      'Đã đạt giải cấp tỉnh/thành',
      'Là top đầu tại CLB',
      'Có tiềm năng lên chuyên nghiệp',
    ],
  },
  {
    rank_code: 'H+',
    description: 'Hạng H+ - Trung cao cấp',
    balls_consistent: { min: 5, max: 7 },
    can_do_cham_don: true,
    can_do_cham_pha: false,
    is_stable: true,
    requirements: [
      'Đi được 5-7 bi ổn định',
      'Có thể đi 1 chấm đơn với hình đẹp, cửa lộ',
      'Đã tham gia ít nhất 1 giải đấu',
      'Thường xuyên giao lưu CLB khác',
      'Sắp đạt tiêu chuẩn lên G',
    ],
  },
  {
    rank_code: 'H',
    description: 'Hạng H - Trung cấp',
    balls_consistent: { min: 4, max: 6 },
    can_do_cham_don: false,
    can_do_cham_pha: false,
    is_stable: false,
    requirements: [
      'Đi được 4-6 bi không đều',
      'Có thể dọn bi với hỗ trợ',
      'Mới đạt thành tích ở nội bộ CLB',
      'Tham gia hệ thống phân hạng',
      'Được CLB đánh giá cao',
    ],
  },
  {
    rank_code: 'I+',
    description: 'Hạng I+ - Trung bình khá',
    balls_consistent: { min: 4, max: 5 },
    can_do_cham_don: false,
    can_do_cham_pha: false,
    is_stable: true,
    requirements: [
      'Đi được 4-5 bi, ổn định',
      'Không thể đi chấm hoặc gỡ hình',
      'Đang luyện tập lên H',
      'Có biểu hiện tiến bộ rõ',
      'Có hướng dẫn từ người chơi cao cấp',
    ],
  },
  {
    rank_code: 'I',
    description: 'Hạng I - Trung bình',
    balls_consistent: { min: 3, max: 4 },
    can_do_cham_don: false,
    can_do_cham_pha: false,
    is_stable: false,
    requirements: [
      'Đi được 3-4 bi, chưa ổn định',
      'Thiếu chiến thuật',
      'Mới gia nhập CLB',
      'Đã thi đấu ít trận chính thức',
      'Cần thêm va chạm thực tế',
    ],
  },
  {
    rank_code: 'K+',
    description: 'Hạng K+ - Sơ cấp khá',
    balls_consistent: { min: 3, max: 5 },
    can_do_cham_don: false,
    can_do_cham_pha: false,
    is_stable: false,
    requirements: [
      'Đi được 3-5 bi, không ổn định',
      'Chưa đủ khả năng dọn hình',
      'Có tiềm năng nhưng chưa luyện tập đều',
      'Chơi giải giao lưu nhỏ',
    ],
  },
  {
    rank_code: 'K',
    description: 'Hạng K - Sơ cấp',
    balls_consistent: { min: 2, max: 3 },
    can_do_cham_don: false,
    can_do_cham_pha: false,
    is_stable: false,
    requirements: [
      'Đi được 2-3 bi',
      'Mới bắt đầu học kỹ năng cơ bản',
      'Người chơi mới',
      'Cần học lối chơi và luật',
      'Chưa thi đấu lần nào',
    ],
  },
];

export const getRankingConfig = (rankCode: string) => {
  return PLAYER_RANKING_CONFIGS.find(config => config.rank_code === rankCode);
};

export interface CreateQuickMatchRequest {
  player1_id: string;
  player2_id: string;
  table_id?: string;
  bet_amount?: number;
}

export interface ConfirmMatchResultRequest {
  match_id: string;
  winner_score: number;
  loser_score: number;
}

export interface Club {
  id: string;
  name: string;
  address: string;
  description?: string;
  email?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  available_tables?: number;
  hourly_rate?: number;
  monthly_payment?: number;
  is_sabo_owned?: boolean;
  priority_score?: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  nickname?: string;
  avatar_url?: string;
  current_rank: string;
  ranking_points: number;
  matches_played: number;
  wins: number;
  losses: number;
  current_streak: number;
  bio?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  province_id?: string;
  district_id?: string;
  ward_id?: string;
  preferred_play_times?: string[];
  min_bet_points?: number;
  max_bet_points?: number;
  club_id?: string;
  preferred_club_id?: string;
  experience_years?: number;
  created_at: string;
  updated_at: string;
}

export interface QRScanHistory {
  id: string;
  qr_code_id: string;
  scanned_by: string;
  scanned_at: string;
  location?: string;
  scan_data?: any;
}
