export interface DatabaseSetupOptions {
  useExisting: boolean;
  createNew: boolean;
  backupExisting: boolean;
  migrateData: boolean;
}

export const DATABASE_SETUP_GUIDE = {
  title: 'Hướng Dẫn Xử Lý Database',
  options: {
    useExisting: {
      title: 'Sử dụng Database hiện tại',
      description: 'Tiếp tục sử dụng database hiện tại của bạn',
      steps: [
        'Kiểm tra kết nối database',
        'Chạy migrations nếu cần',
        'Cập nhật schema nếu cần',
        'Test tất cả chức năng',
      ],
      pros: ['Giữ nguyên dữ liệu', 'Không cần setup mới'],
      cons: ['Có thể có conflicts', 'Cần backup trước'],
    },
    createNew: {
      title: 'Tạo Database mới',
      description: 'Tạo project Supabase mới hoàn toàn',
      steps: [
        'Tạo project Supabase mới',
        'Copy migrations',
        'Chạy migrations',
        'Cập nhật environment variables',
        'Test kết nối',
      ],
      pros: ['Sạch sẽ', 'Không có conflicts', 'Full control'],
      cons: ['Mất dữ liệu cũ', 'Cần setup lại'],
    },
    backupExisting: {
      title: 'Backup và Restore',
      description: 'Backup database cũ và restore vào database mới',
      steps: [
        'Export dữ liệu từ database cũ',
        'Tạo database mới',
        'Import dữ liệu',
        'Chạy migrations',
        'Verify dữ liệu',
      ],
      pros: ['Giữ được dữ liệu', 'Database sạch'],
      cons: ['Phức tạp', 'Có thể có lỗi'],
    },
  },
};

export const getSetupRecommendation = (
  hasExistingData: boolean,
  isAccessible: boolean
): string => {
  if (!isAccessible) {
    return 'createNew';
  }

  if (hasExistingData) {
    return 'backupExisting';
  }

  return 'useExisting';
};

export const generateEnvironmentTemplate = (
  projectId: string,
  apiKey: string
): string => {
  return `# Supabase Configuration
VITE_SUPABASE_URL=https://${projectId}.supabase.co
VITE_SUPABASE_ANON_KEY=${apiKey}

# Database Configuration
VITE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.${projectId}.supabase.co:5432/postgres

# Storage Configuration
VITE_STORAGE_URL=https://${projectId}.supabase.co/storage/v1

# Real-time Configuration
VITE_REALTIME_URL=wss://${projectId}.supabase.co/realtime/v1`;
};
