
-- Coaching system tables
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    certification_level VARCHAR(50), -- beginner, intermediate, advanced, professional
    specializations TEXT[], -- 8_ball, 9_ball, snooker, technique, mental_game
    experience_years INTEGER,
    hourly_rate INTEGER,
    bio TEXT,
    achievements TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    available_times JSONB, -- Weekly schedule
    status VARCHAR(20) DEFAULT 'active',
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES coaches(id),
    student_id UUID REFERENCES auth.users(id),
    session_type VARCHAR(50), -- individual, group, online, in_person
    club_id UUID REFERENCES clubs(id),
    session_date TIMESTAMP NOT NULL,
    duration_hours DECIMAL(3,1),
    hourly_rate INTEGER,
    total_cost INTEGER,
    focus_areas TEXT[], -- technique, strategy, mental_game, specific_shots
    session_notes TEXT,
    homework TEXT,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES coaches(id),
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    skill_level VARCHAR(50), -- beginner, intermediate, advanced
    duration_weeks INTEGER,
    sessions_per_week INTEGER,
    total_cost INTEGER,
    curriculum JSONB, -- Detailed lesson plan
    max_students INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Live streaming tables
CREATE TABLE live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    streamer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    stream_type VARCHAR(50), -- tournament, practice, coaching, casual
    tournament_id UUID REFERENCES tournaments(id),
    match_id UUID,
    stream_url TEXT,
    thumbnail_url TEXT,
    viewer_count INTEGER DEFAULT 0,
    max_viewers INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, ended
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stream_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp_seconds INTEGER, -- Position in stream
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE video_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    category VARCHAR(50), -- trick_shot, tutorial, match_highlight, funny
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Match analytics tables
CREATE TABLE match_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID, -- Tournament or challenge match
    player_id UUID REFERENCES auth.users(id),
    total_shots INTEGER DEFAULT 0,
    successful_shots INTEGER DEFAULT 0,
    safety_shots INTEGER DEFAULT 0,
    break_shots INTEGER DEFAULT 0,
    longest_run INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,
    time_at_table_seconds INTEGER DEFAULT 0,
    average_shot_time DECIMAL(5,2),
    pressure_situations INTEGER DEFAULT 0,
    pressure_success INTEGER DEFAULT 0,
    match_duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shot_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID,
    player_id UUID REFERENCES auth.users(id),
    shot_number INTEGER,
    shot_type VARCHAR(50), -- pot, safety, break, jump, masse
    target_ball INTEGER,
    pocket VARCHAR(20), -- corner_top_left, side_right, etc.
    success BOOLEAN,
    difficulty_rating INTEGER, -- 1-10
    shot_time_seconds DECIMAL(5,2),
    cue_ball_position JSONB, -- {x: 100, y: 200}
    object_ball_position JSONB,
    result_position JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Community events tables
CREATE TABLE community_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(50), -- meetup, workshop, exhibition, charity
    title VARCHAR(255) NOT NULL,
    description TEXT,
    venue_id UUID REFERENCES clubs(id),
    event_date TIMESTAMP NOT NULL,
    duration_hours DECIMAL(3,1),
    max_participants INTEGER,
    entry_fee INTEGER DEFAULT 0,
    skill_level VARCHAR(50), -- all_levels, beginner, intermediate, advanced
    tags TEXT[],
    featured_image TEXT,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT NOW(),
    attendance_status VARCHAR(20) DEFAULT 'registered', -- registered, attended, no_show
    feedback_rating INTEGER,
    feedback_text TEXT,
    UNIQUE(event_id, user_id)
);

-- Marketplace tables (from previous request)
CREATE TABLE marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- cue_stick, case, chalk, accessories, table
    condition VARCHAR(20), -- new, like_new, good, fair, poor
    price INTEGER NOT NULL,
    original_price INTEGER,
    brand VARCHAR(100),
    model VARCHAR(100),
    specifications JSONB,
    images TEXT[],
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- active, sold, reserved, inactive
    views_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE marketplace_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES marketplace_items(id),
    buyer_id UUID REFERENCES auth.users(id),
    seller_id UUID REFERENCES auth.users(id),
    transaction_amount INTEGER NOT NULL,
    commission_amount INTEGER DEFAULT 0,
    payment_method VARCHAR(50),
    delivery_method VARCHAR(50), -- pickup, shipping, meetup
    delivery_address TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, shipped, completed, cancelled
    tracking_number VARCHAR(100),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE marketplace_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES marketplace_transactions(id),
    reviewer_id UUID REFERENCES auth.users(id),
    reviewee_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type VARCHAR(20), -- buyer_to_seller, seller_to_buyer
    created_at TIMESTAMP DEFAULT NOW()
);

-- Referral and loyalty tables
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, rewarded
    reward_type VARCHAR(50), -- free_month, bonus_points, cash_reward
    reward_amount INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    rewarded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES referrals(id),
    reward_type VARCHAR(50),
    reward_value INTEGER,
    description TEXT,
    claimed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50), -- earned, spent, expired
    source VARCHAR(100), -- tournament_win, daily_login, referral, purchase
    description TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50), -- discount, free_month, merchandise, tournament_entry
    reward_value INTEGER,
    stock_quantity INTEGER DEFAULT -1, -- -1 for unlimited
    active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table bookings
CREATE TABLE table_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(3,1),
    total_cost INTEGER,
    discount_applied INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled, completed
    payment_status VARCHAR(20) DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE club_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    table_type VARCHAR(50), -- 8_ball, 9_ball, snooker, carom
    status VARCHAR(20) DEFAULT 'available', -- available, occupied, maintenance
    hourly_rate INTEGER,
    features JSONB, -- {"lighting": "LED", "cloth": "Simonis", "size": "9ft"}
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, table_number)
);
