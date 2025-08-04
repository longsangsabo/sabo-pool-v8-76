# 🎯 User Folder Structure Proposal

## Current Issues
- User components scattered across multiple folders
- Inconsistent with admin/ and club/ organization
- Difficult to maintain user-specific features

## Proposed Structure

```
src/components/user/
├── dashboard/
│   ├── UserDashboard.tsx
│   ├── UserStats.tsx
│   ├── UserQuickActions.tsx
│   └── UserActivityFeed.tsx
├── profile/
│   ├── UserProfile.tsx
│   ├── UserProfileHeader.tsx
│   ├── UserProfileForm.tsx
│   ├── UserAvatar.tsx
│   └── UserSettings.tsx
├── navigation/
│   ├── UserDesktopHeader.tsx
│   ├── UserDesktopSidebar.tsx
│   ├── UserMobileNav.tsx
│   └── UserBottomNav.tsx
├── challenges/
│   ├── UserChallengesList.tsx
│   ├── CreateChallenge.tsx
│   └── ChallengeCard.tsx
├── tournaments/
│   ├── UserTournaments.tsx
│   ├── TournamentCard.tsx
│   └── TournamentRegistration.tsx
├── wallet/
│   ├── UserWallet.tsx
│   ├── WalletBalance.tsx
│   └── TransactionHistory.tsx
├── social/
│   ├── UserFeed.tsx
│   ├── PostCreation.tsx
│   └── UserConnections.tsx
├── ranking/
│   ├── UserRanking.tsx
│   ├── RankProgress.tsx
│   └── LeaderboardView.tsx
└── shared/
    ├── UserCard.tsx
    ├── UserBadge.tsx
    └── UserUtils.ts
```

## Migration Plan

### Phase 1: Create folder structure
- Create `src/components/user/` directory
- Create subdirectories

### Phase 2: Move existing components
- Move `UserProfileHeader.tsx` → `user/profile/`
- Move `UserDesktopHeader.tsx` → `user/navigation/`
- Move `UserDesktopSidebar.tsx` → `user/navigation/`
- Move `UserAvatar.tsx` → `user/profile/`
- Update all imports

### Phase 3: Create new user-specific components
- `HomePage.tsx` → `user/dashboard/UserDashboard.tsx`
- `UserProfile.tsx` → enhanced version in `user/profile/`
- User-specific navigation components

### Phase 4: Update routing and exports
- Update all import paths
- Create barrel exports (index.ts files)
- Update route configurations

## Benefits
1. **Consistency** with admin/ and club/ structure
2. **Maintainability** - easier to find user components
3. **Scalability** - clean structure for future features
4. **Team Collaboration** - clear ownership boundaries
5. **Code Organization** - logical grouping by domain

## Implementation
```bash
# Create folder structure
mkdir -p src/components/user/{dashboard,profile,navigation,challenges,tournaments,wallet,social,ranking,shared}

# Move existing components
mv src/components/UserProfileHeader.tsx src/components/user/profile/
mv src/components/UserAvatar.tsx src/components/user/profile/
mv src/components/desktop/UserDesktopHeader.tsx src/components/user/navigation/
mv src/components/desktop/UserDesktopSidebar.tsx src/components/user/navigation/

# Update imports in all affected files
# Create index.ts barrel exports
```
