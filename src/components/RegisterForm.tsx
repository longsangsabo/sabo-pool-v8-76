import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Phone, Lock, User, EyeOff, Eye, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SocialLoginButtons from './SocialLoginButtons';
import { ApiError } from '@/types/common';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(100, 'Họ tên không được quá 100 ký tự')
      .regex(
        /^[a-zA-ZÀ-ỹ\s]+$/,
        'Họ tên chỉ được chứa chữ cái và khoảng trắng'
      ),
    email: z.string().email('Email không hợp lệ'),
    phone: z
      .string()
      .regex(/^0\d{9}$/, 'Số điện thoại phải có định dạng 0xxxxxxxxx (10 số)')
      .refine(val => val.length === 10, 'Số điện thoại phải có đúng 10 số'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
      ),
    confirmPassword: z.string(),
    clubId: z.string().optional(),
    agreeTerms: z
      .boolean()
      .refine(val => val === true, 'Bạn phải đồng ý với điều khoản sử dụng'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface Club {
  id: string;
  name: string;
}

const RegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      clubId: '',
      agreeTerms: false,
    },
  });

  // Fetch clubs data
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name')
          .eq('status', 'active')
          .order('name');

        if (error) {
          console.error('Error fetching clubs:', error);
        } else if (data) {
          setClubs(data);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };

    fetchClubs();
  }, []);

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

  // Check for existing email/phone before registration
  const checkExistingUser = async (email: string, phone: string) => {
    console.log('Checking existing user with email:', email, 'phone:', phone);

    // Check email in auth.users through profiles
    const { data: existingProfile, error: profileError } = await (
      supabase as any
    )
      .from('profiles')
      .select('user_id, phone')
      .or(`phone.eq.${phone}`)
      .limit(1);

    if (profileError) {
      console.error('Profile check error:', profileError);
    }

    if (existingProfile && existingProfile.length > 0) {
      if (existingProfile[0].phone === phone) {
        throw new Error('Số điện thoại này đã được sử dụng');
      }
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      console.log('Registration attempt:', {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        clubId: data.clubId,
      });

      // Check existing users first
      await checkExistingUser(data.email, data.phone);

      const { error } = await signUp(data.phone, data.password, data.fullName);

      if (error) {
        console.error('Registration error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Lỗi đăng ký',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Đăng ký thành công!',
          description:
            'Vui lòng kiểm tra email để xác thực tài khoản. Kiểm tra cả thư mục spam nếu không thấy email.',
        });

        // Clear form
        form.reset();

        // Navigate to login page
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Lỗi đăng ký',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Social Login Buttons First */}
      <SocialLoginButtons />

      {/* Divider */}
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-gray-300' />
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='px-2 bg-white text-gray-500'>
            Hoặc đăng ký bằng email
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='fullName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Họ và tên *</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <User className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <Input
                      {...field}
                      type='text'
                      placeholder='VD: Nguyễn Văn A'
                      className='pl-10'
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <Input
                      {...field}
                      type='email'
                      placeholder='example@email.com'
                      className='pl-10'
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại *</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <Input
                      {...field}
                      type='tel'
                      placeholder='0987654321'
                      className='pl-10'
                      maxLength={10}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu *</FormLabel>
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
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
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
                <FormLabel>Xác nhận mật khẩu *</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <Input
                      {...field}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='Nhập lại mật khẩu'
                      className='pl-10 pr-10'
                    />
                    <button
                      type='button'
                      className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='clubId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Câu lạc bộ (tùy chọn)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn câu lạc bộ (không bắt buộc)' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clubs.map(club => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='agreeTerms'
            render={({ field }) => (
              <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className='space-y-1 leading-none'>
                  <FormLabel className='text-sm font-normal'>
                    Tôi đồng ý với{' '}
                    <Link
                      to='/terms'
                      target='_blank'
                      className='text-blue-600 hover:text-blue-800 underline'
                    >
                      Điều khoản sử dụng
                    </Link>{' '}
                    và{' '}
                    <Link
                      to='/privacy'
                      target='_blank'
                      className='text-blue-600 hover:text-blue-800 underline'
                    >
                      Chính sách bảo mật
                    </Link>
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormMessage />

          <Button
            type='submit'
            className='w-full bg-blue-700 hover:bg-blue-800'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Đang tạo tài khoản...
              </>
            ) : (
              'Tạo tài khoản'
            )}
          </Button>
        </form>
      </Form>

      <div className='text-center text-sm'>
        <span className='text-gray-600'>Đã có tài khoản? </span>
        <Link
          to='/login'
          className='text-blue-600 hover:text-blue-800 font-medium'
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;
