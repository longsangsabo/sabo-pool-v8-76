import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Trophy,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  CreditCard,
  ExternalLink,
  Copy,
  Download,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import {
  TournamentRegistrationFormData,
  REGISTRATION_RANKS,
  PAYMENT_METHODS,
  EXPERIENCE_LEVELS,
} from '@/schemas/tournamentRegistrationSchema';

interface ConfirmationStepProps {
  form: UseFormReturn<TournamentRegistrationFormData>;
  selectedTournament: any;
  paymentUrl?: string | null;
  onComplete: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  form,
  selectedTournament,
  paymentUrl,
  onComplete,
}) => {
  const watchedData = form.watch();

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy - HH:mm', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const getRankLabel = (rankValue: string) => {
    return (
      REGISTRATION_RANKS.find(r => r.value === rankValue)?.label || rankValue
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    return PAYMENT_METHODS.find(p => p.value === method)?.label || method;
  };

  const getExperienceLabel = (experience: string) => {
    return (
      EXPERIENCE_LEVELS.find(e => e.value === experience)?.label || experience
    );
  };

  const handleCopyRegistrationInfo = () => {
    const info = `
THÔNG TIN ĐĂNG KÝ GIẢI ĐẤU

Giải đấu: ${selectedTournament?.name}
Họ tên: ${watchedData.player_name}
Số điện thoại: ${watchedData.phone}
Email: ${watchedData.email || 'Không có'}
Hạng: ${getRankLabel(watchedData.current_rank)}
Phí đăng ký: ${selectedTournament?.entry_fee?.toLocaleString('vi-VN')}đ
Thời gian: ${formatDateTime(selectedTournament?.tournament_start)}
Địa điểm: ${selectedTournament?.venue_address}
    `.trim();

    navigator.clipboard.writeText(info);
    toast.success('Đã sao chép thông tin đăng ký');
  };

  const handlePayNow = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      toast.info('Đã mở cổng thanh toán. Vui lòng hoàn tất giao dịch.');
    }
  };

  const getStatusMessage = () => {
    if (watchedData.payment_method === 'vnpay' && paymentUrl) {
      return {
        type: 'payment_required',
        title: 'Cần thanh toán để hoàn tất',
        message:
          'Đăng ký đã được ghi nhận. Vui lòng thanh toán để xác nhận tham gia.',
        color: 'warning',
      };
    } else if (watchedData.payment_method === 'cash') {
      return {
        type: 'pending_payment',
        title: 'Đăng ký thành công',
        message:
          'Vui lòng thanh toán tiền mặt tại địa điểm thi đấu trước giờ thi đấu 30 phút.',
        color: 'success',
      };
    } else if (watchedData.payment_method === 'transfer') {
      return {
        type: 'transfer_required',
        title: 'Cần chuyển khoản',
        message:
          'Thông tin chuyển khoản sẽ được gửi qua email. Vui lòng hoàn tất trong 24h.',
        color: 'info',
      };
    }

    return {
      type: 'success',
      title: 'Đăng ký thành công',
      message: 'Chúc mừng! Bạn đã đăng ký thành công.',
      color: 'success',
    };
  };

  const status = getStatusMessage();

  return (
    <div className='space-y-6'>
      {/* Success Header */}
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='p-4 bg-green-100 dark:bg-green-900/20 rounded-full'>
            <CheckCircle className='h-12 w-12 text-green-600 dark:text-green-400' />
          </div>
        </div>

        <div>
          <h3 className='text-2xl font-bold text-green-700 dark:text-green-400 mb-2'>
            {status.title}
          </h3>
          <p className='text-muted-foreground max-w-md mx-auto'>
            {status.message}
          </p>
        </div>
      </div>

      {/* Payment Action (if required) */}
      {watchedData.payment_method === 'vnpay' && paymentUrl && (
        <Card className='border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800'>
          <CardContent className='p-6 text-center'>
            <div className='space-y-4'>
              <div className='flex justify-center'>
                <CreditCard className='h-8 w-8 text-yellow-600' />
              </div>
              <div>
                <h4 className='font-semibold text-yellow-800 dark:text-yellow-400 mb-2'>
                  Hoàn tất thanh toán
                </h4>
                <p className='text-sm text-yellow-700 dark:text-yellow-300 mb-4'>
                  Nhấn nút bên dưới để chuyển đến cổng thanh toán VNPAY an toàn
                </p>
                <Button
                  onClick={handlePayNow}
                  className='bg-yellow-600 hover:bg-yellow-700 text-white'
                >
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Thanh toán ngay
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-primary' />
            Thông tin giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div>
                <p className='text-sm text-muted-foreground'>Tên giải:</p>
                <p className='font-medium'>{selectedTournament?.name}</p>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Thời gian:</p>
                <p className='font-medium flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  {formatDateTime(selectedTournament?.tournament_start)}
                </p>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Địa điểm:</p>
                <p className='font-medium flex items-center gap-2'>
                  <MapPin className='h-4 w-4' />
                  {selectedTournament?.venue_address}
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <div>
                <p className='text-sm text-muted-foreground'>Hạng giải:</p>
                <Badge variant='secondary'>
                  Hạng {selectedTournament?.tier}
                </Badge>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Phí tham gia:</p>
                <p className='font-medium flex items-center gap-2'>
                  <DollarSign className='h-4 w-4' />
                  {selectedTournament?.entry_fee?.toLocaleString('vi-VN')}đ
                </p>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Giải thưởng:</p>
                <p className='font-medium flex items-center gap-2'>
                  <Trophy className='h-4 w-4' />
                  {selectedTournament?.prize_pool?.toLocaleString('vi-VN')}đ
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Thông tin đăng ký
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div>
                <p className='text-sm text-muted-foreground'>Họ tên:</p>
                <p className='font-medium'>{watchedData.player_name}</p>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Số điện thoại:</p>
                <p className='font-medium flex items-center gap-2'>
                  <Phone className='h-4 w-4' />
                  {watchedData.phone}
                </p>
              </div>

              {watchedData.email && (
                <div>
                  <p className='text-sm text-muted-foreground'>Email:</p>
                  <p className='font-medium flex items-center gap-2'>
                    <Mail className='h-4 w-4' />
                    {watchedData.email}
                  </p>
                </div>
              )}
            </div>

            <div className='space-y-3'>
              <div>
                <p className='text-sm text-muted-foreground'>Hạng hiện tại:</p>
                <Badge variant='outline'>
                  {getRankLabel(watchedData.current_rank)}
                </Badge>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Tuổi:</p>
                <p className='font-medium'>{watchedData.age} tuổi</p>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Kinh nghiệm:</p>
                <p className='font-medium'>
                  {getExperienceLabel(watchedData.tournament_experience)}
                </p>
              </div>
            </div>
          </div>

          {watchedData.notes && (
            <>
              <Separator />
              <div>
                <p className='text-sm text-muted-foreground mb-2'>Ghi chú:</p>
                <p className='text-sm bg-muted p-3 rounded-lg'>
                  {watchedData.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Thông tin thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                Phương thức:
              </span>
              <span className='font-medium'>
                {getPaymentMethodLabel(watchedData.payment_method)}
              </span>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>Trạng thái:</span>
              <Badge
                variant={status.type === 'success' ? 'default' : 'secondary'}
              >
                {watchedData.payment_method === 'vnpay' && paymentUrl
                  ? 'Chờ thanh toán'
                  : watchedData.payment_method === 'cash'
                    ? 'Thanh toán tại chỗ'
                    : watchedData.payment_method === 'transfer'
                      ? 'Chờ chuyển khoản'
                      : 'Hoàn tất'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Alert>
        <CheckCircle className='h-4 w-4' />
        <AlertDescription>
          <strong>Bước tiếp theo:</strong>
          <ul className='list-disc list-inside mt-2 space-y-1 text-sm'>
            {watchedData.payment_method === 'vnpay' && paymentUrl && (
              <li>Hoàn tất thanh toán qua VNPAY</li>
            )}
            {watchedData.payment_method === 'cash' && (
              <li>Đến địa điểm thi đấu sớm 30 phút để thanh toán</li>
            )}
            {watchedData.payment_method === 'transfer' && (
              <li>Kiểm tra email để nhận thông tin chuyển khoản</li>
            )}
            <li>Theo dõi email/SMS để nhận thông báo về lịch thi đấu</li>
            <li>Chuẩn bị trang phục và thiết bị thi đấu</li>
            <li>Đến đúng giờ theo lịch được thông báo</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-3 justify-center'>
        <Button
          variant='outline'
          onClick={handleCopyRegistrationInfo}
          className='flex items-center gap-2'
        >
          <Copy className='h-4 w-4' />
          Sao chép thông tin
        </Button>

        <Button
          onClick={onComplete}
          className='bg-gradient-to-r from-primary to-primary/80'
        >
          <CheckCircle className='h-4 w-4 mr-2' />
          Hoàn tất
        </Button>
      </div>

      {/* Contact Support */}
      <div className='text-center text-sm text-muted-foreground'>
        <p>
          Cần hỗ trợ? Liên hệ: <strong>0901234567</strong> hoặc{' '}
          <strong>support@sabopoolhub.com</strong>
        </p>
      </div>
    </div>
  );
};
