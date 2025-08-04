# Club Management Module Documentation

## Overview
The Club Management module provides comprehensive functionality for managing billiards clubs, including member management, tournament organization, table management, and club settings.

## Directory Structure
```
src/features/club/
├── components/
│   ├── common/         # Shared components
│   │   ├── Loading.tsx
│   │   ├── Error.tsx
│   │   └── Empty.tsx
│   ├── members/        # Member management
│   │   ├── MemberCard.tsx
│   │   └── MemberList.tsx
│   ├── tournament/     # Tournament management
│   │   ├── TournamentForm.tsx
│   │   ├── TournamentList.tsx
│   │   └── TournamentManagement.tsx
│   ├── table/         # Table management
│   │   ├── TableGrid.tsx
│   │   ├── TableList.tsx
│   │   └── TableManagement.tsx
│   └── settings/      # Club settings
│       └── ClubSettings.tsx
├── hooks/             # Custom hooks
│   ├── useClub.ts
│   ├── useClubMembers.ts
│   └── useClubRole.ts
├── types/            # TypeScript definitions
│   ├── club.types.ts
│   ├── member.types.ts
│   ├── tournament.types.ts
│   └── table.types.ts
└── __tests__/        # Unit tests
    ├── MemberCard.test.tsx
    ├── TableManagement.test.tsx
    └── TournamentForm.test.tsx

## Components

### Member Management
- `MemberCard`: Displays individual member information
- `MemberList`: Shows paginated list of club members

### Tournament Management
- `TournamentForm`: Form for creating/editing tournaments
- `TournamentList`: List of club tournaments
- `TournamentManagement`: Main tournament management interface

### Table Management
- `TableGrid`: Grid view of pool tables
- `TableList`: List view of pool tables
- `TableManagement`: Main table management interface

### Settings
- `ClubSettings`: Club configuration interface

## Hooks

### useClub
Manages club data and operations:
```typescript
const { club, loading, error, updateClub } = useClub();
```

### useClubMembers
Handles club member operations:
```typescript
const { members, loading, error, fetchMembers, addMember, removeMember } = useClubMembers();
```

### useClubRole
Manages role-based permissions:
```typescript
const { role, permissions, checkPermission } = useClubRole({
  userId,
  clubOwnerId,
  isAdmin
});
```

## Types

### Club
```typescript
interface Club {
  id: string;
  club_name: string;
  address: string;
  // ... other properties
}
```

### ClubMember
```typescript
interface ClubMember {
  id: string;
  user_id: string;
  club_id: string;
  // ... other properties
}
```

## Testing
Tests are written using Jest and React Testing Library. Run tests with:
```bash
npm test
```

## Usage Example
```tsx
import { ClubManagement } from '@/features/club';

function App() {
  return (
    <ClubManagement clubId="123" />
  );
}
```

## Development Guidelines

1. Component Organization
- Keep components focused and single-responsibility
- Use common components for shared UI elements
- Implement proper error boundaries

2. State Management
- Use hooks for complex state logic
- Keep state close to where it's used
- Implement proper loading and error states

3. Testing
- Write tests for all new components
- Test edge cases and error scenarios
- Mock external dependencies appropriately

4. Performance
- Implement proper memoization where needed
- Use pagination for large lists
- Optimize re-renders

## Contributing
1. Follow the established directory structure
2. Write comprehensive tests
3. Update documentation for new features
4. Follow TypeScript best practices
