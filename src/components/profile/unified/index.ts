// Unified Profile Components
export { ProfileHeader } from './ProfileHeader';
export { ProfileStats } from './ProfileStats';
export { ProfileQuickActions } from './ProfileQuickActions';
export { ProfileContent } from './ProfileContent';
export { ProfileActivities } from './ProfileActivities';

// Types
export interface ProfileComponentProps {
  profile: any;
  variant?: 'mobile' | 'desktop';
  arenaMode?: boolean;
}

export interface ProfileQuickActionsProps extends ProfileComponentProps {
  onNavigateToClubTab: () => void;
  onNavigateToRankTab: () => void;
}

export interface ProfileContentProps extends ProfileComponentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface ProfileActivitiesProps {
  activities: any[];
  variant?: 'mobile' | 'desktop';
  arenaMode?: boolean;
  className?: string;
}
