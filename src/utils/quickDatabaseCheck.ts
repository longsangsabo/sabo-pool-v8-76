import { supabase } from '@/integrations/supabase/client';

export const quickDatabaseCheck = async () => {

  const results = {
    connection: false,
    tables: [] as string[],
    hasData: false,
    userCount: 0,
    errors: [] as string[],
  };

  try {
    // 1. Kiểm tra kết nối cơ bản

    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      results.errors.push(`Lỗi kết nối: ${connectionError.message}`);
      console.error('❌ Lỗi kết nối:', connectionError);
    } else {
      results.connection = true;

    }

    // 2. Sử dụng danh sách bảng mặc định

    const importantTables = [
      'profiles',
      'clubs',
      'tournaments',
      'challenges',
      'matches',
      'notifications',
    ];
    results.tables = importantTables;

      `✅ Sử dụng danh sách bảng mặc định: ${importantTables.length} bảng`
    );

    // 3. Kiểm tra dữ liệu trong profiles

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, created_at')
      .limit(10);

    if (!profilesError && profiles) {
      results.userCount = profiles.length;
      results.hasData = profiles.length > 0;

      if (profiles.length > 0) {

      }
    } else {
      results.errors.push(`Lỗi kiểm tra users: ${profilesError?.message}`);
      console.error('❌ Lỗi kiểm tra users:', profilesError);
    }

    // 4. Kiểm tra các bảng quan trọng khác

    for (const table of importantTables) {
      try {
        // Sử dụng any để bypass type checking cho dynamic table names
        const { data, error } = await (supabase as any)
          .from(table)
          .select('id')
          .limit(1);

        if (!error && data) {

        } else {

            `⚠️ Bảng ${table}: ${error?.message || 'Không có dữ liệu'}`
          );
        }
      } catch (error: any) {

      }
    }

    // 5. Kiểm tra authentication

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {

    } else {

        `✅ Authentication: ${user ? 'Đã đăng nhập' : 'Chưa đăng nhập'}`
      );
    }

    // 6. Tóm tắt kết quả

      `🔗 Kết nối: ${results.connection ? '✅ Thành công' : '❌ Thất bại'}`
    );

    if (results.errors.length > 0) {

    }

    // 7. Đưa ra khuyến nghị

    if (!results.connection) {

        '  - ❌ Database không thể kết nối. Cần kiểm tra lại cấu hình.'
      );
    } else if (results.hasData) {

        '  - ✅ Database có dữ liệu. Có thể sử dụng database hiện tại.'
      );

    } else {

    }

    return results;
  } catch (error: any) {
    console.error('💥 Lỗi nghiêm trọng:', error);
    results.errors.push(`Lỗi nghiêm trọng: ${error.message}`);
    return results;
  }
};

// Hàm kiểm tra nhanh từ console
export const runQuickCheck = () => {

  quickDatabaseCheck()
    .then(results => {

      return results;
    })
    .catch(error => {
      console.error('❌ Lỗi kiểm tra:', error);
    });
};
