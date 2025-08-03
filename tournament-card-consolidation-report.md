# Tournament Card Consolidation Report

Date: 2025-08-03T16:19:01.969Z

## Overview

Found 2 tournament card components that can be replaced with UnifiedTournamentCard.

| Component | Type | Props | Usages | Recommended Variant |
| --------- | ---- | ----- | ------ | ------------------ |
| SimpleTournamentCard | Simple | 2 | 3 | simple |
| DetailedTournamentCard | Interactive | 5 | 2 | detailed |

## Detailed Analysis

### SimpleTournamentCard

- **File:** /workspaces/sabo-pool-v8-76/src/components/tournament/SimpleTournamentCard.tsx
- **Type:** Simple
- **Has Children:** No
- **Props Count:** 2
- **Memoized:** No
- **Recommended Variant:** `simple`

#### Usages (3):

- /workspaces/sabo-pool-v8-76/src/pages/Tournaments.tsx
- /workspaces/sabo-pool-v8-76/src/components/dashboard/RecentTournaments.tsx
- /workspaces/sabo-pool-v8-76/src/components/home/FeaturedTournaments.tsx

#### Migration Instructions:

```tsx
// Before
import { SimpleTournamentCard } from '@/components/tournament/SimpleTournamentCard';

<SimpleTournamentCard tournament={tournament} />

// After
import { UnifiedTournamentCard } from '@/components/tournament/UnifiedTournamentCard';

<UnifiedTournamentCard variant="simple" tournament={tournament} />
```

### DetailedTournamentCard

- **File:** /workspaces/sabo-pool-v8-76/src/components/tournament/DetailedTournamentCard.tsx
- **Type:** Interactive
- **Has Children:** No
- **Props Count:** 5
- **Memoized:** No
- **Recommended Variant:** `detailed`

#### Usages (2):

- /workspaces/sabo-pool-v8-76/src/pages/TournamentDetails.tsx
- /workspaces/sabo-pool-v8-76/src/components/tournament/TournamentList.tsx

#### Migration Instructions:

```tsx
// Before
import { DetailedTournamentCard } from '@/components/tournament/DetailedTournamentCard';

<DetailedTournamentCard onViewDetails={handleView} tournament={tournament} />

// After
import { UnifiedTournamentCard } from '@/components/tournament/UnifiedTournamentCard';

<UnifiedTournamentCard variant="detailed" onView={handleView} tournament={tournament} />
```

## Next Steps

1. Start with replacing simple, non-interactive components first
2. For interactive components, ensure event handlers are properly mapped
3. Test thoroughly after each replacement
4. Remove original components after all usages have been migrated