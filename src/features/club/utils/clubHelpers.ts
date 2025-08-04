import { VerificationStatus } from '../types/club.types';

export const getVerificationStatusColor = (status: VerificationStatus) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const getVerificationStatusText = (status: VerificationStatus) => {
  switch (status) {
    case 'approved':
      return 'Đã xác thực';
    case 'pending':
      return 'Đang chờ';
    case 'rejected':
      return 'Từ chối';
    default:
      return 'Chưa xác thực';
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
