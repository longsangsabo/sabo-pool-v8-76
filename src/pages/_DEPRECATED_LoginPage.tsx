import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { FacebookLoginButton } from '@/components/auth/FacebookLoginButton';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { handleAuthError } from '@/utils/authHelpers';

const LoginPage = () => {
  // Phone login state
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');

  // Email login state
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('phone');
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
      toast.error(
        'Số điện thoại phải có 10 số và bắt đầu bằng 0 (VD: 0961167717)'
      );
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
      <div className='min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Đăng nhập - SABO Pool Arena</title>
        <meta
          name='description'
          content='Đăng nhập vào SABO Pool Arena để tham gia cộng đồng billiards lớn nhất Việt Nam'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-sm'>
          <CardHeader className='text-center space-y-4'>
            <div className='mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl'>
              🎱
            </div>
            <div>
              <CardTitle className='text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>
                Đăng nhập
              </CardTitle>
              <CardDescription className='text-muted-foreground'>
                SABO Pool Arena - Cộng đồng Billiards #1 Việt Nam
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Social Login */}
            <div className='space-y-3'>
              <GoogleLoginButton />
              <FacebookLoginButton />
            </div>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-border' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-card px-2 text-muted-foreground'>Hoặc</span>
              </div>
            </div>

            {/* Phone/Email Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='phone' className='flex items-center gap-2'>
                  <Phone className='h-4 w-4' />
                  SĐT
                </TabsTrigger>
                <TabsTrigger value='email' className='flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value='phone' className='space-y-4'>
                <Alert className='border-green-200 bg-green-50 text-green-800'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>
                    Sử dụng số điện thoại Việt Nam (10 chữ số, VD: 0961167717)
                    để đăng nhập nhanh chóng.
                  </AlertDescription>
                </Alert>

                <form onSubmit={handlePhoneSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Số điện thoại</Label>
                    <Input
                      id='phone'
                      type='tel'
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder='0961167717'
                      className='h-11'
                      required
                      disabled={loading}
                      maxLength={10}
                      inputMode='numeric'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='phonePassword'>Mật khẩu</Label>
                    <div className='relative'>
                      <Input
                        id='phonePassword'
                        type={showPassword ? 'text' : 'password'}
                        value={phonePassword}
                        onChange={e => setPhonePassword(e.target.value)}
                        placeholder='Nhập mật khẩu'
                        className='h-11 pr-10'
                        required
                        disabled={loading}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                      >
                        {showPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type='submit'
                    disabled={loading}
                    className='w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90'
                  >
                    {loading ? (
                      <div className='flex items-center gap-2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        Đang đăng nhập...
                      </div>
                    ) : (
                      'Đăng nhập với SĐT'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value='email' className='space-y-4'>
                <Alert className='border-blue-200 bg-blue-50 text-blue-800'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>
                    Email đăng ký đã hoạt động! Kiểm tra email để xác thực sau
                    khi đăng ký.
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleEmailSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder='example@email.com'
                      className='h-11'
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='emailPassword'>Mật khẩu</Label>
                    <div className='relative'>
                      <Input
                        id='emailPassword'
                        type={showPassword ? 'text' : 'password'}
                        value={emailPassword}
                        onChange={e => setEmailPassword(e.target.value)}
                        placeholder='Nhập mật khẩu'
                        className='h-11 pr-10'
                        required
                        disabled={loading}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                      >
                        {showPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type='submit'
                    disabled={loading}
                    className='w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90'
                  >
                    {loading ? (
                      <div className='flex items-center gap-2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        Đang đăng nhập...
                      </div>
                    ) : (
                      'Đăng nhập với Email'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className='flex flex-col space-y-4 text-center'>
            <Link
              to='/forgot-password'
              className='text-sm text-primary hover:text-primary/80 transition-colors'
            >
              Quên mật khẩu?
            </Link>

            <div className='text-sm text-muted-foreground'>
              Chưa có tài khoản?{' '}
              <Link
                to='/register'
                className='text-primary hover:text-primary/80 font-medium transition-colors'
              >
                Đăng ký ngay
              </Link>
            </div>

            <Link
              to='/'
              className='text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
              ← Về trang chủ
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;
