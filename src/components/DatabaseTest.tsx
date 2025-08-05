import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bHF2bGJhd3l0YmdsaW9xZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4MDA4OCwiZXhwIjoyMDY4NjU2MDg4fQ.8oZlR-lyaDdGZ_mvvyH2wJsJbsD0P6MT9ZkiyASqLcQ';
const SUPABASE_URL = 'https://exlqvlbawytbglioqfbc.supabase.co';

// Create admin client with service role (bypasses RLS)
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const DatabaseTest = () => {
  const [status, setStatus] = useState('Testing database...');
  const [results, setResults] = useState<any>({});
  const [tables, setTables] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    try {
      console.log('🚀 Starting comprehensive database test...');
      setStatus('🔍 Scanning database...');

      const testResults: any = {};

      // Test 1: Check profiles table
      console.log('Testing profiles table...');
      const {
        data: profiles,
        error: profilesError,
        count: profilesCount,
      } = await adminClient
        .from('profiles')
        .select(
          'user_id, full_name, email, role, is_admin, ban_status, created_at',
          { count: 'exact' }
        )
        .limit(5);

      testResults.profiles = {
        count: profilesCount,
        error: profilesError?.message,
        sample: profiles?.slice(0, 3),
      };

      // Test 2: Check tournaments table
      console.log('Testing tournaments table...');
      const {
        data: tournaments,
        error: tournamentsError,
        count: tournamentsCount,
      } = await adminClient
        .from('tournaments')
        .select('id, name, status, created_at', { count: 'exact' })
        .limit(3);

      testResults.tournaments = {
        count: tournamentsCount,
        error: tournamentsError?.message,
        sample: tournaments,
      };

      // Test 3: Check challenges table
      console.log('Testing challenges table...');
      const {
        data: challenges,
        error: challengesError,
        count: challengesCount,
      } = await adminClient
        .from('challenges')
        .select('id, status, created_at', { count: 'exact' })
        .limit(3);

      testResults.challenges = {
        count: challengesCount,
        error: challengesError?.message,
      };

      // Test 4: Check player_rankings table
      console.log('Testing player_rankings table...');
      const {
        data: rankings,
        error: rankingsError,
        count: rankingsCount,
      } = await adminClient
        .from('player_rankings')
        .select('user_id, spa_points, elo_points', { count: 'exact' })
        .limit(3);

      testResults.rankings = {
        count: rankingsCount,
        error: rankingsError?.message,
        sample: rankings,
      };

      setResults(testResults);
      setStatus('✅ Database scan completed!');

      console.log('Database test results:', testResults);
    } catch (error: any) {
      console.error('Database test failed:', error);
      setStatus(`❌ Test failed: ${error.message}`);
    }
  };

  const createDemoUsers = async () => {
    try {
      setCreating(true);
      setStatus('🔧 Creating demo users...');

      const demoUsers = [
        {
          user_id: '11111111-1111-1111-1111-111111111111',
          full_name: 'Admin Demo',
          email: 'admin@sabopool.demo',
          phone: '+84901234567',
          role: 'admin',
          skill_level: 'expert',
          verified_rank: 'Master',
          city: 'Hồ Chí Minh',
          district: 'Quận 1',
          bio: 'Demo admin user for testing',
          is_admin: true,
          ban_status: 'active',
        },
        {
          user_id: '22222222-2222-2222-2222-222222222222',
          full_name: 'Nguyễn Văn A',
          email: 'user1@sabopool.demo',
          phone: '+84901234568',
          role: 'player',
          skill_level: 'intermediate',
          verified_rank: 'C',
          city: 'Hồ Chí Minh',
          district: 'Quận 3',
          bio: 'Demo player user',
          is_admin: false,
          ban_status: 'active',
        },
        {
          user_id: '33333333-3333-3333-3333-333333333333',
          full_name: 'Trần Thị B',
          email: 'user2@sabopool.demo',
          phone: '+84901234569',
          role: 'player',
          skill_level: 'beginner',
          verified_rank: 'D',
          city: 'Hà Nội',
          district: 'Hoàn Kiếm',
          bio: 'Demo beginner player',
          is_admin: false,
          ban_status: 'active',
        },
      ];

      // Insert demo users
      const { data: insertedUsers, error: insertError } = await adminClient
        .from('profiles')
        .upsert(
          demoUsers.map(user => ({
            ...user,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        )
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log('✅ Demo users created:', insertedUsers);

      // Create demo rankings
      const demoRankings = [
        {
          user_id: '11111111-1111-1111-1111-111111111111',
          spa_points: 1500,
          elo_points: 1800,
          rank: 'Master',
        },
        {
          user_id: '22222222-2222-2222-2222-222222222222',
          spa_points: 800,
          elo_points: 1400,
          rank: 'C',
        },
        {
          user_id: '33333333-3333-3333-3333-333333333333',
          spa_points: 200,
          elo_points: 1100,
          rank: 'D',
        },
      ];

      const { error: rankingsError } = await adminClient
        .from('player_rankings')
        .upsert(
          demoRankings.map(ranking => ({
            ...ranking,
            wins: Math.floor(Math.random() * 20),
            losses: Math.floor(Math.random() * 10),
            total_matches: Math.floor(Math.random() * 30) + 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        );

      if (rankingsError) {
        console.warn('Rankings insert failed:', rankingsError);
      }

      setStatus('✅ Demo users created successfully!');

      // Refresh test results
      setTimeout(() => {
        testDatabase();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create demo users:', error);
      setStatus(`❌ Failed to create demo users: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='p-6 bg-white border rounded-lg'>
      <h3 className='text-lg font-semibold mb-4'>
        🗄️ Database Connection Test (Service Role)
      </h3>
      <div className='space-y-4'>
        <p>
          <strong>Status:</strong> {status}
        </p>

        {Object.keys(results).length > 0 && (
          <div className='space-y-3'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='bg-blue-50 p-3 rounded'>
                <h4 className='font-medium text-blue-800'>👥 Profiles</h4>
                <p className='text-2xl font-bold text-blue-600'>
                  {results.profiles?.count || 0}
                </p>
                {results.profiles?.error && (
                  <p className='text-xs text-red-600'>
                    {results.profiles.error}
                  </p>
                )}
              </div>

              <div className='bg-green-50 p-3 rounded'>
                <h4 className='font-medium text-green-800'>🏆 Tournaments</h4>
                <p className='text-2xl font-bold text-green-600'>
                  {results.tournaments?.count || 0}
                </p>
                {results.tournaments?.error && (
                  <p className='text-xs text-red-600'>
                    {results.tournaments.error}
                  </p>
                )}
              </div>

              <div className='bg-purple-50 p-3 rounded'>
                <h4 className='font-medium text-purple-800'>⚔️ Challenges</h4>
                <p className='text-2xl font-bold text-purple-600'>
                  {results.challenges?.count || 0}
                </p>
                {results.challenges?.error && (
                  <p className='text-xs text-red-600'>
                    {results.challenges.error}
                  </p>
                )}
              </div>

              <div className='bg-yellow-50 p-3 rounded'>
                <h4 className='font-medium text-yellow-800'>🏅 Rankings</h4>
                <p className='text-2xl font-bold text-yellow-600'>
                  {results.rankings?.count || 0}
                </p>
                {results.rankings?.error && (
                  <p className='text-xs text-red-600'>
                    {results.rankings.error}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2'>
              <button
                onClick={testDatabase}
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
              >
                🔄 Refresh Test
              </button>

              {results.profiles?.count === 0 && (
                <button
                  onClick={createDemoUsers}
                  disabled={creating}
                  className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50'
                >
                  {creating ? '⏳ Creating...' : '➕ Create Demo Users'}
                </button>
              )}
            </div>

            {results.profiles?.sample && results.profiles.sample.length > 0 && (
              <div className='mt-4'>
                <h4 className='font-medium mb-2'>📋 Sample Users:</h4>
                <div className='space-y-1'>
                  {results.profiles.sample.map((user: any, i: number) => (
                    <div
                      key={i}
                      className='text-sm bg-gray-100 p-2 rounded flex justify-between'
                    >
                      <span>{user.full_name || 'No name'}</span>
                      <span className='text-gray-600'>
                        {user.email || 'No email'}
                      </span>
                      <span className='text-blue-600'>
                        {user.role || 'no role'}
                      </span>
                      <span
                        className={
                          user.is_admin ? 'text-red-600' : 'text-gray-400'
                        }
                      >
                        {user.is_admin ? '👑 Admin' : 'User'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
