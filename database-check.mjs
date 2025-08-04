// database-check.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://exlqvlbawytbglioqfbc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bHF2bGJhd3l0YmdsaW9xZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4MDA4OCwiZXhwIjoyMDY4NjU2MDg4fQ.8oZlR-lyaDdGZ_mvvyH2wJsJbsD0P6MT9ZkiyASqLcQ';

// Create admin client with service role
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('🔍 Checking Supabase database...');
  
  try {
    // 1. Check profiles table
    console.log('\n📊 Checking profiles table...');
    const { data: profiles, error: profilesError, count: profilesCount } = await adminClient
      .from('profiles')
      .select('user_id, full_name, email, role, is_admin, created_at', { count: 'exact' })
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
    } else {
      console.log(`✅ Profiles found: ${profilesCount} users`);
      profiles?.forEach((user, i) => {
        console.log(`   ${i+1}. ${user.full_name || 'No name'} - ${user.email || 'No email'} - Role: ${user.role || 'none'} - Admin: ${user.is_admin}`);
      });
    }

    // 2. Check tournaments table
    console.log('\n🏆 Checking tournaments table...');
    const { data: tournaments, error: tournamentsError, count: tournamentsCount } = await adminClient
      .from('tournaments')
      .select('id, name, status, created_at', { count: 'exact' })
      .limit(3);
    
    if (tournamentsError) {
      console.error('❌ Tournaments error:', tournamentsError);
    } else {
      console.log(`✅ Tournaments found: ${tournamentsCount} tournaments`);
      tournaments?.forEach((t, i) => {
        console.log(`   ${i+1}. ${t.name} - Status: ${t.status}`);
      });
    }

    // 3. Check challenges table
    console.log('\n⚔️ Checking challenges table...');
    const { data: challenges, error: challengesError, count: challengesCount } = await adminClient
      .from('challenges')
      .select('id, challenger_id, opponent_id, status, created_at', { count: 'exact' })
      .limit(3);
    
    if (challengesError) {
      console.error('❌ Challenges error:', challengesError);
    } else {
      console.log(`✅ Challenges found: ${challengesCount} challenges`);
    }

    // 4. Check player_rankings table
    console.log('\n🏅 Checking player_rankings table...');
    const { data: rankings, error: rankingsError, count: rankingsCount } = await adminClient
      .from('player_rankings')
      .select('user_id, spa_points, elo_points, rank', { count: 'exact' })
      .limit(3);
    
    if (rankingsError) {
      console.error('❌ Rankings error:', rankingsError);
    } else {
      console.log(`✅ Rankings found: ${rankingsCount} rankings`);
    }

    // 5. List all tables in database
    console.log('\n📋 All available tables:');
    const { data: tables, error: tablesError } = await adminClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (!tablesError && tables) {
      tables.forEach((table, i) => {
        console.log(`   ${i+1}. ${table.table_name}`);
      });
    }

    return { profilesCount, tournamentsCount, challengesCount, rankingsCount };
    
  } catch (error) {
    console.error('💥 Database check failed:', error);
    throw error;
  }
}

// Run the check
checkDatabase()
  .then((stats) => {
    console.log('\n✅ Database check completed!');
    console.log('📊 Summary:', stats);
  })
  .catch((error) => {
    console.error('\n❌ Database check failed:', error);
  });
