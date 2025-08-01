/**
 * Safely formats a date string with fallback options
 * @param primaryDate - The primary date field to use
 * @param fallbackDate - The fallback date field if primary is null/undefined
 * @param options - Formatting options for toLocaleDateString
 * @returns Formatted date string or 'Chưa xác định' if no valid date
 */
export const formatSafeDate = (
  primaryDate: string | null | undefined,
  fallbackDate?: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateToUse = primaryDate || fallbackDate;

  if (!dateToUse) {
    return 'Chưa xác định';
  }

  try {
    const date = new Date(dateToUse);
    if (isNaN(date.getTime())) {
      return 'Chưa xác định';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };

    return date.toLocaleDateString('vi-VN', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Chưa xác định';
  }
};

/**
 * Safely formats a date string with time
 * @param primaryDate - The primary date field to use
 * @param fallbackDate - The fallback date field if primary is null/undefined
 * @returns Formatted date and time string or 'Chưa xác định' if no valid date
 */
export const formatSafeDateWithTime = (
  primaryDate: string | null | undefined,
  fallbackDate?: string | null | undefined
): string => {
  return formatSafeDate(primaryDate, fallbackDate, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
