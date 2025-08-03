import { 
  Home, 
  Swords, 
  Trophy, 
  Users, 
  User,
  Calendar,
  Wallet,
  Settings,
  BarChart3,
  Bell,
  LayoutDashboard,
  Building,
  Shield,
  Database,
  Receipt,
  Target,
  BookOpen,
  TrendingUp,
  MessageSquare,
  Gamepad2,
  DollarSign,
  AlertTriangle,
  FileText,
  Zap,
  Code,
  Bot
} from 'lucide-react';

export interface NavigationItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: boolean; // Whether to show notification badge
  description?: string;
  section?: string; // For grouping in sidebar
}

export interface NavigationConfig {
  showTopBar: boolean;
  showSidebar: boolean;
  showBottomNav: boolean;
  showSearch: boolean;
  showNotifications: boolean;
  sidebarItems: NavigationItem[];
  bottomNavItems: NavigationItem[];
}

// ===== USER NAVIGATION ITEMS =====
export const USER_NAV_ITEMS: NavigationItem[] = [
  { path: '/dashboard', label: 'Trang chủ', icon: Home, section: 'main' },
  { path: '/challenges', label: 'Thách đấu', icon: Swords, badge: true, section: 'main' },
  { path: '/tournaments', label: 'Giải đấu', icon: Trophy, section: 'main' },
  { path: '/leaderboard', label: 'BXH', icon: BarChart3, section: 'main' },
  { path: '/profile', label: 'Hồ sơ', icon: User, section: 'main' },
  
  // Secondary items (sidebar only)
  { path: '/calendar', label: 'Lịch', icon: Calendar, section: 'secondary' },
  { path: '/wallet', label: 'Ví', icon: Wallet, section: 'secondary' },
  { path: '/notifications', label: 'Thông báo', icon: Bell, badge: true, section: 'secondary' },
  { path: '/settings', label: 'Cài đặt', icon: Settings, section: 'secondary' },
];

// ===== CLUB OWNER NAVIGATION ITEMS =====
export const CLUB_NAV_ITEMS: NavigationItem[] = [
  { path: '/club-management', label: 'Dashboard CLB', icon: LayoutDashboard, section: 'main' },
  { path: '/club-management/tournaments', label: 'Giải đấu', icon: Trophy, section: 'main' },
  { path: '/club-management/members', label: 'Thành viên', icon: Users, section: 'main' },
  { path: '/club-management/schedule', label: 'Lịch trình', icon: Calendar, section: 'main' },
  { path: '/club-management/settings', label: 'Cài đặt CLB', icon: Settings, section: 'main' },
  
  // User features still available
  { path: '/dashboard', label: 'Dashboard User', icon: Home, section: 'user' },
  { path: '/challenges', label: 'Thách đấu', icon: Swords, badge: true, section: 'user' },
  { path: '/profile', label: 'Hồ sơ', icon: User, section: 'user' },
];

// ===== ADMIN NAVIGATION ITEMS =====
export const ADMIN_NAV_ITEMS: NavigationItem[] = [
  // Core admin functions
  { path: '/admin', label: 'Dashboard Admin', icon: BarChart3, section: 'core' },
  { path: '/admin/users', label: 'Người dùng', icon: Users, section: 'core' },
  { path: '/admin/tournaments', label: 'Giải đấu', icon: Trophy, section: 'core' },
  { path: '/admin/clubs', label: 'CLB', icon: Building, section: 'core' },
  { path: '/admin/challenges', label: 'Thách đấu', icon: Target, section: 'core' },
  
  // Management
  { path: '/admin/transactions', label: 'Giao dịch', icon: Receipt, section: 'management' },
  { path: '/admin/payments', label: 'Thanh toán', icon: DollarSign, section: 'management' },
  { path: '/admin/analytics', label: 'Phân tích', icon: TrendingUp, section: 'management' },
  { path: '/admin/reports', label: 'Báo cáo', icon: FileText, section: 'management' },
  
  // System
  { path: '/admin/database', label: 'Database', icon: Database, section: 'system' },
  { path: '/admin/automation', label: 'Tự động hóa', icon: Zap, section: 'system' },
  { path: '/admin/development', label: 'Development', icon: Code, section: 'system' },
  { path: '/admin/ai-assistant', label: 'AI Assistant', icon: Bot, section: 'system' },
  { path: '/admin/settings', label: 'Cài đặt', icon: Settings, section: 'system' },
  
  // Emergency
  { path: '/admin/emergency', label: 'Khẩn cấp', icon: AlertTriangle, section: 'emergency' },
];

// ===== DEVICE-SPECIFIC CONFIGURATIONS =====

const MOBILE_CONFIG_BASE = {
  showTopBar: true,
  showSidebar: false,
  showBottomNav: true,
  showSearch: false, // Mobile search in header
  showNotifications: true,
};

const DESKTOP_CONFIG_BASE = {
  showTopBar: true,
  showSidebar: true,
  showBottomNav: false,
  showSearch: true,
  showNotifications: true,
};

// ===== MAIN CONFIGURATION FUNCTION =====
export const getNavigationConfig = (
  userRole: 'user' | 'club' | 'admin',
  deviceType: 'mobile' | 'tablet' | 'desktop'
): NavigationConfig => {
  const isMobile = deviceType === 'mobile';
  const baseConfig = isMobile ? MOBILE_CONFIG_BASE : DESKTOP_CONFIG_BASE;

  switch (userRole) {
    case 'admin':
      return {
        ...baseConfig,
        sidebarItems: ADMIN_NAV_ITEMS,
        bottomNavItems: [
          ADMIN_NAV_ITEMS[0], // Dashboard
          ADMIN_NAV_ITEMS[1], // Users
          ADMIN_NAV_ITEMS[2], // Tournaments
          ADMIN_NAV_ITEMS[6], // Analytics
          ADMIN_NAV_ITEMS[14], // Settings
        ],
      };

    case 'club':
      return {
        ...baseConfig,
        sidebarItems: CLUB_NAV_ITEMS,
        bottomNavItems: [
          CLUB_NAV_ITEMS[0], // Club Dashboard
          CLUB_NAV_ITEMS[1], // Tournaments
          CLUB_NAV_ITEMS[2], // Members
          CLUB_NAV_ITEMS[6], // User Challenges
          CLUB_NAV_ITEMS[4], // Settings
        ],
      };

    case 'user':
    default:
      return {
        ...baseConfig,
        sidebarItems: USER_NAV_ITEMS,
        bottomNavItems: [
          USER_NAV_ITEMS[0], // Home
          USER_NAV_ITEMS[1], // Challenges
          USER_NAV_ITEMS[2], // Tournaments
          USER_NAV_ITEMS[3], // Leaderboard
          USER_NAV_ITEMS[4], // Profile
        ],
      };
  }
};

// ===== NAVIGATION SECTIONS FOR SIDEBAR GROUPING =====
export const NAVIGATION_SECTIONS = {
  user: {
    main: 'Chính',
    secondary: 'Tiện ích',
  },
  club: {
    main: 'Quản lý CLB',
    user: 'Tính năng cá nhân',
  },
  admin: {
    core: 'Quản trị chính',
    management: 'Quản lý',
    system: 'Hệ thống',
    emergency: 'Khẩn cấp',
  },
} as const;
