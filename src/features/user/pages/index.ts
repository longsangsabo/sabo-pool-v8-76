// User Pages Index - Centralized Page Exports

// Main Hubs (working pages)
export { default as DashboardHub } from './hubs/DashboardHub';
export { default as PlayerProfileHub } from './hubs/PlayerProfileHub';
export { default as ChallengesHub } from './hubs/ChallengesHub';
export { default as TournamentHub } from './hubs/TournamentHub';

// Profile Pages
export { default as RankingPage } from './profile/RankingPage';
export { default as RankRegistrationPage } from './profile/RankRegistrationPage';

// Settings Pages
export { default as SettingsPage } from './settings/SettingsPage';
export { default as SecurityPage } from './settings/SecurityPage';

// Foundation hubs (when implemented)
// export { default as FinancialHub } from './hubs/FinancialHub';
// export { default as ExploreHub } from './hubs/ExploreHub';
// export { default as MessageHub } from './hubs/MessageHub';

// Backward compatibility
export { default as UserDashboard } from './hubs/DashboardHub';
export { default as UserProfile } from './hubs/PlayerProfileHub';
export { default as UserChallenges } from './hubs/ChallengesHub';
export { default as UserTournaments } from './hubs/TournamentHub';
