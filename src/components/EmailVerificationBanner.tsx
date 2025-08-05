import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (user && !user.email_confirmed_at) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user]);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      if (error) {
        toast.error(`Lỗi gửi email: ${error.message}`);
      } else {
        setEmailSent(true);
        toast.success('Email xác thực đã được gửi lại!');
        setTimeout(() => setEmailSent(false), 5000);
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi gửi email');
    } finally {
      setIsResending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            {emailSent ? (
              <Check className='h-5 w-5 text-green-500' />
            ) : (
              <Mail className='h-5 w-5 text-blue-400' />
            )}
          </div>
          <div className='ml-3'>
            <div className='text-sm'>
              <p className='text-blue-800 font-medium'>
                <strong>📧 Xác thực email:</strong> Vui lòng kiểm tra hộp thư và
                nhấp vào link xác thực để kích hoạt tài khoản.
              </p>
              {emailSent && (
                <p className='text-green-700 text-xs mt-1'>
                  ✅ Email đã được gửi! Vui lòng kiểm tra cả thư mục spam.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleResendVerification}
            disabled={isResending || emailSent}
            className='text-blue-800 border-blue-300 hover:bg-blue-100'
          >
            {isResending ? (
              <>
                <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2'></div>
                Đang gửi...
              </>
            ) : emailSent ? (
              <>
                <Check className='h-3 w-3 mr-2' />
                Đã gửi
              </>
            ) : (
              'Gửi lại'
            )}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsVisible(false)}
            className='text-blue-800 hover:bg-blue-100'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
