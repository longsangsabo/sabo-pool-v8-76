import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  current_rank?: string;
  elo?: number;
  skill_level?: string;
  bio?: string;
  is_demo_user?: boolean;
  users?: any[];
  batch_create?: boolean;
  action?: string;
  count?: number;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      email,
      password = 'demo123456',
      full_name,
      phone,
      current_rank = 'K',
      elo = 1000,
      skill_level = 'beginner',
      bio,
      is_demo_user = false,
      users,
      batch_create = false,
      action,
      count = 32,
    }: CreateUserRequest = await req.json();

    // Handle special actions
    if (action === 'cleanup_demo_users') {
      console.log('🧹 Cleaning up demo users...');

      // Get all demo users from auth
      const { data: authUsers, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      // Find demo users by checking profiles
      const { data: demoProfiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('is_demo_user', true);

      const demoUserIds = demoProfiles?.map(p => p.user_id) || [];

      // Delete auth users
      for (const userId of demoUserIds) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          console.log(`Deleted auth user: ${userId}`);
        } catch (error) {
          console.warn(`Failed to delete auth user ${userId}:`, error);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Cleaned up ${demoUserIds.length} demo users`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'reset_database') {
      console.log('🔥 RESETTING DATABASE...');

      // This is extremely dangerous - only for development
      const tablesToReset = [
        'tournament_registrations',
        'tournament_matches',
        'matches',
        'challenges',
        'notifications',
        'spa_points_log',
        'elo_history',
        'player_rankings',
        'profiles',
      ];

      for (const table of tablesToReset) {
        try {
          const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible ID

          if (error) console.warn(`Error resetting ${table}:`, error);
          else console.log(`Reset table: ${table}`);
        } catch (error) {
          console.warn(`Failed to reset ${table}:`, error);
        }
      }

      // Also delete all auth users except service accounts
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      if (authUsers?.users) {
        for (const user of authUsers.users) {
          // Don't delete admin users or service accounts
          if (
            !user.email?.includes('supabase') &&
            !user.email?.includes('admin')
          ) {
            try {
              await supabaseAdmin.auth.admin.deleteUser(user.id);
            } catch (error) {
              console.warn(`Failed to delete user ${user.id}:`, error);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Database reset completed',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle batch demo user creation
    if (action === 'batch_create_demo_users') {
      console.log(`🚀 Creating ${count} demo users...`);

      const vietnamesePrefixes = [
        'Nguyễn',
        'Trần',
        'Lê',
        'Phạm',
        'Hoàng',
        'Huỳnh',
        'Phan',
        'Vũ',
        'Võ',
        'Đặng',
      ];
      const vietnameseFirstNames = [
        'Văn',
        'Thị',
        'Minh',
        'Tuấn',
        'Hương',
        'Lan',
        'Hùng',
        'Linh',
        'Nam',
        'Mai',
      ];
      const vietnameseLastNames = [
        'An',
        'Bình',
        'Cường',
        'Dũng',
        'Hải',
        'Khoa',
        'Long',
        'Phong',
        'Quân',
        'Sơn',
      ];
      const skillLevels = [
        'beginner',
        'intermediate',
        'advanced',
        'professional',
      ];

      const generateVietnameseName = () => {
        const prefix =
          vietnamesePrefixes[
            Math.floor(Math.random() * vietnamesePrefixes.length)
          ];
        const firstName =
          vietnameseFirstNames[
            Math.floor(Math.random() * vietnameseFirstNames.length)
          ];
        const lastName =
          vietnameseLastNames[
            Math.floor(Math.random() * vietnameseLastNames.length)
          ];
        return `${prefix} ${firstName} ${lastName}`;
      };

      const generateEmail = (fullName: string, index: number) => {
        const cleanName = fullName
          .toLowerCase()
          .replace(/\s+/g, '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');
        return `demo${index + 1}.${cleanName}@demo.billiards.vn`;
      };

      const demoUsers = [];
      for (let i = 0; i < count; i++) {
        const fullName = generateVietnameseName();
        const skillLevel =
          skillLevels[Math.floor(Math.random() * skillLevels.length)];
        const elo = 800 + Math.floor(Math.random() * 600); // 800-1400

        demoUsers.push({
          email: generateEmail(fullName, i),
          password: 'Demo123!@#',
          full_name: fullName,
          phone: `096${Math.floor(Math.random() * 10000000)
            .toString()
            .padStart(7, '0')}`,
          skill_level: skillLevel,
          current_rank: 'K',
          elo: elo,
          bio: `Demo user - ${skillLevel} level`,
          is_demo_user: true,
        });
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < demoUsers.length; i++) {
        const userData = demoUsers[i];

        try {
          // Create auth user
          const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
              email: userData.email,
              password: userData.password,
              email_confirm: true,
              user_metadata: {
                full_name: userData.full_name,
              },
            });

          if (authError) throw authError;

          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              full_name: userData.full_name,
              phone: userData.phone,
              verified_rank: userData.current_rank,
              elo: userData.elo,
              skill_level: userData.skill_level,
              bio: userData.bio,
              is_demo_user: userData.is_demo_user,
              email: userData.email,
            });

          if (profileError) throw profileError;

          // Get rank ID for current_rank
          const { data: rankData, error: rankLookupError } = await supabaseAdmin
            .from('ranks')
            .select('id')
            .eq('code', userData.current_rank)
            .single();

          // Create player ranking
          const { error: rankingError } = await supabaseAdmin
            .from('player_rankings')
            .insert({
              user_id: authData.user.id,
              current_rank: userData.current_rank,
              current_rank_id:
                rankData?.id || '8cd47209-05e6-42c7-b8b4-2e59b2cb64e1', // Default to K rank
              elo_points: userData.elo,
              spa_points: 0,
              total_matches: 0,
              wins: 0,
              losses: 0,
              win_streak: 0,
            });

          if (rankingError) throw rankingError;

          results.push({
            email: userData.email,
            user_id: authData.user.id,
            success: true,
          });

          console.log(
            `✅ Created demo user ${i + 1}/${count}: ${userData.email}`
          );
        } catch (error) {
          console.error(
            `❌ Failed to create demo user ${userData.email}:`,
            error
          );
          errors.push({
            email: userData.email,
            error: error.message,
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          created: results.length,
          failed: errors.length,
          results,
          errors,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle batch user creation
    if (batch_create && users) {
      console.log(`🔄 Creating ${users.length} demo users...`);

      const results = [];
      const errors = [];

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];

        try {
          // Create auth user
          const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
              email: userData.email,
              password: userData.password || 'demo123456',
              email_confirm: true,
              user_metadata: {
                full_name: userData.full_name,
              },
            });

          if (authError) throw authError;

          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              full_name: userData.full_name,
              phone: userData.phone,
              verified_rank: userData.current_rank,
              elo: userData.elo,
              skill_level: userData.skill_level,
              bio: userData.bio,
              is_demo_user: userData.is_demo_user,
              email: userData.email,
            });

          if (profileError) throw profileError;

          // Get rank ID for current_rank
          const { data: rankData, error: rankLookupError } = await supabaseAdmin
            .from('ranks')
            .select('id')
            .eq('code', userData.current_rank || 'K')
            .single();

          // Create player ranking
          const { error: rankingError } = await supabaseAdmin
            .from('player_rankings')
            .insert({
              user_id: authData.user.id,
              current_rank: userData.current_rank || 'K',
              current_rank_id:
                rankData?.id || '8cd47209-05e6-42c7-b8b4-2e59b2cb64e1', // Default to K rank
              elo_points: userData.elo,
              spa_points: 0,
              total_matches: 0,
              wins: 0,
              losses: 0,
              win_streak: 0,
            });

          if (rankingError) throw rankingError;

          results.push({
            email: userData.email,
            user_id: authData.user.id,
            success: true,
          });

          console.log(
            `✅ Created user ${i + 1}/${users.length}: ${userData.email}`
          );
        } catch (error) {
          console.error(`❌ Failed to create user ${userData.email}:`, error);
          errors.push({
            email: userData.email,
            error: error.message,
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          created: results.length,
          failed: errors.length,
          results,
          errors,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle single user creation
    if (!email) {
      throw new Error('Email is required');
    }

    console.log('📝 Creating single user:', email);

    // Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
        },
      });

    if (authError) throw authError;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name,
        phone,
        verified_rank: current_rank,
        elo,
        skill_level,
        bio,
        is_demo_user,
        email,
      });

    if (profileError) throw profileError;

    // Get rank ID for current_rank
    const { data: rankData, error: rankLookupError } = await supabaseAdmin
      .from('ranks')
      .select('id')
      .eq('code', current_rank)
      .single();

    if (rankLookupError) {
      console.warn('Rank lookup error, using default K rank:', rankLookupError);
    }

    // Create player ranking
    const { error: rankingError } = await supabaseAdmin
      .from('player_rankings')
      .insert({
        user_id: authData.user.id,
        current_rank: current_rank,
        current_rank_id: rankData?.id || '8cd47209-05e6-42c7-b8b4-2e59b2cb64e1', // Default to K rank
        elo_points: elo,
        spa_points: 0,
        total_matches: 0,
        wins: 0,
        losses: 0,
        win_streak: 0,
      });

    if (rankingError) throw rankingError;

    console.log('✅ User created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        email,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in create-admin-user function:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
