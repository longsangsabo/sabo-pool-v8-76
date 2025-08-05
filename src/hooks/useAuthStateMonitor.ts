import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { cleanupAuthState, checkAuthConflicts } from '@/utils/authStateCleanup';

/**
 * Monitor auth state for issues and auto-recovery
 */
export const useAuthStateMonitor = () => {
  const { user, loading } = useAuth();
  const lastUserRef = useRef(user);
  const errorCountRef = useRef(0);

  useEffect(() => {
    // Check for auth conflicts on mount
    const conflicts = checkAuthConflicts();
    if (conflicts.length > 0) {
      console.warn('🔍 Auth conflicts detected on mount:', conflicts);

      // Auto-cleanup if too many conflicts
      if (conflicts.length > 3) {
        console.log('🧹 Auto-cleaning due to multiple conflicts');
        cleanupAuthState();
      }
    }
  }, []);

  useEffect(() => {
    // Monitor for auth state flipping
    if (lastUserRef.current !== user) {
      console.log('👤 Auth state changed:', {
        from: lastUserRef.current?.id || 'null',
        to: user?.id || 'null',
      });

      lastUserRef.current = user;
      errorCountRef.current = 0; // Reset error count on successful change
    }
  }, [user]);

  useEffect(() => {
    // Monitor for stuck loading states
    if (loading) {
      const timeout = setTimeout(() => {
        errorCountRef.current++;
        console.warn(
          `⏳ Auth loading timeout (attempt ${errorCountRef.current})`
        );

        if (errorCountRef.current > 3) {
          console.error('🚨 Auth appears stuck, forcing cleanup');
          cleanupAuthState();
          window.location.reload();
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  return {
    hasConflicts: checkAuthConflicts().length > 0,
    errorCount: errorCountRef.current,
  };
};
