import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  success: boolean;
  error?: string;
  data?: any;
}

export const checkSupabaseConnection = async (): Promise<HealthCheckResult> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Network connectivity error:', error);
    return { success: false, error: 'Network connectivity failed' };
  }
};

export const checkDatabasePermissions =
  async (): Promise<HealthCheckResult> => {
    try {
      // Test read permission
      const { data: readData, error: readError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (readError) {
        return {
          success: false,
          error: `Read permission failed: ${readError.message}`,
        };
      }

      // Test write permission (if user is authenticated)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error: writeError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (writeError) {
          return {
            success: false,
            error: `Write permission failed: ${writeError.message}`,
          };
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

export const validateEnvironmentVariables = (): HealthCheckResult => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      error: 'Missing Supabase environment variables',
    };
  }

  if (!supabaseUrl.startsWith('https://')) {
    return {
      success: false,
      error: 'Invalid Supabase URL format',
    };
  }

  return { success: true };
};
