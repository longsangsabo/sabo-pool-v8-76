import { supabase } from '@/integrations/supabase/client';

/**
 * Emergency auth state recovery utility
 * Cleans up corrupted auth state and provides fallback authentication
 */
export const emergencyAuthRecovery = () => {
  console.log('🚨 Emergency auth recovery initiated...');

  try {
    // Clear all auth-related storage
    const authKeys = Object.keys(localStorage).filter(
      key =>
        key.startsWith('supabase.auth.') ||
        key.includes('sb-') ||
        key.includes('auth')
    );

    authKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log('🧹 Cleared localStorage key:', key);
    });

    // Clear session storage
    sessionStorage.clear();
    console.log('🧹 Cleared sessionStorage');

    // Force sign out on Supabase client
    supabase.auth.signOut({ scope: 'global' }).catch(error => {
      console.warn('⚠️ Emergency signout failed (continuing anyway):', error);
    });

    console.log('✅ Emergency auth recovery completed');

    // Force redirect to auth page
    setTimeout(() => {
      window.location.href = '/auth?recovery=true';
    }, 500);
  } catch (error) {
    console.error('❌ Emergency auth recovery failed:', error);
    // Force reload as last resort
    window.location.reload();
  }
};

/**
 * Detect authentication conflicts and corruption
 */
export const detectAuthConflicts = () => {
  const conflicts = [];

  try {
    // Check for multiple auth tokens
    const authKeys = Object.keys(localStorage).filter(
      key => key.startsWith('supabase.auth.') || key.includes('sb-')
    );

    if (authKeys.length > 2) {
      conflicts.push(`Multiple auth keys: ${authKeys.length}`);
    }

    // Check for expired tokens
    authKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value && value.includes('expires_at')) {
          const parsed = JSON.parse(value);
          if (parsed.expires_at && parsed.expires_at < Date.now() / 1000) {
            conflicts.push(`Expired token: ${key}`);
          }
        }
      } catch (parseError) {
        conflicts.push(`Invalid token format: ${key}`);
      }
    });

    // Check for session/localStorage mismatch
    const sessionCount = Object.keys(sessionStorage).length;
    const localAuthCount = authKeys.length;

    if (sessionCount > 0 && localAuthCount === 0) {
      conflicts.push('Session/localStorage mismatch');
    }
  } catch (error) {
    conflicts.push(`Conflict detection error: ${error.message}`);
  }

  return conflicts;
};

/**
 * Monitor and auto-recover from auth issues
 */
export const setupAuthMonitoring = () => {
  // Check for conflicts on page load
  const initialConflicts = detectAuthConflicts();
  if (initialConflicts.length > 0) {
    console.warn('🔍 Auth conflicts detected on load:', initialConflicts);

    // Auto-recovery for severe conflicts
    if (initialConflicts.length > 3) {
      console.log('🔧 Auto-triggering emergency recovery...');
      emergencyAuthRecovery();
    }
  }

  // Monitor for auth errors in console
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ').toLowerCase();

    // Detect auth-related errors
    if (
      message.includes('auth') &&
      (message.includes('invalid') ||
        message.includes('expired') ||
        message.includes('unauthorized'))
    ) {
      console.log('🚨 Auth error detected, initiating recovery...');
      setTimeout(() => emergencyAuthRecovery(), 1000);
    }

    originalError.apply(console, args);
  };

  console.log('🔧 Auth monitoring activated');
};
