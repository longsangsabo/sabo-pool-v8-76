import { Button } from '@/components/ui/button';
import { Facebook, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const FacebookLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const { signInWithFacebook } = useAuth();

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      console.log('Initiating Facebook login...');
      const { error } = await signInWithFacebook();

      if (error) {
        console.error('Facebook login error details:', {
          message: error.message,
          code: error.code || 'No code',
          status: error.status || 'No status',
        });

        if (error.message.includes('provider is not enabled')) {
          toast.error(
            '❌ Facebook OAuth chưa được kích hoạt trong Supabase Dashboard. Vui lòng kích hoạt tại Authentication > Providers.'
          );
        } else if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('OAuth')
        ) {
          toast.error(
            '❌ Facebook OAuth chưa được cấu hình đúng. Cần tạo Facebook App và thêm App ID/Secret vào Supabase.'
          );
        } else {
          toast.error(`❌ Lỗi Facebook Login: ${error.message}`);
        }
      } else {
        console.log('Facebook login initiated successfully');
      }
    } catch (error) {
      console.error('Facebook login catch error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định';
      toast.error(`❌ Không thể đăng nhập với Facebook: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type='button'
      variant='outline'
      className='w-full hover:bg-blue-50 border-gray-300 transition-all duration-200 group'
      onClick={handleFacebookLogin}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className='w-5 h-5 mr-2 animate-spin' />
      ) : (
        <Facebook className='w-5 h-5 mr-2 text-[#1877F2] group-hover:scale-110 transition-transform' />
      )}
      {loading ? 'Đang xử lý...' : 'Tiếp tục với Facebook'}
    </Button>
  );
};
