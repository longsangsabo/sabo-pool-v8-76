import { supabase } from '@/integrations/supabase/client';

export const quickDatabaseCheck = async () => {
  console.log('🔍 Bắt đầu kiểm tra database...');

  const results = {
    connection: false,
    tables: [] as string[],
    hasData: false,
    userCount: 0,
    errors: [] as string[],
  };

  try {
    // 1. Kiểm tra kết nối cơ bản
    console.log('📡 Kiểm tra kết nối...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      results.errors.push(`Lỗi kết nối: ${connectionError.message}`);
      console.error('❌ Lỗi kết nối:', connectionError);
    } else {
      results.connection = true;
      console.log('✅ Kết nối thành công');
    }

    // 2. Sử dụng danh sách bảng mặc định
    console.log('📋 Kiểm tra các bảng...');
    const importantTables = [
      'profiles',
      'clubs',
      'tournaments',
      'challenges',
      'matches',
      'notifications',
    ];
    results.tables = importantTables;
    console.log(
      `✅ Sử dụng danh sách bảng mặc định: ${importantTables.length} bảng`
    );

    // 3. Kiểm tra dữ liệu trong profiles
    console.log('👥 Kiểm tra dữ liệu users...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, created_at')
      .limit(10);

    if (!profilesError && profiles) {
      results.userCount = profiles.length;
      results.hasData = profiles.length > 0;
      console.log(`✅ Tìm thấy ${profiles.length} users`);
      if (profiles.length > 0) {
        console.log('📝 Users mẫu:', profiles.slice(0, 3));
      }
    } else {
      results.errors.push(`Lỗi kiểm tra users: ${profilesError?.message}`);
      console.error('❌ Lỗi kiểm tra users:', profilesError);
    }

    // 4. Kiểm tra các bảng quan trọng khác
    console.log('🔍 Kiểm tra các bảng quan trọng...');

    for (const table of importantTables) {
      try {
        // Sử dụng any để bypass type checking cho dynamic table names
        const { data, error } = await (supabase as any)
          .from(table)
          .select('id')
          .limit(1);

        if (!error && data) {
          console.log(`✅ Bảng ${table}: ${data.length} records`);
        } else {
          console.log(
            `⚠️ Bảng ${table}: ${error?.message || 'Không có dữ liệu'}`
          );
        }
      } catch (error: any) {
        console.log(`❌ Bảng ${table}: ${error.message}`);
      }
    }

    // 5. Kiểm tra authentication
    console.log('🔐 Kiểm tra authentication...');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.log('⚠️ Authentication check:', authError.message);
    } else {
      console.log(
        `✅ Authentication: ${user ? 'Đã đăng nhập' : 'Chưa đăng nhập'}`
      );
    }

    // 6. Tóm tắt kết quả
    console.log('\n📊 TÓM TẮT KIỂM TRA DATABASE:');
    console.log('================================');
    console.log(
      `🔗 Kết nối: ${results.connection ? '✅ Thành công' : '❌ Thất bại'}`
    );
    console.log(`📋 Số bảng: ${results.tables.length}`);
    console.log(`👥 Số users: ${results.userCount}`);
    console.log(`📊 Có dữ liệu: ${results.hasData ? '✅ Có' : '❌ Không'}`);

    if (results.errors.length > 0) {
      console.log('\n❌ LỖI PHÁT HIỆN:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    // 7. Đưa ra khuyến nghị
    console.log('\n💡 KHUYẾN NGHỊ:');
    if (!results.connection) {
      console.log(
        '  - ❌ Database không thể kết nối. Cần kiểm tra lại cấu hình.'
      );
    } else if (results.hasData) {
      console.log(
        '  - ✅ Database có dữ liệu. Có thể sử dụng database hiện tại.'
      );
      console.log('  - ⚠️ Hãy backup trước khi thay đổi.');
    } else {
      console.log('  - 🆕 Database trống. Có thể sử dụng hoặc tạo mới.');
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
  console.log('🚀 Chạy kiểm tra database nhanh...');
  quickDatabaseCheck()
    .then(results => {
      console.log('✅ Hoàn thành kiểm tra!');
      return results;
    })
    .catch(error => {
      console.error('❌ Lỗi kiểm tra:', error);
    });
};
