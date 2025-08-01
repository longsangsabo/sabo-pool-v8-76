import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  EnhancedAuthTabs,
  PhoneTabContent,
  EmailTabContent,
} from '@/components/auth/EnhancedAuthTabs';
import { FacebookLoginButton } from '@/components/auth/FacebookLoginButton';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { TermsCheckbox } from '@/components/auth/TermsCheckbox';
import { OAuthSetupGuide } from '@/components/auth/OAuthSetupGuide';
import { handleAuthError } from '@/utils/authHelpers';
import { Gift } from 'lucide-react';

const EnhancedRegisterPage = () => {
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [phoneConfirmPassword, setPhoneConfirmPassword] = useState('');
  const [phoneFullName, setPhoneFullName] = useState('');

  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [emailFullName, setEmailFullName] = useState('');

  const [phoneTermsAccepted, setPhoneTermsAccepted] = useState(false);
  const [emailTermsAccepted, setEmailTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signUpWithPhone, signUpWithEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !phonePassword || !phoneConfirmPassword || !phoneFullName) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!phoneTermsAccepted) {
      toast.error('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    if (!/^0\d{9}$/.test(phone)) {
      toast.error(
        'Số điện thoại phải có 10 số và bắt đầu bằng 0 (VD: 0961167717)'
      );
      return;
    }

    if (phonePassword !== phoneConfirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (phonePassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUpWithPhone(
        phone,
        phonePassword,
        phoneFullName,
        referralCode
      );

      if (error) {
        handleAuthError(error);
      } else {
        toast.success(
          referralCode
            ? 'Đăng ký thành công! Bạn và người giới thiệu đều nhận được 100 SPA!'
            : 'Đăng ký thành công! Chào mừng bạn đến với SABO ARENA!'
        );
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Phone registration error:', error);
      toast.error('Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !emailPassword || !emailConfirmPassword || !emailFullName) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!emailTermsAccepted) {
      toast.error('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    if (emailPassword !== emailConfirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (emailPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUpWithEmail(
        email,
        emailPassword,
        emailFullName,
        referralCode
      );

      if (error) {
        handleAuthError(error);
      } else {
        toast.success(
          referralCode
            ? 'Đăng ký thành công! Bạn và người giới thiệu đều nhận được 100 SPA! Vui lòng kiểm tra email để xác thực tài khoản.'
            : 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.'
        );
        navigate('/login');
      }
    } catch (error) {
      console.error('Email registration error:', error);
      toast.error('Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Đăng ký - SABO ARENA</title>
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4'>
        <div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>
              🎱 Đăng ký
            </h1>
            <p className='text-gray-600'>SABO ARENA</p>
          </div>

          {referralCode && (
            <Alert className='mb-6 border-green-200 bg-green-50'>
              <Gift className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-800'>
                <strong>Chúc mừng!</strong> Bạn được giới thiệu bởi mã:{' '}
                <strong>{referralCode}</strong>
                <br />
                Bạn sẽ nhận được 100 SPA khi đăng ký thành công!
              </AlertDescription>
            </Alert>
          )}

          <div className='space-y-3'>
            <FacebookLoginButton />
            <GoogleLoginButton />
          </div>
          <OAuthSetupGuide />
          <AuthDivider />

          <EnhancedAuthTabs defaultTab='phone'>
            <PhoneTabContent>
              <form onSubmit={handlePhoneSubmit} className='space-y-4'>
                <Input
                  type='text'
                  value={phoneFullName}
                  onChange={e => setPhoneFullName(e.target.value)}
                  placeholder='Họ và tên'
                  className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                  required
                  disabled={loading}
                />
                <Input
                  type='tel'
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder='0961167717'
                  className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                  required
                  disabled={loading}
                  maxLength={10}
                  inputMode='numeric'
                />
                <Input
                  type='password'
                  value={phonePassword}
                  onChange={e => setPhonePassword(e.target.value)}
                  placeholder='Mật khẩu (ít nhất 6 ký tự)'
                  className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                  required
                  disabled={loading}
                />
                <Input
                  type='password'
                  value={phoneConfirmPassword}
                  onChange={e => setPhoneConfirmPassword(e.target.value)}
                  placeholder='Xác nhận mật khẩu'
                  className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                  required
                  disabled={loading}
                />
                <TermsCheckbox
                  checked={phoneTermsAccepted}
                  onCheckedChange={setPhoneTermsAccepted}
                  disabled={loading}
                />
                <Button
                  type='submit'
                  disabled={loading || !phoneTermsAccepted}
                  className='w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold'
                >
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </Button>
              </form>
            </PhoneTabContent>

            <EmailTabContent>
              <form onSubmit={handleEmailSubmit} className='space-y-4'>
                <Input
                  type='text'
                  value={emailFullName}
                  onChange={e => setEmailFullName(e.target.value)}
                  placeholder='Họ và tên'
                  className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                  required
                  disabled={loading}
                />
                <Input
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='Email'
                  className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                  required
                  disabled={loading}
                />
                <Input
                  type='password'
                  value={emailPassword}
                  onChange={e => setEmailPassword(e.target.value)}
                  placeholder='Mật khẩu (ít nhất 6 ký tự)'
                  className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                  required
                  disabled={loading}
                />
                <Input
                  type='password'
                  value={emailConfirmPassword}
                  onChange={e => setEmailConfirmPassword(e.target.value)}
                  placeholder='Xác nhận mật khẩu'
                  className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                  required
                  disabled={loading}
                />
                <TermsCheckbox
                  checked={emailTermsAccepted}
                  onCheckedChange={setEmailTermsAccepted}
                  disabled={loading}
                />
                <Button
                  type='submit'
                  disabled={loading || !emailTermsAccepted}
                  className='w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold'
                >
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </Button>
              </form>
            </EmailTabContent>
          </EnhancedAuthTabs>

          <div className='text-center mt-6 space-y-4'>
            <div className='text-gray-600 text-sm'>
              Đã có tài khoản?{' '}
              <Link
                to='/login'
                className='text-blue-600 hover:text-blue-800 font-medium'
              >
                Đăng nhập ngay
              </Link>
            </div>
            <Link
              to='/'
              className='inline-block text-gray-500 hover:text-gray-700 text-sm'
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnhancedRegisterPage;
