import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Loader2 } from 'lucide-react';
import { useState } from 'react';

const SocialLoginButtons = () => {
  const { toast } = useToast();
  const [socialLoading, setSocialLoading] = useState<string>('');

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    try {
      // ...removed console.log('Attempting Google login...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google login error:', error);

        if (error.message.includes('provider is not enabled')) {
          toast({
            title: 'Chức năng chưa khả dụng',
            description:
              'Đăng nhập Google đang được cấu hình. Vui lòng sử dụng email để đăng ký/đăng nhập.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Lỗi đăng nhập Google',
            description:
              error.message ||
              'Không thể đăng nhập với Google. Vui lòng thử lại.',
            variant: 'destructive',
          });
        }
      } else {
        // ...removed console.log('Google login initiated successfully')
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Lỗi đăng nhập',
        description: `Không thể đăng nhập với Google: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setSocialLoading('');
    }
  };

  const handleFacebookLogin = async () => {
    setSocialLoading('facebook');
    try {
      // ...removed console.log('Attempting Facebook login...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email,public_profile',
        },
      });

      if (error) {
        console.error('Facebook login error:', error);

        if (error.message.includes('provider is not enabled')) {
          toast({
            title: 'Chức năng chưa khả dụng',
            description:
              'Đăng nhập Facebook đang được cấu hình. Vui lòng sử dụng email để đăng ký/đăng nhập.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Lỗi đăng nhập Facebook',
            description:
              error.message ||
              'Không thể đăng nhập với Facebook. Vui lòng thử lại.',
            variant: 'destructive',
          });
        }
      } else {
        // ...removed console.log('Facebook login initiated successfully')
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Lỗi đăng nhập',
        description: `Không thể đăng nhập với Facebook: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setSocialLoading('');
    }
  };

  return (
    <div className='space-y-3'>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-gray-300' />
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='px-2 bg-white text-gray-500'>Hoặc</span>
        </div>
      </div>

      <Button
        type='button'
        variant='outline'
        className='w-full hover:bg-red-50 border-gray-300 transition-all duration-200 group'
        onClick={handleGoogleLogin}
        disabled={socialLoading === 'google'}
      >
        {socialLoading === 'google' ? (
          <Loader2 className='w-5 h-5 mr-2 animate-spin' />
        ) : (
          <svg
            className='w-5 h-5 mr-2 group-hover:scale-110 transition-transform'
            viewBox='0 0 24 24'
          >
            <path
              fill='#4285F4'
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
            />
            <path
              fill='#34A853'
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
            />
            <path
              fill='#FBBC05'
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
            />
            <path
              fill='#EA4335'
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
            />
          </svg>
        )}
        {socialLoading === 'google' ? 'Đang xử lý...' : 'Đăng nhập với Google'}
      </Button>

      <Button
        type='button'
        variant='outline'
        className='w-full hover:bg-blue-50 border-gray-300 transition-all duration-200 group'
        onClick={handleFacebookLogin}
        disabled={socialLoading === 'facebook'}
      >
        {socialLoading === 'facebook' ? (
          <Loader2 className='w-5 h-5 mr-2 animate-spin' />
        ) : (
          <Facebook className='w-5 h-5 mr-2 text-[#1877F2] group-hover:scale-110 transition-transform' />
        )}
        {socialLoading === 'facebook'
          ? 'Đang xử lý...'
          : 'Đăng nhập với Facebook'}
      </Button>

      <div className='text-center'>
        <p className='text-xs text-gray-500 mt-2'>
          💡 <strong>Lưu ý:</strong> Tính năng đăng nhập mạng xã hội đang được
          cấu hình.
          <br />
          Hiện tại vui lòng sử dụng email để đăng ký/đăng nhập.
        </p>
      </div>
    </div>
  );
};

export default SocialLoginButtons;
