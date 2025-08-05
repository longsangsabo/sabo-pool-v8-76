// Simplified Translation Service - Local Storage Based
// This version works without database dependencies

interface TranslationTask {
  id: string;
  page_path: string;
  component_name: string;
  source_language: 'vi' | 'en';
  target_language: 'vi' | 'en';
  translation_keys: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface PageContent {
  path: string;
  component: string;
  translationKeys: string[];
  lastModified: string;
}

class TranslationService {
  private static instance: TranslationService;
  private knownPages: Set<string> = new Set();
  private tasks: TranslationTask[] = [];

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  constructor() {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem('translation_tasks');
    if (savedTasks) {
      try {
        this.tasks = JSON.parse(savedTasks);
      } catch (error) {
        console.error('Error loading translation tasks:', error);
        this.tasks = [];
      }
    }
  }

  private saveTasks(): void {
    try {
      localStorage.setItem('translation_tasks', JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Error saving translation tasks:', error);
    }
  }

  // Detect new pages by monitoring route changes
  detectNewPage(pagePath: string, componentName: string): void {
    if (!this.knownPages.has(pagePath)) {
      this.knownPages.add(pagePath);
      this.queuePageForTranslation(pagePath, componentName);
    }
  }

  // Extract translation keys from component content
  extractTranslationKeys(componentContent: string): string[] {
    const keys: string[] = [];

    // Tìm các pattern t('key') và t("key")
    const singleQuoteMatches = componentContent.match(/t\('([^']+)'\)/g);
    const doubleQuoteMatches = componentContent.match(/t\("([^"]+)"\)/g);

    if (singleQuoteMatches) {
      singleQuoteMatches.forEach(match => {
        const key = match.match(/t\('([^']+)'\)/)?.[1];
        if (key && !keys.includes(key)) {
          keys.push(key);
        }
      });
    }

    if (doubleQuoteMatches) {
      doubleQuoteMatches.forEach(match => {
        const key = match.match(/t\("([^"]+)"\)/)?.[1];
        if (key && !keys.includes(key)) {
          keys.push(key);
        }
      });
    }

    return keys;
  }

  // Queue a page for translation
  async queuePageForTranslation(
    pagePath: string,
    componentName: string,
    customKeys?: string[]
  ): Promise<void> {
    try {
      // Use custom keys if provided, otherwise generate sample keys
      const translationKeys = customKeys || [
        `${componentName.toLowerCase()}.title`,
        `${componentName.toLowerCase()}.description`,
        `${componentName.toLowerCase()}.button.action`,
      ];

      const newTask: TranslationTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        page_path: pagePath,
        component_name: componentName,
        source_language: 'en',
        target_language: 'vi',
        translation_keys: translationKeys,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.tasks.push(newTask);
      this.saveTasks();

      // Auto-process with a small delay
      setTimeout(() => {
        this.processTranslationQueue();
      }, 1000);
    } catch (error) {
      console.error('Lỗi khi tạo task dịch thuật:', error);
    }
  }

  // Process translation queue
  async processTranslationQueue(): Promise<void> {
    try {
      const pendingTasks = this.tasks
        .filter(task => task.status === 'pending')
        .slice(0, 5);

      if (pendingTasks.length === 0) {
        return;
      }

      for (const task of pendingTasks) {
        await this.translateTask(task);
      }
    } catch (error) {
      console.error('Lỗi khi xử lý hàng đợi dịch thuật:', error);
    }
  }

  // Translate a specific task
  async translateTask(task: TranslationTask): Promise<void> {
    try {
      // Update status to processing
      const taskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].status = 'processing';
        this.tasks[taskIndex].updated_at = new Date().toISOString();
        this.saveTasks();
      }

      // Simulate translation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock translations
      const translations = await this.callTranslationAPI(
        task.translation_keys,
        task.source_language,
        task.target_language
      );

      // Update status to completed
      if (taskIndex !== -1) {
        this.tasks[taskIndex].status = 'completed';
        this.tasks[taskIndex].updated_at = new Date().toISOString();
        this.saveTasks();
      }
    } catch (error) {
      console.error(`❌ Lỗi khi dịch ${task.page_path}:`, error);

      // Update status to failed
      const taskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].status = 'failed';
        this.tasks[taskIndex].updated_at = new Date().toISOString();
        this.saveTasks();
      }
    }
  }

  // Real translation API call using Edge Function
  async callTranslationAPI(
    keys: string[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<Record<string, string>> {
    try {
      // Try to use the real Edge Function
      const { data, error } = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys,
          sourceLanguage,
          targetLanguage,
          context: 'Pool billiards gaming application',
        }),
      })
        .then(res => res.json())
        .catch(() => ({ error: 'Network error' }));

      if (error) {
        return this.generateFallbackTranslations(keys, targetLanguage);
      }

      return (
        data.translations ||
        this.generateFallbackTranslations(keys, targetLanguage)
      );
    } catch (error) {
      console.error('Lỗi API dịch thuật:', error);
      return this.generateFallbackTranslations(keys, targetLanguage);
    }
  }

  // Enhanced fallback translations with better context
  private generateFallbackTranslations(
    keys: string[],
    targetLanguage: string
  ): Record<string, string> {
    const translations: Record<string, string> = {};

    const translationMap: Record<string, string> = {
      // Navigation & Common
      home: 'Trang chủ',
      tournaments: 'Giải đấu',
      clubs: 'Câu lạc bộ',
      rankings: 'Xếp hạng',
      profile: 'Hồ sơ',
      login: 'Đăng nhập',
      sign_up: 'Đăng ký',
      logout: 'Đăng xuất',

      // Tournament related
      create_tournament: 'Tạo giải đấu',
      join_tournament: 'Tham gia giải đấu',
      tournament_registration: 'Đăng ký giải đấu',
      registration_open: 'Đang mở đăng ký',
      entry_fee: 'Phí tham gia',
      search_tournaments: 'Tìm kiếm giải đấu',

      // Club related
      pool_clubs: 'Câu lạc bộ bida',
      register_new_club: 'Đăng ký CLB mới',
      club_directory: 'Danh bạ CLB',
      operating_hours: 'Giờ hoạt động',
      business_license: 'Giấy phép kinh doanh',

      // Common actions
      search: 'Tìm kiếm',
      create: 'Tạo',
      join: 'Tham gia',
      register: 'Đăng ký',
      edit: 'Chỉnh sửa',
      delete: 'Xóa',
      save: 'Lưu',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
    };

    keys.forEach(key => {
      if (targetLanguage === 'vi') {
        // Extract the actual text from key patterns
        const keyLower = key.toLowerCase();
        let translated = translationMap[keyLower];

        if (!translated) {
          // Try to find partial matches
          for (const [englishKey, vietnameseText] of Object.entries(
            translationMap
          )) {
            if (keyLower.includes(englishKey)) {
              translated = vietnameseText;
              break;
            }
          }
        }

        if (!translated) {
          // Generate based on key patterns
          if (key.includes('title')) {
            translated = `Tiêu đề ${key.split('.')[0]}`;
          } else if (key.includes('description')) {
            translated = `Mô tả cho ${key.split('.')[0]}`;
          } else if (key.includes('button')) {
            translated = `Nút bấm`;
          } else {
            translated = `[Dịch tự động] ${key}`;
          }
        }

        translations[key] = translated;
      } else {
        translations[key] = `[Auto-translated] ${key}`;
      }
    });

    return translations;
  }

  // Get translation statistics
  async getTranslationStats(): Promise<{
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    failedTasks: number;
    lastTranslated: string | null;
  }> {
    try {
      const sortedTasks = [...this.tasks].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      const result = {
        totalTasks: this.tasks.length,
        pendingTasks: this.tasks.filter(t => t.status === 'pending').length,
        completedTasks: this.tasks.filter(t => t.status === 'completed').length,
        failedTasks: this.tasks.filter(t => t.status === 'failed').length,
        lastTranslated: sortedTasks[0]?.updated_at || null,
      };

      return result;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê dịch thuật:', error);
      return {
        totalTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        lastTranslated: null,
      };
    }
  }

  // Get all tasks
  getAllTasks(): TranslationTask[] {
    return [...this.tasks].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Manually trigger translation for a specific page
  async manualTranslate(
    pagePath: string,
    componentName: string
  ): Promise<void> {
    await this.queuePageForTranslation(pagePath, componentName);
  }

  // Batch translate all untranslated pages
  async batchTranslateAll(): Promise<void> {
    await this.processTranslationQueue();
  }

  // Clear all tasks (for testing)
  clearAllTasks(): void {
    this.tasks = [];
    this.saveTasks();
  }
}

export const translationService = TranslationService.getInstance();

// Hook để sử dụng trong components
export const useAutoTranslation = () => {
  const detectPage = (path: string, component: string) => {
    translationService.detectNewPage(path, component);
  };

  const manualTranslate = (path: string, component: string) => {
    translationService.manualTranslate(path, component);
  };

  const batchTranslate = () => {
    translationService.batchTranslateAll();
  };

  const getStats = () => {
    return translationService.getTranslationStats();
  };

  const getTasks = () => {
    return translationService.getAllTasks();
  };

  const clearTasks = () => {
    translationService.clearAllTasks();
  };

  return {
    detectPage,
    manualTranslate,
    batchTranslate,
    getStats,
    getTasks,
    clearTasks,
  };
};
