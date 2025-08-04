# 🗄️ Database & API Guide

**Everything you need to know about data layer**

## 🗄️ Database Schema (Supabase)

### Core Tables

```sql
-- Users & Authentication
users (auth.users)         # User accounts via Supabase Auth
profiles                   # Extended user profiles
user_settings             # User preferences

-- Tournament System  
tournaments               # Tournament definitions
tournament_brackets       # Bracket structures
tournament_matches        # Individual matches
tournament_registrations  # Player registrations

-- CLB Management
clubs                     # Club information
club_members             # Membership records
club_tables              # Table management
club_challenges          # Challenge system

-- ELO System
player_ratings           # Current ELO ratings
rating_history          # Historical rating changes
season_stats            # Performance statistics

-- Payment System (VNPAY)
payment_transactions    # Payment records
tournament_fees         # Fee structures
prize_distributions     # Winnings tracking
```

### Key Relationships

```sql
users → profiles (1:1)
tournaments → tournament_registrations (1:N)
clubs → club_members (1:N)
players → player_ratings (1:1)
tournaments → payment_transactions (1:N)
```

## 🔌 API Endpoints

### Authentication
```
POST /auth/login          # User login
POST /auth/register       # User registration  
POST /auth/logout         # Logout
GET  /auth/user           # Current user info
```

### Tournaments
```
GET    /api/tournaments                    # List tournaments
POST   /api/tournaments                    # Create tournament
GET    /api/tournaments/:id                # Tournament details
PUT    /api/tournaments/:id                # Update tournament
DELETE /api/tournaments/:id                # Delete tournament
POST   /api/tournaments/:id/register       # Register for tournament
GET    /api/tournaments/:id/brackets       # Bracket data
POST   /api/tournaments/:id/matches/:matchId/score  # Submit score
```

### CLB Management
```
GET    /api/clubs                         # List clubs
POST   /api/clubs                         # Create club
GET    /api/clubs/:id                     # Club details
GET    /api/clubs/:id/members             # Club members
POST   /api/clubs/:id/challenges          # Create challenge
GET    /api/clubs/:id/tables              # Table availability
```

### ELO & Rankings
```
GET    /api/rankings                      # Global leaderboard
GET    /api/players/:id/rating            # Player rating
GET    /api/players/:id/history           # Rating history
POST   /api/matches/:id/result            # Submit match result
```

### Payments (VNPAY)
```
POST   /api/payments/create               # Create payment
GET    /api/payments/:id/status           # Payment status
POST   /api/payments/webhook              # VNPAY webhook
GET    /api/payments/user/:id             # User payment history
```

## 🔄 Real-time Features

### Supabase Subscriptions
```typescript
// Tournament updates
supabase.channel('tournaments')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' })

// Live scoring  
supabase.channel('matches')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournament_matches' })

// Chat/notifications
supabase.channel('user_notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' })
```

## 🔒 Security & Permissions

### Row Level Security (RLS)
```sql
-- Users can only see their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Tournament access control
CREATE POLICY "Public tournaments visible" ON tournaments  
  FOR SELECT USING (status = 'public');

-- Club member access
CREATE POLICY "Members can view club data" ON club_members
  FOR SELECT USING (user_id = auth.uid());
```

## 📊 Performance Tips

### Optimization
- Use indexes on frequently queried columns
- Implement pagination for large datasets  
- Cache static data with React Query
- Use Supabase Edge Functions for complex operations

### Monitoring
- Database performance via Supabase dashboard
- API response times with logging
- Real-time connection health checks

## 🆘 Common Issues

**Database Connection**
```bash
# Check connection
npm run db:push
```

**API Errors**
```bash
# Test endpoints
npm run test:api
```

**Real-time Issues**
```typescript
// Check subscription status
const status = supabase.realtime.status
```

---

**Need help?** See [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)
