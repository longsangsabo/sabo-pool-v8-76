
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, UserProfile } from '@/types/common';
import { useNavigate } from 'react-router-dom';
import { isAdminUser, updateUserAdminStatus } from '@/utils/adminHelpers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const adminCheckRef = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state...");
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthProvider: Error getting session:", error);
        }
        console.log("AuthProvider: Initial session:", session?.user?.phone || session?.user?.email || 'No user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error("AuthProvider: Failed to get session:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthProvider: Auth state changed:", event, session?.user?.phone || session?.user?.email || 'No user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Only check for admin role on SIGNED_IN event and redirect once
        if (event === 'SIGNED_IN' && session?.user && !adminCheckRef.current) {
          adminCheckRef.current = true;
          
          // Clear any existing timeout
          if (authTimeoutRef.current) {
            clearTimeout(authTimeoutRef.current);
          }
          
          // Use setTimeout to avoid blocking the auth flow
          authTimeoutRef.current = setTimeout(async () => {
            try {
              const { data: roles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id);
              
              const isAdmin = roles?.some(r => r.role === 'admin');
              
              if (isAdmin && !window.location.pathname.startsWith('/admin')) {
                console.log("Navigating admin to admin panel");
                navigate('/admin', { replace: true });
              }
            } catch (error) {
              console.error("Error checking user roles:", error);
            } finally {
              adminCheckRef.current = false;
            }
          }, 100); // Reduced delay for faster navigation
        }
        
        // Reset admin check flag on sign out
        if (event === 'SIGNED_OUT') {
          adminCheckRef.current = false;
          if (authTimeoutRef.current) {
            clearTimeout(authTimeoutRef.current);
          }
        }
      }
    );

    return () => {
      console.log("AuthProvider: Cleaning up subscription");
      subscription.unsubscribe();
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [navigate]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("AuthProvider: Attempting email sign in for:", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error: any) {
      console.error('AuthProvider: Email sign in error:', error);
      return { error };
    }
  };

  const signInWithPhone = async (phone: string, password: string) => {
    try {
      console.log("AuthProvider: Attempting phone sign in for:", phone);
      // Convert Vietnamese phone format to E.164
      const e164Phone = phone.startsWith('0') ? '+84' + phone.substring(1) : phone;
      const { error } = await supabase.auth.signInWithPassword({
        phone: e164Phone,
        password,
      });
      return { error };
    } catch (error: any) {
      console.error('AuthProvider: Phone sign in error:', error);
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, referralCode?: string) => {
    try {
      console.log("AuthProvider: Attempting email sign up for:", email);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            email: email,
            referred_by_code: referralCode, // Include referral code in user metadata
          },
        },
      });

      // Create profile after successful signup
      if (data.user && !error) {
        const isAdmin = isAdminUser(email, undefined);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            is_admin: isAdmin,
            referred_by_code: referralCode, // Store referral code in profile
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
        } else {
          // Force update admin status for existing users
          await updateUserAdminStatus(data.user.id, email, undefined);
        }
      }

      return { data, error };
    } catch (error: any) {
      console.error('AuthProvider: Email sign up error:', error);
      return { error };
    }
  };

  const signUpWithPhone = async (phone: string, password: string, fullName: string, referralCode?: string) => {
    try {
      console.log("AuthProvider: Attempting phone sign up for:", phone);
      // Convert Vietnamese phone format to E.164
      const e164Phone = phone.startsWith('0') ? '+84' + phone.substring(1) : phone;
      const { data, error } = await supabase.auth.signUp({
        phone: e164Phone,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone, // Store original format in metadata
            referred_by_code: referralCode, // Include referral code in user metadata
          },
        },
      });

      // Create profile after successful signup
      if (data.user && !error) {
        const isAdmin = isAdminUser(undefined, phone);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            referred_by_code: referralCode, // Store referral code
            is_admin: isAdmin
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return { data, error };
    } catch (error: any) {
      console.error('AuthProvider: Phone sign up error:', error);
      return { error };
    }
  };

  const signInWithFacebook = async () => {
    try {
      console.log("AuthProvider: Attempting Facebook sign in");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email,public_profile',
        },
      });
      return { data, error };
    } catch (error: any) {
      console.error('AuthProvider: Facebook sign in error:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("AuthProvider: Attempting Google sign in");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { data, error };
    } catch (error: any) {
      console.error('AuthProvider: Google sign in error:', error);
      return { error };
    }
  };

  // Legacy methods for backward compatibility
  const signIn = signInWithEmail;
  const signUp = signUpWithEmail;

  const signOut = async () => {
    try {
      console.log("AuthProvider: Signing out");
      await supabase.auth.signOut();
    } catch (error) {
      console.error('AuthProvider: Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    profile,
    signIn,
    signUp,
    signInWithEmail,
    signInWithPhone,
    signUpWithEmail,
    signUpWithPhone,
    signInWithFacebook,
    signInWithGoogle,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
