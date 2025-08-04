# 🗄️ SABO Pool Arena Hub - Database Schema Documentation

## Overview

The application uses **Supabase PostgreSQL** with Row Level Security (RLS) policies for data protection and real-time capabilities.

**Project ID**: `knxevbkkkiadgppxbphh`

## 🏗️ Core Tables

### 1. User Management

#### `profiles`
User profile information and system roles.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- References auth.users
  full_name TEXT,
  display_name TEXT,
  nickname TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio VARCHAR,
  city TEXT,
  district TEXT,
  role TEXT DEFAULT 'player', -- 'player', 'club_owner', 'both'
  active_role TEXT DEFAULT 'player',
  skill_level TEXT DEFAULT 'beginner',
  verified_rank TEXT,
  is_admin BOOLEAN DEFAULT false,
  ban_status TEXT DEFAULT 'active',
  ban_reason TEXT,
  ban_expires_at TIMESTAMPTZ,
  member_since TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Features:**
- Auto-admin assignment for specific phones/emails
- Role-based access control
- Ban management system
- Profile verification tracking

### 2. Club Management

#### `club_profiles`
Club information and verification status.

```sql
CREATE TABLE club_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  club_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  operating_hours JSONB,
  number_of_tables INTEGER DEFAULT 1,
  verification_status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `club_registrations`
Club registration applications and approval workflow.

```sql
CREATE TABLE club_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  club_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  table_count INTEGER NOT NULL,
  table_types TEXT[] NOT NULL,
  basic_price NUMERIC NOT NULL,
  normal_hour_price NUMERIC,
  peak_hour_price NUMERIC,
  weekend_price NUMERIC,
  vip_table_price NUMERIC,
  amenities JSONB DEFAULT '{}',
  photos TEXT[],
  business_license_url TEXT,
  google_maps_url TEXT,
  facebook_url TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'rejected'
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Tournament System

#### `tournaments`
Tournament management with registration and bracket support.

```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  club_id UUID,
  format TEXT DEFAULT 'single_elimination',
  max_participants INTEGER DEFAULT 32,
  current_participants INTEGER DEFAULT 0,
  entry_fee NUMERIC DEFAULT 0,
  prize_pool NUMERIC DEFAULT 0,
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  tournament_start TIMESTAMPTZ,
  tournament_end TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  rules JSONB DEFAULT '{}',
  brackets JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `tournament_registrations`
Player tournament registrations.

```sql
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  player_id UUID NOT NULL,
  registration_status TEXT DEFAULT 'pending',
  registration_fee_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Match & Challenge System

#### `matches`
Match records with scoring and tournament linking.

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL,
  player2_id UUID NOT NULL,
  winner_id UUID,
  club_id UUID,
  tournament_id UUID,
  challenge_id UUID,
  score_player1 INTEGER DEFAULT 0,
  score_player2 INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `challenges`
Player challenge system with betting and expiration.

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  club_id UUID,
  message TEXT,
  bet_points INTEGER DEFAULT 0,
  stake_type TEXT DEFAULT 'friendly',
  stake_amount NUMERIC DEFAULT 0,
  race_to INTEGER DEFAULT 5,
  location TEXT,
  scheduled_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '48 hours'),
  handicap_05_rank INTEGER DEFAULT 0,
  handicap_1_rank INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. Ranking System

#### `player_rankings`
ELO and SPA points with rank tracking.

```sql
CREATE TABLE player_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID,
  current_rank_id UUID,
  rank_points NUMERIC DEFAULT 0,
  spa_points INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  tournament_wins INTEGER DEFAULT 0,
  daily_challenges INTEGER DEFAULT 0,
  season_start DATE DEFAULT CURRENT_DATE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `ranks`
Rank definitions and requirements.

```sql
CREATE TABLE ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  min_points INTEGER DEFAULT 0,
  max_points INTEGER,
  color TEXT DEFAULT '#gray',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. Notification System

#### `notifications`
System-wide notification management.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sender_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 7. System Administration

#### `system_logs`
Automation and system event logging.

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `admin_actions`
Admin action audit trail.

```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID NOT NULL,
  action_details JSONB DEFAULT '{}',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔐 Row Level Security (RLS) Policies

### User Access Patterns

#### Public Read Access
- `profiles` - All users can view profiles
- `club_profiles` - All users can view club information
- `tournaments` - Public tournament listings
- `matches` - Public match history

#### User-Specific Access
- `notifications` - Users see only their notifications
- `challenges` - Users manage challenges they're involved in
- `player_rankings` - Users can update their own rankings

#### Admin-Only Access
- `club_registrations` - Admins approve club applications
- `admin_actions` - Admins can view audit logs
- `system_logs` - Admin system monitoring

### Example RLS Policy
```sql
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can manage club registrations
CREATE POLICY "Admins can view all club registrations" 
ON club_registrations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));
```

## 🔄 Database Functions

### Core Functions

#### `create_notification()`
Creates system notifications with proper formatting.

#### `approve_club_registration()`
Handles club approval workflow with notifications.

#### `daily_checkin()`
Manages user check-in streak system.

#### `award_tournament_points()`
Calculates and awards tournament SPA points.

### Automation Functions

#### `reset_daily_challenges()`
Resets daily challenge limits (runs daily).

#### `decay_inactive_spa_points()`
Applies point decay to inactive players (runs weekly).

#### `update_weekly_leaderboard()`
Creates weekly leaderboard snapshots.

#### `automated_season_reset()`
Handles quarterly season resets.

#### `system_health_check()`
Monitors system health and data integrity.

## 📊 Key Views & Materialized Views

### `admin_dashboard_stats`
Materialized view for admin dashboard metrics.

```sql
CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM club_profiles WHERE verification_status = 'approved') as active_clubs,
  (SELECT COUNT(*) FROM tournaments WHERE status = 'active') as active_tournaments,
  (SELECT COUNT(*) FROM matches WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_matches;
```

## 🚀 Performance Optimizations

### Indexes
- User lookup: `profiles(user_id)`
- Match queries: `matches(player1_id, player2_id)`
- Tournament searches: `tournaments(status, club_id)`
- Notification filtering: `notifications(user_id, is_read)`

### Query Patterns
- Use RLS policies for security
- Leverage indexes for common queries
- Use JSONB efficiently for metadata
- Monitor slow query log

## 🔧 Maintenance Tasks

### Daily
- Monitor system logs
- Check automation function execution
- Review error rates

### Weekly
- Update leaderboard snapshots
- Apply point decay
- Clean expired challenges

### Monthly
- Generate user reports
- Archive old data
- Update statistics

### Quarterly
- Season resets
- Data cleanup
- Performance review

## 📈 Monitoring & Alerts

### Key Metrics
- **Query Performance**: Monitor slow queries
- **Connection Pool**: Watch active connections
- **Storage Usage**: Track database size
- **Error Rates**: Monitor failed operations

### Health Checks
- Automation function execution
- RLS policy effectiveness
- Data consistency checks
- Backup verification

---

**Database Schema Complete! 🎯**

This schema supports all current features and is designed for scalability. Regular maintenance and monitoring ensure optimal performance.