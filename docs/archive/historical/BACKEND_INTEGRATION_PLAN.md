# 🔌 Backend Integration Plan for Profile System

## 📋 Overview
Hiện tại UnifiedProfilePage đang sử dụng mock data và một số hooks cơ bản. Chúng ta cần kết nối với backend thực tế để lấy:
- Profile information
- Statistics & performance data  
- Activities & match history
- Achievements & rankings
- SPA Points & wallet data
- Social features data

## 🗄️ Database Schema Analysis

### Current Tables to Leverage:
1. **`profiles`** - Basic user information
2. **`matches`** - Match history and results
3. **`challenges`** - Challenge system data
4. **`tournaments`** - Tournament participation
5. **`clubs`** & **`club_profiles`** - Club-related data
6. **`rankings`** - ELO and ranking data
7. **`achievements`** - User achievements
8. **`spa_points_transactions`** - Points history

### New Tables Needed:
```sql
-- Enhanced profile statistics
CREATE TABLE profile_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  total_matches INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  total_play_time_minutes INTEGER DEFAULT 0,
  average_match_duration DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity feed
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  activity_type VARCHAR(50) NOT NULL, -- 'match', 'achievement', 'rank_change', 'spa_points', 'tournament'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB, -- Store additional data like opponent, score, points earned
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced achievements system
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  achievement_id VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  achievement_category VARCHAR(50), -- 'match', 'tournament', 'social', 'progression'
  earned_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- SPA Points tracking
CREATE TABLE spa_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  points_change INTEGER NOT NULL, -- Can be positive or negative
  current_balance INTEGER NOT NULL,
  transaction_type VARCHAR(50), -- 'match_win', 'tournament_reward', 'purchase', 'bonus'
  description TEXT,
  reference_id UUID, -- Links to match_id, tournament_id, etc.
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔗 API Endpoints to Create/Enhance

### 1. **Enhanced Profile API**
```typescript
// GET /api/profiles/{userId}/complete
interface CompleteProfileResponse {
  profile: {
    id: string;
    user_id: string;
    display_name: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    city?: string;
    district?: string;
    phone?: string;
    skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
    verified_rank?: string;
    role: string;
    active_role: string;
    member_since: string;
    completion_percentage: number;
  };
  statistics: {
    total_matches: number;
    matches_won: number;
    matches_lost: number;
    win_percentage: number;
    current_win_streak: number;
    best_win_streak: number;
    total_play_time_hours: number;
    average_match_duration: number;
    elo_rating: number;
    current_ranking: number;
    weekly_ranking: number;
    monthly_matches: number;
  };
  spa_points: {
    current_balance: number;
    total_earned: number;
    weekly_earned: number;
    rank_in_points: number;
  };
  achievements: {
    total_count: number;
    recent_achievements: Achievement[];
    categories: {
      match: number;
      tournament: number;
      social: number;
      progression: number;
    };
  };
  recent_activities: Activity[];
  club_info?: ClubProfile;
}
```

### 2. **Statistics API**
```typescript
// GET /api/users/{userId}/statistics
// GET /api/users/{userId}/statistics/detailed
// GET /api/users/{userId}/statistics/historical?period=week|month|year
```

### 3. **Activities API**
```typescript
// GET /api/users/{userId}/activities?limit=10&type=all|match|achievement|tournament
// POST /api/users/{userId}/activities (to create new activities)
```

### 4. **Achievements API**
```typescript
// GET /api/users/{userId}/achievements
// GET /api/achievements/definitions (all possible achievements)
// POST /api/users/{userId}/achievements/{achievementId}/unlock
```

### 5. **SPA Points API**
```typescript
// GET /api/users/{userId}/spa-points/balance
// GET /api/users/{userId}/spa-points/history
// GET /api/users/{userId}/spa-points/transactions
```

## 🔨 Implementation Plan

### Phase 1: Database Setup (1-2 days)
1. **Create new tables** for enhanced profile data
2. **Migrate existing data** to new structure
3. **Add indexes** for performance
4. **Create database functions** for common calculations

```sql
-- Example: Function to calculate win percentage
CREATE OR REPLACE FUNCTION calculate_win_percentage(user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_matches INTEGER;
    matches_won INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_matches 
    FROM matches 
    WHERE (player1_id = user_id OR player2_id = user_id) AND status = 'completed';
    
    SELECT COUNT(*) INTO matches_won 
    FROM matches 
    WHERE winner_id = user_id AND status = 'completed';
    
    IF total_matches = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((matches_won::DECIMAL / total_matches::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics after match completion
CREATE OR REPLACE FUNCTION update_profile_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics for both players
    -- Implementation here...
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Phase 2: Backend API Development (2-3 days)
1. **Enhanced profile service**
2. **Statistics calculation service**
3. **Activity tracking service**
4. **Achievement system**
5. **SPA Points management**

### Phase 3: Frontend Integration (1-2 days)
1. **Update hooks to use real APIs**
2. **Add loading states and error handling**
3. **Implement real-time updates**
4. **Cache management**

### Phase 4: Real-time Features (1 day)
1. **WebSocket for live updates**
2. **Activity feed real-time**
3. **Achievement notifications**

## 🔧 Updated Hooks Implementation

### Enhanced useUnifiedProfile Hook
```typescript
// src/hooks/useUnifiedProfile.ts
export const useUnifiedProfile = () => {
  const { user } = useAuth();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['complete-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await fetch(`/api/profiles/${user.id}/complete`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      return response.json() as CompleteProfileResponse;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  return {
    data: data?.profile,
    statistics: data?.statistics,
    spaPoints: data?.spa_points,
    achievements: data?.achievements,
    activities: data?.recent_activities,
    clubInfo: data?.club_info,
    isLoading,
    error,
    refetch
  };
};
```

### New Specialized Hooks
```typescript
// src/hooks/useProfileStatistics.ts
export const useProfileStatistics = (userId?: string) => {
  return useQuery({
    queryKey: ['profile-statistics', userId],
    queryFn: () => fetchProfileStatistics(userId),
    enabled: !!userId,
  });
};

// src/hooks/useUserActivities.ts
export const useUserActivities = (userId?: string, limit = 10) => {
  return useQuery({
    queryKey: ['user-activities', userId, limit],
    queryFn: () => fetchUserActivities(userId, limit),
    enabled: !!userId,
  });
};

// src/hooks/useUserAchievements.ts
export const useUserAchievements = (userId?: string) => {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => fetchUserAchievements(userId),
    enabled: !!userId,
  });
};

// src/hooks/useSpaPoints.ts
export const useSpaPoints = (userId?: string) => {
  return useQuery({
    queryKey: ['spa-points', userId],
    queryFn: () => fetchSpaPoints(userId),
    enabled: !!userId,
  });
};
```

## 🚀 Real-time Updates

### WebSocket Integration
```typescript
// src/hooks/useRealtimeProfile.ts
export const useRealtimeProfile = (userId: string) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`profile-updates:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_statistics',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Invalidate and refetch profile data
        queryClient.invalidateQueries(['complete-profile', userId]);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_activities',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Add new activity to the list
        queryClient.setQueryData(['user-activities', userId], (old: any) => {
          return [payload.new, ...(old || [])].slice(0, 10);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
```

## 📊 Data Flow Architecture

```
[Profile Page] 
    ↓
[useUnifiedProfile Hook]
    ↓
[React Query] → [Cache Management]
    ↓
[API Service Layer]
    ↓
[Supabase Client]
    ↓
[Database] ← [Real-time Subscriptions]
    ↑
[Background Jobs] (Statistics calculation, Achievement checking)
```

## 🔍 Performance Optimizations

### 1. **Caching Strategy**
```typescript
// Stale-while-revalidate pattern
const cacheConfig = {
  profile: { staleTime: 5 * 60 * 1000 }, // 5 minutes
  statistics: { staleTime: 2 * 60 * 1000 }, // 2 minutes  
  activities: { staleTime: 1 * 60 * 1000 }, // 1 minute
  achievements: { staleTime: 10 * 60 * 1000 }, // 10 minutes
};
```

### 2. **Database Indexes**
```sql
-- Critical indexes for performance
CREATE INDEX idx_matches_player_status ON matches(player1_id, player2_id, status);
CREATE INDEX idx_activities_user_created ON user_activities(user_id, created_at DESC);
CREATE INDEX idx_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_spa_points_user_created ON spa_points_history(user_id, created_at DESC);
```

### 3. **Background Jobs**
```typescript
// Cron jobs to update statistics
// - Daily: Recalculate all user statistics
// - Hourly: Update rankings
// - Real-time: Achievement checking after match completion
```

## 📋 Implementation Checklist

### Database & Backend
- [ ] Create enhanced profile tables
- [ ] Set up database functions and triggers
- [ ] Implement API endpoints
- [ ] Add proper validation and error handling
- [ ] Set up background jobs for statistics
- [ ] Create real-time subscriptions

### Frontend Integration  
- [ ] Update useUnifiedProfile hook
- [ ] Create specialized hooks for different data types
- [ ] Add proper loading and error states
- [ ] Implement real-time updates
- [ ] Add optimistic updates for better UX
- [ ] Handle offline scenarios

### Testing & Performance
- [ ] Unit tests for hooks and services
- [ ] Integration tests for APIs
- [ ] Performance testing with large datasets
- [ ] Cache invalidation testing
- [ ] Real-time update testing

### Monitoring & Analytics
- [ ] Add logging for API calls
- [ ] Monitor query performance
- [ ] Track user engagement metrics
- [ ] Set up error reporting

## 🎯 Expected Results

Sau khi hoàn thành integration:
- ✅ **Real data** thay vì mock data
- ✅ **Real-time updates** khi có thay đổi
- ✅ **Performance tối ưu** với caching
- ✅ **Scalable architecture** cho future features
- ✅ **Rich user experience** với detailed statistics

## 🔄 Migration Strategy

1. **Parallel development** - Keep mock data while building real APIs
2. **Feature flags** - Gradually enable real data for different sections
3. **A/B testing** - Compare performance between mock and real data
4. **Gradual rollout** - Enable for small user groups first

Bạn muốn tôi bắt đầu implement phần nào trước? Database setup, API development, hay frontend integration?
