// Main User Feature Index - Centralized Exports

// Re-export all components and pages
export * from './components';
export * from './pages';

// Main exports for easy imports
export { default as UserOnboardingFlow } from './components/UserOnboardingFlow';

// Hub exports (primary pages)
export { default as DashboardHub } from './pages/hubs/DashboardHub';
export { default as PlayerProfileHub } from './pages/hubs/PlayerProfileHub';
export { default as ChallengesHub } from './pages/hubs/ChallengesHub';
export { default as TournamentHub } from './pages/hubs/TournamentHub';

// Page exports
export { default as RankingPage } from './pages/profile/RankingPage';
export { default as RankRegistrationPage } from './pages/profile/RankRegistrationPage';
export { default as SettingsPage } from './pages/settings/SettingsPage';
export { default as SecurityPage } from './pages/settings/SecurityPage';

// Backward compatibility exports (named imports)
import DashboardHubComponent from './pages/hubs/DashboardHub';
import PlayerProfileHubComponent from './pages/hubs/PlayerProfileHub';
import ChallengesHubComponent from './pages/hubs/ChallengesHub';
import TournamentHubComponent from './pages/hubs/TournamentHub';

export {
  DashboardHubComponent as UserDashboard,
  PlayerProfileHubComponent as UserProfile,
  ChallengesHubComponent as UserChallenges,
  TournamentHubComponent as UserTournaments,
};

// Types
export * from './types';
