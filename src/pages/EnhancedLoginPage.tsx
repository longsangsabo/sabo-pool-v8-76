import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { OAuthSetupGuide } from '@/components/auth/OAuthSetupGuide';
import { handleAuthError } from '@/utils/authHelpers';

const EnhancedLoginPage = () => {
  // Phone login state
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');

  // Email login state
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    signInWithPhone,
    signInWithEmail,
    user,
    loading: authLoading,
  } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !phonePassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Validate phone format
    if (!/^0\d{9}$/.test(phone)) {
      toast.error('Số điện thoại phải có định dạng 0xxxxxxxxx');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signInWithPhone(phone, phonePassword);

      if (error) {
        handleAuthError(error);
      } else {
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Phone login error:', error);
      toast.error('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !emailPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signInWithEmail(email, emailPassword);

      if (error) {
        handleAuthError(error);
      } else {
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Email login error:', error);
      toast.error('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center'>
        <div className='text-center text-white'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4'></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Đăng nhập - SABO ARENA</title>
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4'>
        <div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>
              🎱 Đăng nhập
            </h1>
            <p className='text-gray-600'>SABO ARENA</p>
          </div>

          {/* Social Login Buttons */}
          <div className='space-y-3'>
            <FacebookLoginButton />
            <GoogleLoginButton />
          </div>

          <OAuthSetupGuide />

          <AuthDivider />

          {/* Phone/Email Tabs */}
          <EnhancedAuthTabs defaultTab='phone'>
            <PhoneTabContent>
              <form onSubmit={handlePhoneSubmit} className='space-y-4'>
                <div>
                  <label className='block text-gray-700 text-sm font-medium mb-2'>
                    Số điện thoại
                  </label>
                  <Input
                    type='tel'
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder='0987654321'
                    className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                    required
                    disabled={loading}
                    maxLength={10}
                    inputMode='numeric'
                  />
                </div>

                <div>
                  <label className='block text-gray-700 text-sm font-medium mb-2'>
                    Mật khẩu
                  </label>
                  <Input
                    type='password'
                    value={phonePassword}
                    onChange={e => setPhonePassword(e.target.value)}
                    placeholder='Nhập mật khẩu'
                    className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type='submit'
                  disabled={loading}
                  className='w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold'
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>
            </PhoneTabContent>

            <EmailTabContent>
              <form onSubmit={handleEmailSubmit} className='space-y-4'>
                <div>
                  <label className='block text-gray-700 text-sm font-medium mb-2'>
                    Email
                  </label>
                  <Input
                    type='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder='example@email.com'
                    className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className='block text-gray-700 text-sm font-medium mb-2'>
                    Mật khẩu
                  </label>
                  <Input
                    type='password'
                    value={emailPassword}
                    onChange={e => setEmailPassword(e.target.value)}
                    placeholder='Nhập mật khẩu'
                    className='w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl'
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type='submit'
                  disabled={loading}
                  className='w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold'
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>
            </EmailTabContent>
          </EnhancedAuthTabs>

          <div className='text-center mt-6 space-y-4'>
            <Link
              to='/forgot-password'
              className='text-blue-600 hover:text-blue-800 text-sm font-medium'
            >
              Quên mật khẩu?
            </Link>

            <div className='text-gray-600 text-sm'>
              Chưa có tài khoản?{' '}
              <Link
                to='/register'
                className='text-blue-600 hover:text-blue-800 font-medium'
              >
                Đăng ký ngay
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

export default EnhancedLoginPage;
