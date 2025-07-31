import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  profile: any;
  session: any;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    profile: null,
    session: null
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthState({
          user: session?.user || null,
          loading: false,
          isAuthenticated: !!session?.user,
          profile: null,
          session
        });
      } catch (error) {
        console.error('Error getting session:', error);
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          profile: null,
          session: null
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user || null,
          loading: false,
          isAuthenticated: !!session?.user,
          profile: null,
          session
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Minimal auth functions for compatibility
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        profile: null,
        session: null
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Stub functions to prevent errors
  const signIn = async () => { toast.error('Auth function not implemented'); };
  const signUp = async () => { toast.error('Auth function not implemented'); };
  const signInWithGoogle = async () => { toast.error('Auth function not implemented'); };
  const signInWithFacebook = async () => { toast.error('Auth function not implemented'); };
  const signInWithPhone = async () => { toast.error('Auth function not implemented'); };
  const signInWithEmail = async () => { toast.error('Auth function not implemented'); };
  const signUpWithPhone = async () => { toast.error('Auth function not implemented'); };
  const signUpWithEmail = async () => { toast.error('Auth function not implemented'); };

  return {
    ...authState,
    signOut,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInWithPhone,
    signInWithEmail,
    signUpWithPhone,
    signUpWithEmail
  };
};