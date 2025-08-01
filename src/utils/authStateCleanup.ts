import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive auth state cleanup utility
 * Prevents authentication limbo states by clearing all auth-related storage
 */
export const cleanupAuthState = () => {
  console.log('🧹 Cleaning up auth state...');

  // Clear localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log(`Removed localStorage key: ${key}`);
    }
  });

  // Clear sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
      console.log(`Removed sessionStorage key: ${key}`);
    }
  });

  // Clear any additional auth-related keys
  const additionalKeys = [
    'supabase.auth.token',
    'sb-auth-token',
    'auth-token',
    'access-token',
    'refresh-token',
  ];

  additionalKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  console.log('✅ Auth state cleanup completed');
};

/**
 * Robust sign out that prevents limbo states
 */
export const robustSignOut = async () => {
  console.log('🚪 Performing robust sign out...');

  try {
    // Clean up state first
    cleanupAuthState();

    // Attempt global sign out
    await supabase.auth.signOut({ scope: 'global' });
    console.log('✅ Global sign out completed');
  } catch (error) {
    console.warn('⚠️ Sign out error (will continue):', error);
  } finally {
    // Always force page refresh for clean state
    console.log('🔄 Forcing page refresh...');
    window.location.href = '/auth';
  }
};

/**
 * Robust sign in that prevents limbo states
 */
export const robustSignIn = async (signInFunction: () => Promise<any>) => {
  console.log('🔐 Performing robust sign in...');

  try {
    // Clean up existing state first
    cleanupAuthState();

    // Attempt sign out to clear any existing session
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.warn('⚠️ Pre-signin cleanup error (will continue):', error);
    }

    // Perform the actual sign in
    const result = await signInFunction();

    if (result.error) {
      throw result.error;
    }

    if (result.data?.user) {
      console.log('✅ Sign in successful, refreshing page...');
      // Force page refresh for clean state
      window.location.href = '/dashboard';
    }

    return result;
  } catch (error) {
    console.error('❌ Sign in error:', error);
    throw error;
  }
};

/**
 * Check for authentication conflicts
 */
export const checkAuthConflicts = () => {
  const conflicts = [];

  // Check for multiple auth tokens
  const authKeys = Object.keys(localStorage).filter(
    key => key.startsWith('supabase.auth.') || key.includes('sb-')
  );

  if (authKeys.length > 2) {
    conflicts.push(`Multiple auth keys found: ${authKeys.join(', ')}`);
  }

  // Check for expired tokens
  authKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value && value.includes('expires_at')) {
        const parsed = JSON.parse(value);
        if (parsed.expires_at && parsed.expires_at < Date.now() / 1000) {
          conflicts.push(`Expired token found: ${key}`);
        }
      }
    } catch (error) {
      conflicts.push(`Invalid token format: ${key}`);
    }
  });

  if (conflicts.length > 0) {
    console.warn('⚠️ Auth conflicts detected:', conflicts);
    return conflicts;
  }

  return [];
};
