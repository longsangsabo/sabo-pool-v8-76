export interface ClubDashboardStats {
  totalMembers: number;
  activeTournaments: number;
  dailyChallenges: number;
  tableUtilization: number;
  revenueToday?: number;
  activeMembers?: number;
}

export interface ClubActivity {
  id: string;
  type: 'tournament' | 'challenge' | 'membership' | 'table_booking';
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  requiredPermission?: string;
}

export interface DashboardFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  activityTypes?: string[];
  status?: string[];
}

export interface ClubDashboard {
  stats: ClubDashboardStats;
  recentActivities: ClubActivity[];
  quickActions: QuickAction[];
  filters: DashboardFilters;
}
