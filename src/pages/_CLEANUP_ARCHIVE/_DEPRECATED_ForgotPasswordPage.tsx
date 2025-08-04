import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password reset attempt:', { email });

    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);

    // Simulate password reset process
    setTimeout(() => {
      toast.success('Email khôi phục mật khẩu đã được gửi!');
      setSent(true);
      setLoading(false);
    }, 1500);
  };

  if (sent) {
    return (
      <>
        <Helmet>
          <title>Kiểm tra email - SABO Billiards</title>
        </Helmet>

        <div className='min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4'>
          <div className='bg-green-800 border border-green-700 rounded-lg p-8 w-full max-w-md text-center'>
            <div className='text-6xl mb-4'>📧</div>
            <h1 className='text-2xl font-bold text-yellow-400 mb-4'>
              Email đã được gửi!
            </h1>
            <p className='text-green-200 mb-6'>
              Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email của bạn.
              Vui lòng kiểm tra hộp thư (kể cả thư mục spam).
            </p>
            <div className='space-y-4'>
              <Link to='/login'>
                <Button className='w-full bg-yellow-400 text-green-900 hover:bg-yellow-500'>
                  Về trang đăng nhập
                </Button>
              </Link>
              <button
                onClick={() => setSent(false)}
                className='text-green-200 hover:text-yellow-400 text-sm'
              >
                Gửi lại email
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Quên mật khẩu - SABO Billiards</title>
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4'>
        <div className='bg-green-800 border border-green-700 rounded-lg p-8 w-full max-w-md'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-yellow-400 mb-2'>
              🔑 Quên mật khẩu
            </h1>
            <p className='text-green-200'>Nhập email để khôi phục mật khẩu</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label className='block text-white text-sm font-medium mb-2'>
                Email
              </label>
              <Input
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='Nhập email đã đăng ký'
                className='w-full'
                required
              />
            </div>

            <Button
              type='submit'
              disabled={loading}
              className='w-full bg-yellow-400 text-green-900 hover:bg-yellow-500'
            >
              {loading ? 'Đang gửi...' : 'Gửi email khôi phục'}
            </Button>
          </form>

          <div className='text-center mt-6 space-y-4'>
            <Link
              to='/login'
              className='text-green-200 hover:text-yellow-400 text-sm'
            >
              ← Về trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
