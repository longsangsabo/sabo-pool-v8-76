import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Wait for auth to load
      if (loading) return;

      if (user) {
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      } else {
        // Auth failed, redirect to login
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
        navigate('/auth/login');
      }
    };

    handleAuthCallback();
  }, [user, loading, navigate]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center'>
      <div className='text-center text-white'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4'></div>
        <p className='text-lg'>Đang xử lý đăng nhập...</p>
        <p className='text-sm text-gray-300 mt-2'>
          Vui lòng đợi trong giây lát
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
