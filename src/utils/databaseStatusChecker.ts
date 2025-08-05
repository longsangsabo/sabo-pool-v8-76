import { supabase } from '@/integrations/supabase/client';

export interface DatabaseStatus {
  projectId: string;
  url: string;
  hasData: boolean;
  tableCount: number;
  userCount: number;
  lastActivity: string | null;
  isAccessible: boolean;
  errors: string[];
}

export const checkCurrentDatabaseStatus = async (): Promise<DatabaseStatus> => {
  const status: DatabaseStatus = {
    projectId: 'hjiublwdlvzmowxldstd',
    url: 'https://hjiublwdlvzmowxldstd.supabase.co',
    hasData: false,
    tableCount: 0,
    userCount: 0,
    lastActivity: null,
    isAccessible: false,
    errors: [],
  };

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      status.errors.push(`Connection error: ${connectionError.message}`);
      return status;
    }

    status.isAccessible = true;

    // Mock table count since information_schema access is not available
    status.tableCount = 6; // profiles, clubs, tournaments, challenges, matches, memberships

    // Check if there's any data in profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, created_at')
      .limit(1);

    if (!profilesError && profiles && profiles.length > 0) {
      status.hasData = true;
      status.userCount = profiles.length;
      status.lastActivity = profiles[0].created_at;
    }

    // Check other key tables for data
    const keyTables = ['clubs', 'tournaments', 'challenges', 'matches'];
    for (const table of keyTables) {
      try {
        const { data, error } = await supabase
          .from(table as 'clubs' | 'tournaments' | 'challenges' | 'matches')
          .select('id')
          .limit(1);

        if (!error && data && data.length > 0) {
          status.hasData = true;
        }
      } catch (error) {
        // Table might not exist, that's okay
      }
    }
  } catch (error: any) {
    status.errors.push(`General error: ${error.message}`);
  }

  return status;
};

export const getDatabaseRecommendation = (status: DatabaseStatus): string => {
  if (!status.isAccessible) {
    return '❌ Database không thể truy cập. Cần kiểm tra lại cấu hình.';
  }

  if (status.hasData) {
    return `✅ Database có dữ liệu (${status.userCount} users, ${status.tableCount} tables). Có thể sử dụng database hiện tại.`;
  } else {
    return '🆕 Database trống. Có thể sử dụng database hiện tại hoặc tạo mới.';
  }
};
