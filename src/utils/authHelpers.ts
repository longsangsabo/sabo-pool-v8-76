import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const handleAuthError = (error: any) => {
  console.error('Auth error:', error);

  switch (error?.message) {
    case 'Invalid login credentials':
      toast.error('Email hoặc mật khẩu không đúng');
      break;
    case 'Email not confirmed':
      toast.error('Vui lòng xác nhận email trước khi đăng nhập');
      break;
    case 'User already registered':
      toast.error('Email này đã được đăng ký');
      break;
    case 'Signup requires a valid password':
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      break;
    default:
      toast.error(error?.message || 'Có lỗi xảy ra trong quá trình xác thực');
  }
};

export const validateJWTToken = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('JWT validation error:', error);
      return false;
    }

    if (!session?.access_token) {
      console.warn('No access token found');
      return false;
    }

    // Check if token is expired
    if (session.expires_at && session.expires_at < Date.now() / 1000) {
      console.warn('Token expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('JWT validation failed:', error);
    return false;
  }
};

export const refreshAuthSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Session refresh failed:', error);
      return false;
    }

    return !!data.session;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
};

export const configureOAuthRedirects = () => {
  const redirectUrl = `${window.location.origin}/`;

  return {
    google: {
      provider: 'google' as const,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    },
    facebook: {
      provider: 'facebook' as const,
      options: {
        redirectTo: redirectUrl,
        scopes: 'email',
      },
    },
  };
};
