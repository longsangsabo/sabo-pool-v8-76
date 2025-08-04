-- Create demo users for testing
INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at, 
    confirmation_token, 
    email_change, 
    email_change_token_new, 
    recovery_token
) VALUES 
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'admin@sabopool.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'user1@sabopool.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'user2@sabopool.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Create corresponding profiles
INSERT INTO public.profiles (
    user_id,
    full_name,
    display_name,
    email,
    phone,
    role,
    skill_level,
    verified_rank,
    city,
    district,
    bio,
    is_admin,
    ban_status,
    created_at,
    updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Admin User',
    'Administrator',
    'admin@sabopool.com',
    '+84901234567',
    'admin',
    'expert',
    'Master',
    'Hồ Chí Minh',
    'Quận 1',
    'System administrator for SABO Pool Arena',
    true,
    'active',
    NOW(),
    NOW()
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Nguyễn Văn A',
    'Player A',
    'user1@sabopool.com',
    '+84901234568',
    'player',
    'intermediate',
    'C',
    'Hồ Chí Minh',
    'Quận 3',
    'Passionate pool player',
    false,
    'active',
    NOW(),
    NOW()
),
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Trần Thị B',
    'Player B',
    'user2@sabopool.com',
    '+84901234569',
    'player',
    'beginner',
    'D',
    'Hà Nội',
    'Hoàn Kiếm',
    'New to billiards but eager to learn',
    false,
    'active',
    NOW(),
    NOW()
);

-- Create some player rankings
INSERT INTO public.player_rankings (
    user_id,
    spa_points,
    elo_points,
    rank,
    wins,
    losses,
    total_matches,
    created_at,
    updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    1500,
    1800,
    'Master',
    50,
    10,
    60,
    NOW(),
    NOW()
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    800,
    1400,
    'C',
    20,
    15,
    35,
    NOW(),
    NOW()
),
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    200,
    1100,
    'D',
    5,
    8,
    13,
    NOW(),
    NOW()
);

-- Create a demo club
INSERT INTO public.clubs (
    id,
    name,
    address,
    phone,
    email,
    owner_id,
    description,
    table_count,
    price_per_hour,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'SABO Pool Arena Demo',
    '123 Demo Street, District 1, Ho Chi Minh City',
    '+84901234570',
    'demo@sabopool.com',
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Demo club for testing purposes',
    10,
    50000,
    true,
    NOW(),
    NOW()
);

SELECT 'Demo data created successfully!' as result;
