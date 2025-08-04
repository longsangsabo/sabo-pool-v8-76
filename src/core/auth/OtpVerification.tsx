import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface OtpVerificationProps {
  phone: string;
  onVerifySuccess: (token: string) => void;
  onResendOtp: () => void;
  loading?: boolean;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  phone,
  onVerifySuccess,
  onResendOtp,
  loading = false,
}) => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = () => {
    if (otp.length !== 6) {
      toast.error('Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }
    onVerifySuccess(otp);
  };

  const handleResend = () => {
    onResendOtp();
    setCountdown(60);
    setCanResend(false);
    setOtp('');
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Xác thực OTP
        </h3>
        <p className="text-sm text-gray-600">
          Mã OTP đã được gửi đến số điện thoại
        </p>
        <p className="font-medium text-blue-600">{phone}</p>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Nhập mã OTP (6 số)
        </label>
        <Input
          type="text"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtp(value);
          }}
          placeholder="123456"
          className="w-full h-12 text-lg text-center border-2 border-gray-300 focus:border-blue-500 rounded-xl tracking-widest"
          maxLength={6}
          inputMode="numeric"
          disabled={loading}
        />
      </div>

      <Button
        onClick={handleVerify}
        disabled={loading || otp.length !== 6}
        className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold"
      >
        {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
      </Button>

      <div className="text-center">
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={!canResend || loading}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {canResend 
            ? 'Gửi lại mã OTP' 
            : `Gửi lại sau ${countdown}s`
          }
        </Button>
      </div>
    </div>
  );
};