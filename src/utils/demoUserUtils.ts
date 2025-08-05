import { supabase } from '@/integrations/supabase/client';

export const createDemoUsers = async () => {
  try {
    console.log('Creating demo users...');

    // Check current auth
    const { data: currentUser } = await supabase.auth.getUser();
    console.log('Current user:', currentUser.user?.id);

    // Try to get existing profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .limit(5);

    console.log(
      'Existing profiles:',
      existingProfiles?.length || 0,
      profileError
    );

    if (profileError) {
      console.error('Profile query error:', profileError);
      return;
    }

    if (existingProfiles && existingProfiles.length > 0) {
      console.log('Users already exist:', existingProfiles);
      return existingProfiles;
    }

    // If no users exist, we need to create some demo data
    // But we can't create auth users directly, so just check if the table is accessible
    console.log('No users found, table is accessible but empty');

    return [];
  } catch (error) {
    console.error('Error in createDemoUsers:', error);
    throw error;
  }
};

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');

    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .single();

    if (error) {
      console.error('Database connection error:', error);
      return false;
    }

    console.log('Database connected, profile count:', data);
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
};
