// Main User Feature Index - Centralized Exports

// Re-export all components and pages
export * from './components';
export * from './pages';

// Main exports for easy imports
export { default as UserOnboardingFlow } from './components/UserOnboardingFlow';

// Hub exports (all 7 primary pages - production ready)
export { default as DashboardHub } from './pages/hubs/DashboardHub';
export { default as PlayerProfileHub } from './pages/hubs/PlayerProfileHub';
export { default as ChallengesHub } from './pages/hubs/ChallengesHub';
export { default as TournamentHub } from './pages/hubs/TournamentHub';
export { default as FinancialHub } from './pages/hubs/FinancialHub';
export { default as ExploreHub } from './pages/hubs/ExploreHub';
export { default as MessageHub } from './pages/hubs/MessageHub';

// Page exports (4 pages)
export { default as RankingPage } from './pages/profile/RankingPage';
export { default as RankRegistrationPage } from './pages/profile/RankRegistrationPage';
export { default as SettingsPage } from './pages/settings/SettingsPage';
export { default as SecurityPage } from './pages/settings/SecurityPage';

// Backward compatibility exports (named imports)
import DashboardHubComponent from './pages/hubs/DashboardHub';
import PlayerProfileHubComponent from './pages/hubs/PlayerProfileHub';
import ChallengesHubComponent from './pages/hubs/ChallengesHub';
import TournamentHubComponent from './pages/hubs/TournamentHub';
import FinancialHubComponent from './pages/hubs/FinancialHub';
import ExploreHubComponent from './pages/hubs/ExploreHub';
import MessageHubComponent from './pages/hubs/MessageHub';

export {
  DashboardHubComponent as UserDashboard,
  PlayerProfileHubComponent as UserProfile,
  ChallengesHubComponent as UserChallenges,
  TournamentHubComponent as UserTournaments,
  FinancialHubComponent as UserFinancial,
  ExploreHubComponent as UserExplore,
  MessageHubComponent as UserMessages,
};

// Types
export * from './types';
