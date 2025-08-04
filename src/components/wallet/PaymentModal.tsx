import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  fee: number;
  minAmount: number;
  maxAmount: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  type: 'deposit' | 'withdraw' | 'membership';
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  type,
  onSuccess,
  onError,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<
    'select' | 'details' | 'confirm' | 'processing' | 'success' | 'error'
  >('select');
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    bankName: '',
    phoneNumber: '',
    email: '',
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      icon: <Building2 className='h-6 w-6' />,
      description: 'Chuyển khoản trực tiếp từ tài khoản ngân hàng',
      processingTime: '5-10 phút',
      fee: 0,
      minAmount: 50000,
      maxAmount: 50000000,
    },
    {
      id: 'momo',
      name: 'Ví MoMo',
      icon: <Smartphone className='h-6 w-6' />,
      description: 'Thanh toán qua ví điện tử MoMo',
      processingTime: 'Tức thì',
      fee: 0,
      minAmount: 10000,
      maxAmount: 20000000,
    },
    {
      id: 'zalopay',
      name: 'ZaloPay',
      icon: <Smartphone className='h-6 w-6' />,
      description: 'Thanh toán qua ZaloPay',
      processingTime: 'Tức thì',
      fee: 0,
      minAmount: 10000,
      maxAmount: 20000000,
    },
    {
      id: 'qr_code',
      name: 'QR Code',
      icon: <QrCode className='h-6 w-6' />,
      description: 'Quét mã QR để thanh toán',
      processingTime: 'Tức thì',
      fee: 0,
      minAmount: 10000,
      maxAmount: 5000000,
    },
    {
      id: 'credit_card',
      name: 'Thẻ tín dụng/Ghi nợ',
      icon: <CreditCard className='h-6 w-6' />,
      description: 'Thanh toán qua thẻ Visa/Mastercard',
      processingTime: 'Tức thì',
      fee: 1500,
      minAmount: 50000,
      maxAmount: 10000000,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'deposit':
        return 'Nạp điểm';
      case 'withdraw':
        return 'Rút điểm';
      case 'membership':
        return 'Nâng cấp thành viên';
      default:
        return 'Thanh toán';
    }
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep('details');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newTransactionId = `TXN_${Date.now()}`;
      setTransactionId(newTransactionId);

      if (selectedMethod === 'qr_code') {
        setQrCodeUrl(
          'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=payment_qr_code_data'
        );
      }

      setStep('success');
      onSuccess(newTransactionId);
    } catch (error) {
      setStep('error');
      onError('Có lỗi xảy ra trong quá trình xử lý thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText('1234567890');
  };

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <div className='space-y-4'>
            <div className='text-center mb-6'>
              <h3 className='text-lg font-medium mb-2'>{getTypeTitle()}</h3>
              <div className='text-2xl font-bold text-blue-600'>
                {formatCurrency(amount)}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {paymentMethods.map(method => (
                <Card
                  key={method.id}
                  className='cursor-pointer hover:shadow-md transition-shadow'
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='p-2 bg-blue-100 rounded-full text-blue-600'>
                        {method.icon}
                      </div>
                      <div>
                        <div className='font-medium'>{method.name}</div>
                        <div className='text-sm text-gray-600'>
                          {method.description}
                        </div>
                      </div>
                    </div>

                    <div className='space-y-2 text-sm text-gray-600'>
                      <div>Thời gian xử lý: {method.processingTime}</div>
                      <div>
                        Phí:{' '}
                        {method.fee > 0
                          ? formatCurrency(method.fee)
                          : 'Miễn phí'}
                      </div>
                      <div>
                        Giới hạn: {formatCurrency(method.minAmount)} -{' '}
                        {formatCurrency(method.maxAmount)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'details':
        const selectedMethodData = paymentMethods.find(
          m => m.id === selectedMethod
        );
        return (
          <div className='space-y-4'>
            <div className='text-center mb-6'>
              <h3 className='text-lg font-medium mb-2'>Thông tin thanh toán</h3>
              <div className='flex items-center justify-center gap-2 text-sm text-gray-600'>
                {selectedMethodData?.icon}
                <span>{selectedMethodData?.name}</span>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className='space-y-4'>
              {selectedMethod === 'bank_transfer' && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Số tài khoản
                    </label>
                    <Input
                      value={formData.accountNumber}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          accountNumber: e.target.value,
                        })
                      }
                      placeholder='Nhập số tài khoản'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Tên chủ tài khoản
                    </label>
                    <Input
                      value={formData.accountName}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          accountName: e.target.value,
                        })
                      }
                      placeholder='Nhập tên chủ tài khoản'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Ngân hàng
                    </label>
                    <Input
                      value={formData.bankName}
                      onChange={e =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder='Nhập tên ngân hàng'
                      required
                    />
                  </div>
                </>
              )}

              {(selectedMethod === 'momo' || selectedMethod === 'zalopay') && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Số điện thoại
                  </label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={e =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder='Nhập số điện thoại'
                    required
                  />
                </div>
              )}

              {selectedMethod === 'credit_card' && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Số thẻ
                    </label>
                    <Input placeholder='1234 5678 9012 3456' required />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Ngày hết hạn
                      </label>
                      <Input placeholder='MM/YY' required />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        CVV
                      </label>
                      <Input placeholder='123' required />
                    </div>
                  </div>
                </>
              )}

              <div className='flex gap-2 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setStep('select')}
                  className='flex-1'
                >
                  Quay lại
                </Button>
                <Button type='submit' className='flex-1'>
                  Tiếp tục
                </Button>
              </div>
            </form>
          </div>
        );

      case 'confirm':
        const method = paymentMethods.find(m => m.id === selectedMethod);
        const totalAmount = amount + (method?.fee || 0);
        return (
          <div className='space-y-4'>
            <div className='text-center mb-6'>
              <h3 className='text-lg font-medium mb-2'>Xác nhận thanh toán</h3>
            </div>

            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span>Số tiền:</span>
                <span className='font-medium'>{formatCurrency(amount)}</span>
              </div>
              {method?.fee > 0 && (
                <div className='flex justify-between'>
                  <span>Phí giao dịch:</span>
                  <span className='font-medium'>
                    {formatCurrency(method.fee)}
                  </span>
                </div>
              )}
              <div className='border-t pt-3'>
                <div className='flex justify-between font-bold'>
                  <span>Tổng cộng:</span>
                  <span className='text-lg'>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className='bg-blue-50 p-4 rounded-lg'>
              <div className='flex items-center gap-2 mb-2'>
                <AlertCircle className='h-4 w-4 text-blue-600' />
                <span className='font-medium text-blue-800'>Lưu ý</span>
              </div>
              <p className='text-sm text-blue-700'>
                Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Giao dịch sẽ
                được xử lý trong {method?.processingTime}.
              </p>
            </div>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setStep('details')}
                className='flex-1'
              >
                Quay lại
              </Button>
              <Button onClick={handleConfirm} className='flex-1'>
                Xác nhận thanh toán
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className='text-center py-8'>
            <Loader2 className='h-12 w-12 animate-spin text-blue-600 mx-auto mb-4' />
            <h3 className='text-lg font-medium mb-2'>Đang xử lý thanh toán</h3>
            <p className='text-gray-600'>Vui lòng chờ trong giây lát...</p>
          </div>
        );

      case 'success':
        return (
          <div className='text-center py-8'>
            <CheckCircle className='h-12 w-12 text-green-600 mx-auto mb-4' />
            <h3 className='text-lg font-medium mb-2'>Thanh toán thành công!</h3>
            <p className='text-gray-600 mb-4'>
              Giao dịch của bạn đã được xử lý thành công.
            </p>

            {qrCodeUrl && (
              <div className='mb-4'>
                <p className='text-sm text-gray-600 mb-2'>
                  Quét mã QR để hoàn tất thanh toán:
                </p>
                <img
                  src={qrCodeUrl}
                  alt='QR Code'
                  className='mx-auto border rounded-lg'
                />
              </div>
            )}

            <div className='bg-green-50 p-4 rounded-lg mb-4'>
              <div className='text-sm'>
                <div className='font-medium'>Mã giao dịch: {transactionId}</div>
                <div>Số tiền: {formatCurrency(amount)}</div>
                <div>
                  Phương thức:{' '}
                  {paymentMethods.find(m => m.id === selectedMethod)?.name}
                </div>
              </div>
            </div>

            <Button onClick={onClose} className='w-full'>
              Hoàn tất
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className='text-center py-8'>
            <AlertCircle className='h-12 w-12 text-red-600 mx-auto mb-4' />
            <h3 className='text-lg font-medium mb-2'>Thanh toán thất bại</h3>
            <p className='text-gray-600 mb-4'>
              Có lỗi xảy ra trong quá trình xử lý thanh toán. Vui lòng thử lại.
            </p>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setStep('select')}
                className='flex-1'
              >
                Thử lại
              </Button>
              <Button onClick={onClose} className='flex-1'>
                Đóng
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {getTypeTitle()}
          </DialogTitle>
        </DialogHeader>

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};
