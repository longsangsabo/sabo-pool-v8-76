# 🔄 Hướng Dẫn Quản Lý State Nâng Cao

## 🏗️ Kiến Trúc State Management

Dự án SABO Pool Arena sử dụng kết hợp nhiều phương pháp quản lý state để tối ưu hiệu suất và trải nghiệm phát triển:

1. **React Query**: Quản lý server state (data fetching, caching, synchronization)
2. **Context API**: Quản lý UI state và feature-specific state
3. **React Hook Form**: Quản lý form state
4. **Local State**: useState/useReducer cho component-specific state

## 📊 Server State Management

### React Query Configuration

```tsx
// src/core/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### Custom Query Hooks

```tsx
// src/features/tournament/hooks/useTournaments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTournaments() {
  const queryClient = useQueryClient();

  const tournamentsQuery = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (newTournament) => {
      const { data, error } = await supabase
        .from('tournaments')
        .insert(newTournament)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });

  return {
    tournaments: tournamentsQuery.data || [],
    isLoading: tournamentsQuery.isLoading,
    isError: tournamentsQuery.isError,
    error: tournamentsQuery.error,
    createTournament: createTournamentMutation.mutate,
    isCreating: createTournamentMutation.isPending,
  };
}
```

### Optimistic Updates

```tsx
// src/features/challenge/hooks/useChallenges.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useOptimisticChallenges() {
  const queryClient = useQueryClient();

  const acceptChallengeMutation = useMutation({
    mutationFn: async (challengeId) => {
      // API call to accept challenge
    },
    // Optimistic update
    onMutate: async (challengeId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['challenges'] });

      // Snapshot the previous value
      const previousChallenges = queryClient.getQueryData(['challenges']);

      // Optimistically update the cache
      queryClient.setQueryData(['challenges'], (old) => {
        return old.map(challenge => 
          challenge.id === challengeId 
            ? { ...challenge, status: 'accepted' } 
            : challenge
        );
      });

      return { previousChallenges };
    },
    onError: (err, challengeId, context) => {
      // Roll back on error
      queryClient.setQueryData(
        ['challenges'], 
        context.previousChallenges
      );
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    }
  });

  return { acceptChallenge: acceptChallengeMutation.mutate };
}
```

## 🧩 UI State Management

### Feature-Specific Context

```tsx
// src/features/admin/contexts/AdminPanelContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
type State = {
  activeSection: string;
  isDrawerOpen: boolean;
};

type Action = 
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'TOGGLE_DRAWER' }
  | { type: 'SET_DRAWER_STATE'; payload: boolean };

// Context
const AdminPanelContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

// Initial state
const initialState: State = {
  activeSection: 'dashboard',
  isDrawerOpen: false,
};

// Reducer
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };
    case 'TOGGLE_DRAWER':
      return { ...state, isDrawerOpen: !state.isDrawerOpen };
    case 'SET_DRAWER_STATE':
      return { ...state, isDrawerOpen: action.payload };
    default:
      return state;
  }
}

// Provider
export function AdminPanelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AdminPanelContext.Provider value={{ state, dispatch }}>
      {children}
    </AdminPanelContext.Provider>
  );
}

// Hook
export function useAdminPanel() {
  const context = useContext(AdminPanelContext);
  if (!context) {
    throw new Error('useAdminPanel must be used within AdminPanelProvider');
  }
  return context;
}
```

### Using the Context

```tsx
// src/features/admin/components/AdminSidebar.tsx
import { useAdminPanel } from '../contexts/AdminPanelContext';

export function AdminSidebar() {
  const { state, dispatch } = useAdminPanel();

  const setActiveSection = (section: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: section });
  };

  return (
    <nav>
      {/* Navigation items */}
      <button 
        className={state.activeSection === 'dashboard' ? 'active' : ''}
        onClick={() => setActiveSection('dashboard')}
      >
        Dashboard
      </button>
      {/* Other navigation items */}
    </nav>
  );
}
```

## 📝 Form State Management

### React Hook Form

```tsx
// src/features/club/components/ClubSettingsForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Form schema
const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
});

type FormValues = z.infer<typeof formSchema>;

export function ClubSettingsForm({ onSubmit, defaultValues }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const submitHandler = async (data: FormValues) => {
    await onSubmit(data);
    reset(data);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)}>
      <div>
        <label htmlFor="name">Club Name</label>
        <input id="name" {...register('name')} />
        {errors.name && <p className="error">{errors.name.message}</p>}
      </div>
      
      {/* Other form fields */}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

## 🔄 Advanced State Management with Zustand (Recommended)

### Store Setup

```tsx
// src/features/tournament/stores/tournamentStore.ts
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

type Tournament = {
  id: string;
  name: string;
  // other fields...
};

interface TournamentState {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTournaments: () => Promise<void>;
  setActiveTournament: (id: string) => void;
  createTournament: (tournament: Partial<Tournament>) => Promise<Tournament>;
  updateTournament: (id: string, data: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [],
  activeTournamentId: null,
  isLoading: false,
  error: null,
  
  fetchTournaments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw new Error(error.message);
      set({ tournaments: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  setActiveTournament: (id) => set({ activeTournamentId: id }),
  
  createTournament: async (tournament) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert(tournament)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      
      set(state => ({ 
        tournaments: [...state.tournaments, data],
        isLoading: false 
      }));
      
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  updateTournament: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('tournaments')
        .update(data)
        .eq('id', id);
        
      if (error) throw new Error(error.message);
      
      set(state => ({
        tournaments: state.tournaments.map(t => 
          t.id === id ? { ...t, ...data } : t
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  deleteTournament: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);
        
      if (error) throw new Error(error.message);
      
      set(state => ({
        tournaments: state.tournaments.filter(t => t.id !== id),
        activeTournamentId: state.activeTournamentId === id 
          ? null 
          : state.activeTournamentId,
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
```

### Using the Store

```tsx
// src/features/tournament/components/TournamentList.tsx
import { useTournamentStore } from '../stores/tournamentStore';
import { useEffect } from 'react';

export function TournamentList() {
  const { 
    tournaments, 
    isLoading, 
    error, 
    fetchTournaments,
    setActiveTournament
  } = useTournamentStore();
  
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);
  
  if (isLoading) return <div>Loading tournaments...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Tournaments</h2>
      <ul>
        {tournaments.map(tournament => (
          <li 
            key={tournament.id}
            onClick={() => setActiveTournament(tournament.id)}
          >
            {tournament.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🔄 State Orchestration with XState (For Complex Flows)

### State Machine Definition

```tsx
// src/features/challenge/machines/challengeMachine.ts
import { createMachine, assign } from 'xstate';
import { supabase } from '@/integrations/supabase/client';

// Define the context and events
interface ChallengeContext {
  challengeId: string | null;
  challengeData: any | null;
  error: string | null;
}

type ChallengeEvent =
  | { type: 'CREATE'; data: any }
  | { type: 'ACCEPT' }
  | { type: 'REJECT' }
  | { type: 'COMPLETE'; scores: { challenger: number; opponent: number } }
  | { type: 'CANCEL' }
  | { type: 'RETRY' };

export const challengeMachine = createMachine<ChallengeContext, ChallengeEvent>({
  predictableActionArguments: true,
  id: 'challenge',
  initial: 'idle',
  context: {
    challengeId: null,
    challengeData: null,
    error: null,
  },
  states: {
    idle: {
      on: {
        CREATE: {
          target: 'creating',
          actions: assign({
            challengeData: (_, event) => event.data,
          }),
        },
      },
    },
    creating: {
      invoke: {
        src: async (context) => {
          const { data, error } = await supabase
            .from('challenges')
            .insert(context.challengeData)
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        onDone: {
          target: 'pending',
          actions: assign({
            challengeId: (_, event) => event.data.id,
            challengeData: (_, event) => event.data,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: (_, event) => event.data.message,
          }),
        },
      },
    },
    pending: {
      on: {
        ACCEPT: 'accepting',
        REJECT: 'rejecting',
        CANCEL: 'cancelling',
      },
    },
    accepting: {
      invoke: {
        src: async (context) => {
          const { error } = await supabase
            .from('challenges')
            .update({ status: 'accepted' })
            .eq('id', context.challengeId);

          if (error) throw error;
          return true;
        },
        onDone: 'accepted',
        onError: {
          target: 'error',
          actions: assign({
            error: (_, event) => event.data.message,
          }),
        },
      },
    },
    accepted: {
      on: {
        COMPLETE: {
          target: 'completing',
          actions: assign({
            challengeData: (context, event) => ({
              ...context.challengeData,
              scores: event.scores,
            }),
          }),
        },
        CANCEL: 'cancelling',
      },
    },
    completing: {
      invoke: {
        src: async (context) => {
          const { error } = await supabase
            .from('challenges')
            .update({
              status: 'completed',
              challenger_score: context.challengeData.scores.challenger,
              opponent_score: context.challengeData.scores.opponent,
            })
            .eq('id', context.challengeId);

          if (error) throw error;
          return true;
        },
        onDone: 'completed',
        onError: {
          target: 'error',
          actions: assign({
            error: (_, event) => event.data.message,
          }),
        },
      },
    },
    completed: {
      type: 'final',
    },
    rejecting: {
      // Implementation similar to accepting
      // ...
    },
    cancelling: {
      // Implementation similar to accepting
      // ...
    },
    error: {
      on: {
        RETRY: {
          target: 'idle',
          actions: assign({
            error: null,
          }),
        },
      },
    },
  },
});
```

### Using the State Machine with useMachine

```tsx
// src/features/challenge/hooks/useChallengeMachine.tsx
import { useMachine } from '@xstate/react';
import { challengeMachine } from '../machines/challengeMachine';

export function useChallengeMachine() {
  const [state, send] = useMachine(challengeMachine);
  
  return {
    state: state.value,
    context: state.context,
    isCreating: state.matches('creating'),
    isPending: state.matches('pending'),
    isAccepted: state.matches('accepted'),
    isCompleted: state.matches('completed'),
    isError: state.matches('error'),
    errorMessage: state.context.error,
    
    // Actions
    createChallenge: (data) => send({ type: 'CREATE', data }),
    acceptChallenge: () => send({ type: 'ACCEPT' }),
    rejectChallenge: () => send({ type: 'REJECT' }),
    completeChallenge: (scores) => send({ type: 'COMPLETE', scores }),
    cancelChallenge: () => send({ type: 'CANCEL' }),
    retry: () => send({ type: 'RETRY' }),
  };
}
```

## 🔍 Best Practices & Guidelines

1. **Server vs UI State**
   - Keep server and UI state separate
   - Use React Query for all server interactions
   - Use Context or Zustand for UI state

2. **State Colocation**
   - Keep state as close as possible to where it's used
   - Avoid global state for feature-specific concerns

3. **Performance Optimizations**
   - Use `useMemo` and `useCallback` for expensive calculations
   - Implement proper dependency arrays in hooks
   - Memoize components with `React.memo` when appropriate

4. **State Debugging**
   - Use React DevTools for inspecting component state
   - Use React Query DevTools for server state debugging
   - Use Redux DevTools extension with Zustand for global state debugging

5. **Error Handling**
   - Implement proper error boundaries
   - Handle loading and error states in UI
   - Use toast notifications for user feedback
