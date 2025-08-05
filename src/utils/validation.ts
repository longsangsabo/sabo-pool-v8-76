export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!email) return 'Email là bắt buộc';
  if (!emailRegex.test(email)) return 'Email không hợp lệ';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^0\d{9}$/;
  if (!phone) return 'Số điện thoại là bắt buộc';
  if (!phoneRegex.test(phone))
    return 'Số điện thoại phải có 10 số và bắt đầu bằng 0 (VD: 0961167717)';
  return null;
};

export const formatPhoneToE164 = (phone: string): string => {
  // Convert Vietnamese phone format (0xxxxxxxxx) to E.164 format (+84xxxxxxxxx)
  if (phone.startsWith('0')) {
    return '+84' + phone.substring(1);
  }
  return phone;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Mật khẩu là bắt buộc';
  if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
  if (!/\d/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 số';
  if (!/[a-zA-Z]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ cái';
  return null;
};

export const validateRequired = (
  value: string,
  fieldName: string
): string | null => {
  if (!value.trim()) return `${fieldName} là bắt buộc`;
  return null;
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
};
