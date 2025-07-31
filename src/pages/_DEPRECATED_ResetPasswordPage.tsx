import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if we have a valid session from the reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          title: 'Link không hợp lệ',
          description: 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.',
          variant: 'destructive',
        });
        navigate('/forgot-password');
      }
    });
  }, [navigate, toast]);

  const password = form.watch('password');
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ];

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast({
          title: 'Lỗi',
          description: 'Không thể cập nhật mật khẩu. Vui lòng thử lại.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Thành công!',
          description:
            'Mật khẩu đã được cập nhật. Đang chuyển đến trang đăng nhập...',
        });
        // Sign out to force user to login with new password
        await supabase.auth.signOut();
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          {/* Logo */}
          <div className='flex items-center justify-center space-x-2 mb-6'>
            <div className='w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center'>
              <Target className='w-6 h-6 text-white' />
            </div>
            <span className='text-xl font-bold text-blue-700'>
              SABO POOL ARENA
            </span>
          </div>

          <h2 className='text-3xl font-bold text-gray-900'>Đặt lại mật khẩu</h2>
          <p className='mt-2 text-gray-600'>
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới *</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Tối thiểu 8 ký tự'
                        className='pl-10 pr-10'
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </FormControl>
                  {password && (
                    <div className='space-y-2'>
                      <div className='flex space-x-1'>
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 w-full rounded ${
                              i < passwordStrength
                                ? strengthColors[passwordStrength - 1]
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className='text-xs text-gray-600'>
                        Độ mạnh:{' '}
                        {strengthLabels[passwordStrength - 1] || 'Rất yếu'}
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu mới *</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='Nhập lại mật khẩu mới'
                        className='pl-10 pr-10'
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full bg-blue-700 hover:bg-blue-800'
              disabled={isLoading}
            >
              {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </form>
        </Form>

        <div className='text-center'>
          <Link
            to='/login'
            className='text-blue-600 hover:text-blue-800 font-medium'
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
