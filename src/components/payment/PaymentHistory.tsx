import React from 'react';
import { DisabledFeature } from '@/components/DisabledFeature';

const PaymentHistory = () => {
  return (
    <DisabledFeature
      title='Lịch sử thanh toán'
      description='Tính năng lịch sử thanh toán đang được phát triển. Bảng payment_transactions chưa được tạo trong cơ sở dữ liệu.'
    />
  );
};

export default PaymentHistory;
