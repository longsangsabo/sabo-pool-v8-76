import { useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorContext {
  section?: string;
  action?: string;
  userId?: string;
}

export const useErrorHandler = () => {
  const handleError = useCallback((error: Error, context?: ErrorContext) => {
    console.error('[ErrorHandler]', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Show user-friendly toast
    const section = context?.section || 'Ứng dụng';
    toast.error(`Lỗi ${section}`, {
      description: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
      duration: 5000,
    });
  }, []);

  return { handleError };
};
