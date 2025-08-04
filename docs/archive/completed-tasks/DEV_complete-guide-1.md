#tags: guide, development, features, consolidated
<!-- Consolidated from: DEV_feature-implementation-guide.md, ENHANCED_ELO_SYSTEM_README.md, CHALLENGE_SYSTEM_README.md, TOURNAMENT_SYSTEM_README.md, FRONTEND_UI_GUIDE.md, USER_DEV_QUICK_GUIDE.md -->

# 🎯 Complete Development Guide

**Comprehensive development guide covering all features and systems - All dev guides merged**

## 🏗️ Project Architecture

### Feature-Based Structure
```
src/
├── features/              # Feature modules
│   ├── tournament/       # Tournament management
│   ├── club/            # CLB system
│   ├── user/            # User management
│   ├── payment/         # VNPAY integration
│   └── ranking/         # ELO system
├── shared/              # Shared components
├── hooks/               # Custom hooks
├── utils/               # Utilities
└── types/               # TypeScript types
```

### Component Organization
```
features/tournament/
├── components/          # UI components
│   ├── TournamentCard.tsx
│   ├── BracketView.tsx
│   └── RegistrationForm.tsx
├── hooks/              # Feature hooks
│   ├── useTournament.ts
│   └── useBracket.ts
├── services/           # API services
│   └── tournamentApi.ts
├── types/              # Feature types
│   └── tournament.types.ts
└── utils/              # Feature utilities
    └── bracketGeneration.ts
```

## 🏆 Tournament System

### Tournament Creation
```typescript
// Tournament creation flow
interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  maxParticipants: number;
  registrationFee: number;
  prizePool: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
}

// Tournament creation hook
export function useTournamentCreation() {
  const [isCreating, setIsCreating] = useState(false);
  
  const createTournament = async (data: CreateTournamentData) => {
    setIsCreating(true);
    try {
      // Validate data
      const validation = validateTournamentData(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create tournament
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          ...data,
          created_by: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Generate bracket if needed
      if (data.autoGenerateBracket) {
        await generateTournamentBracket(tournament.id, data.format);
      }

      return tournament;
    } finally {
      setIsCreating(false);
    }
  };

  return { createTournament, isCreating };
}
```

### Bracket Generation
```typescript
// Single elimination bracket generation
export function generateSingleEliminationBracket(players: Player[]): Bracket {
  const totalPlayers = players.length;
  const nearestPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
  const byes = nearestPowerOf2 - totalPlayers;

  // Shuffle players for random seeding
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  
  // Create initial round
  const matches: Match[] = [];
  let matchId = 1;

  // Add bye matches first
  for (let i = 0; i < byes; i++) {
    matches.push({
      id: matchId++,
      round: 1,
      player1: shuffledPlayers[i],
      player2: null, // Bye
      winner: shuffledPlayers[i], // Auto-advance
      status: 'completed'
    });
  }

  // Add regular matches
  for (let i = byes; i < shuffledPlayers.length; i += 2) {
    matches.push({
      id: matchId++,
      round: 1,
      player1: shuffledPlayers[i],
      player2: shuffledPlayers[i + 1] || null,
      winner: null,
      status: 'pending'
    });
  }

  // Generate subsequent rounds
  const totalRounds = Math.log2(nearestPowerOf2);
  const bracket: Bracket = {
    id: uuid(),
    tournamentId: '',
    format: 'single_elimination',
    rounds: [{ round: 1, matches }]
  };

  // Create empty rounds
  for (let round = 2; round <= totalRounds; round++) {
    const previousRoundMatches = bracket.rounds[round - 2].matches;
    const roundMatches: Match[] = [];

    for (let i = 0; i < previousRoundMatches.length; i += 2) {
      roundMatches.push({
        id: matchId++,
        round,
        player1: null, // Will be filled when previous matches complete
        player2: null,
        winner: null,
        status: 'pending',
        parentMatches: [previousRoundMatches[i].id, previousRoundMatches[i + 1]?.id].filter(Boolean)
      });
    }

    bracket.rounds.push({ round, matches: roundMatches });
  }

  return bracket;
}

// Double elimination bracket
export function generateDoubleEliminationBracket(players: Player[]): Bracket {
  // Winner's bracket (same as single elimination)
  const winnersBracket = generateSingleEliminationBracket(players);
  
  // Loser's bracket (more complex)
  const losersBracket = generateLosersBracket(players.length);
  
  return {
    id: uuid(),
    tournamentId: '',
    format: 'double_elimination',
    winnersBracket,
    losersBracket,
    grandFinal: {
      id: uuid(),
      round: 'grand_final',
      player1: null, // Winner of winner's bracket
      player2: null, // Winner of loser's bracket
      winner: null,
      status: 'pending'
    }
  };
}
```

## 📊 ELO Rating System

### ELO Calculation
```typescript
// ELO rating system
interface PlayerRating {
  playerId: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  lastUpdated: Date;
}

export class ELOCalculator {
  private readonly K_FACTOR = 32; // K-factor for rating changes
  private readonly INITIAL_RATING = 1500;

  calculateExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  calculateNewRating(
    currentRating: number,
    expectedScore: number,
    actualScore: number, // 1 for win, 0.5 for draw, 0 for loss
    kFactor: number = this.K_FACTOR
  ): number {
    return Math.round(currentRating + kFactor * (actualScore - expectedScore));
  }

  updateRatings(
    player1: PlayerRating,
    player2: PlayerRating,
    result: 'player1_wins' | 'player2_wins' | 'draw'
  ): { player1NewRating: number; player2NewRating: number } {
    const expected1 = this.calculateExpectedScore(player1.rating, player2.rating);
    const expected2 = this.calculateExpectedScore(player2.rating, player1.rating);

    let actual1: number, actual2: number;
    switch (result) {
      case 'player1_wins':
        actual1 = 1;
        actual2 = 0;
        break;
      case 'player2_wins':
        actual1 = 0;
        actual2 = 1;
        break;
      case 'draw':
        actual1 = 0.5;
        actual2 = 0.5;
        break;
    }

    return {
      player1NewRating: this.calculateNewRating(player1.rating, expected1, actual1),
      player2NewRating: this.calculateNewRating(player2.rating, expected2, actual2)
    };
  }

  // Advanced ELO with volatility and time decay
  calculateAdvancedRating(
    currentRating: number,
    expectedScore: number,
    actualScore: number,
    gamesPlayed: number,
    timeSinceLastGame: number // in days
  ): number {
    // Dynamic K-factor based on games played
    let kFactor = this.K_FACTOR;
    if (gamesPlayed < 30) {
      kFactor = 40; // Higher for new players
    } else if (gamesPlayed > 300) {
      kFactor = 16; // Lower for experienced players
    }

    // Time decay factor (slight rating regression to mean)
    const decayFactor = Math.min(timeSinceLastGame / 365, 0.1); // Max 10% decay per year
    const timeAdjustedRating = currentRating * (1 - decayFactor) + this.INITIAL_RATING * decayFactor;

    return this.calculateNewRating(timeAdjustedRating, expectedScore, actualScore, kFactor);
  }
}

// ELO hook for components
export function useELOSystem() {
  const calculator = new ELOCalculator();
  
  const updatePlayerRatings = async (
    matchId: string,
    player1Id: string,
    player2Id: string,
    result: 'player1_wins' | 'player2_wins' | 'draw'
  ) => {
    // Fetch current ratings
    const { data: ratings } = await supabase
      .from('player_ratings')
      .select('*')
      .in('player_id', [player1Id, player2Id]);

    const player1Rating = ratings.find(r => r.player_id === player1Id);
    const player2Rating = ratings.find(r => r.player_id === player2Id);

    // Calculate new ratings
    const { player1NewRating, player2NewRating } = calculator.updateRatings(
      player1Rating,
      player2Rating,
      result
    );

    // Update database
    await Promise.all([
      supabase
        .from('player_ratings')
        .update({
          rating: player1NewRating,
          games_played: player1Rating.games_played + 1,
          wins: result === 'player1_wins' ? player1Rating.wins + 1 : player1Rating.wins,
          losses: result === 'player2_wins' ? player1Rating.losses + 1 : player1Rating.losses
        })
        .eq('player_id', player1Id),
      
      supabase
        .from('player_ratings')
        .update({
          rating: player2NewRating,
          games_played: player2Rating.games_played + 1,
          wins: result === 'player2_wins' ? player2Rating.wins + 1 : player2Rating.wins,
          losses: result === 'player1_wins' ? player2Rating.losses + 1 : player2Rating.losses
        })
        .eq('player_id', player2Id)
    ]);

    // Record rating history
    await supabase
      .from('rating_history')
      .insert([
        {
          player_id: player1Id,
          match_id: matchId,
          old_rating: player1Rating.rating,
          new_rating: player1NewRating,
          change: player1NewRating - player1Rating.rating
        },
        {
          player_id: player2Id,
          match_id: matchId,
          old_rating: player2Rating.rating,
          new_rating: player2NewRating,
          change: player2NewRating - player2Rating.rating
        }
      ]);
  };

  return { updatePlayerRatings, calculator };
}
```

## 🎮 Challenge System

### Challenge Creation & Management
```typescript
// Challenge system for CLB
interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  clubId: string;
  type: 'casual' | 'ranked' | 'tournament_qualifier';
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  scheduledTime?: Date;
  stakes?: number; // Optional betting amount
  rules?: string;
  createdAt: Date;
}

export function useChallengeSystem() {
  const createChallenge = async (data: CreateChallengeData) => {
    // Validate challenge rules
    const validation = await validateChallenge(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check player availability
    const availability = await checkPlayerAvailability(
      data.challengedId,
      data.scheduledTime
    );
    if (!availability.available) {
      throw new Error(`Player not available: ${availability.reason}`);
    }

    // Create challenge
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        ...data,
        challenger_id: user.id,
        status: 'pending',
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to challenged player
    await sendChallengeNotification(challenge);

    return challenge;
  };

  const acceptChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from('challenges')
      .update({ status: 'accepted' })
      .eq('id', challengeId)
      .eq('challenged_id', user.id); // Ensure only challenged player can accept

    if (error) throw error;

    // Create match record
    await createMatchFromChallenge(challengeId);
  };

  const declineChallenge = async (challengeId: string, reason?: string) => {
    const { error } = await supabase
      .from('challenges')
      .update({ 
        status: 'declined',
        decline_reason: reason 
      })
      .eq('id', challengeId)
      .eq('challenged_id', user.id);

    if (error) throw error;
  };

  return { createChallenge, acceptChallenge, declineChallenge };
}

// Challenge validation
async function validateChallenge(data: CreateChallengeData): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check if challenging self
  if (data.challengerId === data.challengedId) {
    errors.push('Cannot challenge yourself');
  }

  // Check club membership
  const { data: memberships } = await supabase
    .from('club_members')
    .select('*')
    .eq('club_id', data.clubId)
    .in('user_id', [data.challengerId, data.challengedId]);

  if (memberships.length !== 2) {
    errors.push('Both players must be members of the club');
  }

  // Check for existing pending challenges
  const { data: existingChallenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('challenger_id', data.challengerId)
    .eq('challenged_id', data.challengedId)
    .eq('status', 'pending');

  if (existingChallenges.length > 0) {
    errors.push('Challenge already exists between these players');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 🎨 Frontend UI Components

### Reusable Component Library
```typescript
// Tournament Card Component
interface TournamentCardProps {
  tournament: Tournament;
  onRegister?: (tournamentId: string) => void;
  onView?: (tournamentId: string) => void;
  showActions?: boolean;
}

export function TournamentCard({ 
  tournament, 
  onRegister, 
  onView, 
  showActions = true 
}: TournamentCardProps) {
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    checkRegistrationStatus();
  }, [tournament.id, user?.id]);

  const checkRegistrationStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('user_id', user.id)
      .single();

    setIsRegistered(!!data);
  };

  const handleRegister = async () => {
    if (!user || !onRegister) return;
    
    try {
      await onRegister(tournament.id);
      setIsRegistered(true);
      toast.success('Successfully registered for tournament!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {tournament.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            tournament.status === 'open' ? 'bg-green-100 text-green-800' :
            tournament.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {tournament.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>{format(new Date(tournament.startDate), 'PPP')}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <UsersIcon className="w-4 h-4 mr-2" />
            <span>{tournament.currentParticipants}/{tournament.maxParticipants} players</span>
          </div>
          
          {tournament.registrationFee > 0 && (
            <div className="flex items-center text-gray-600">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              <span>{formatCurrency(tournament.registrationFee)}</span>
            </div>
          )}
        </div>

        {tournament.description && (
          <p className="text-gray-600 mb-4">{tournament.description}</p>
        )}

        {showActions && tournament.status === 'open' && (
          <div className="flex space-x-2">
            <Button
              onClick={handleRegister}
              disabled={isRegistered || tournament.currentParticipants >= tournament.maxParticipants}
              className="flex-1"
            >
              {isRegistered ? 'Registered' : 'Register'}
            </Button>
            
            {onView && (
              <Button variant="outline" onClick={() => onView(tournament.id)}>
                View Details
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Bracket Visualization Component
interface BracketViewProps {
  bracket: Bracket;
  onMatchClick?: (match: Match) => void;
  editable?: boolean;
}

export function BracketView({ bracket, onMatchClick, editable = false }: BracketViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    onMatchClick?.(match);
  };

  return (
    <div className="bracket-container overflow-x-auto">
      <div className="bracket-grid" style={{ 
        gridTemplateColumns: `repeat(${bracket.rounds.length}, 1fr)`,
        gap: '2rem',
        minWidth: `${bracket.rounds.length * 300}px`
      }}>
        {bracket.rounds.map((round, roundIndex) => (
          <div key={round.round} className="round-column">
            <h3 className="text-center font-semibold mb-4">
              {roundIndex === bracket.rounds.length - 1 ? 'Final' : `Round ${round.round}`}
            </h3>
            
            <div className="matches-container space-y-4">
              {round.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => handleMatchClick(match)}
                  selected={selectedMatch?.id === match.id}
                  editable={editable}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔧 Development Utilities

### Custom Hooks
```typescript
// Form handling hook
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validate = (fieldName?: keyof T) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    
    const fieldsToValidate = fieldName ? [fieldName] : Object.keys(validationRules);
    
    fieldsToValidate.forEach((field) => {
      const value = values[field as keyof T];
      const rules = validationRules[field as keyof T];
      
      if (rules) {
        const error = validateField(value, rules);
        if (error) {
          newErrors[field as keyof T] = error;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validate(name);
    }
  };

  const setTouched = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validate(name);
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    isValid: Object.keys(errors).length === 0
  };
}

// API hook with caching
export function useAPIData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    staleTime?: number;
  } = {}
) {
  return useQuery({
    queryKey: [key],
    queryFn: fetcher,
    enabled: options.enabled ?? true,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
  });
}
```

## 📱 Responsive Design

### Mobile-First Approach
```css
/* Tailwind responsive utilities */
.tournament-card {
  @apply p-4 md:p-6;
  @apply text-sm md:text-base;
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
}

.bracket-view {
  @apply overflow-x-auto;
  @apply min-h-screen md:min-h-0;
}

/* Mobile navigation */
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 md:hidden;
  @apply bg-white border-t border-gray-200;
  @apply flex justify-around py-2;
}
```

## 🧪 Testing Strategies

### Component Testing
```typescript
// Component test example
describe('TournamentCard', () => {
  const mockTournament = {
    id: '1',
    name: 'Test Tournament',
    status: 'open',
    maxParticipants: 16,
    currentParticipants: 8,
    registrationFee: 100000
  };

  it('renders tournament information', () => {
    render(<TournamentCard tournament={mockTournament} />);
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('8/16 players')).toBeInTheDocument();
  });

  it('handles registration', async () => {
    const mockRegister = jest.fn();
    render(<TournamentCard tournament={mockTournament} onRegister={mockRegister} />);
    
    fireEvent.click(screen.getByText('Register'));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('1');
    });
  });
});
```

---

**Development Guide Status**: ✅ Complete  
**Architecture**: Feature-based, modular, scalable  
**Last Updated**: August 2025
