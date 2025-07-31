import { Target } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className='min-h-screen flex'>
      {/* Form Section - Left */}
      <div className='flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white'>
        <div className='max-w-md w-full space-y-8'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold text-gray-900'>{title}</h2>
            <p className='mt-2 text-gray-600'>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

      {/* Hero Section - Right */}
      <div className='hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600'>
        <div className='absolute inset-0 bg-black/30'></div>
        <div className='relative flex flex-col justify-center items-center text-white p-12'>
          <div className='text-center space-y-8'>
            {/* Logo */}
            <div className='flex items-center justify-center space-x-3'>
              <div className='w-12 h-12 bg-white rounded-lg flex items-center justify-center'>
                <Target className='w-8 h-8 text-blue-700' />
              </div>
              <span className='text-3xl font-bold'>SABO ARENA</span>
            </div>

            {/* Tagline */}
            <h3 className='text-2xl font-semibold'>
              Cộng đồng Bida Chuyên nghiệp Việt Nam
            </h3>

            {/* Stats */}
            <div className='space-y-4'>
              <div className='flex items-center justify-center space-x-2'>
                <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
                <span className='text-lg'>1,200+ Hội viên</span>
              </div>
              <div className='flex items-center justify-center space-x-2'>
                <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
                <span className='text-lg'>50+ Giải đấu</span>
              </div>
              <div className='flex items-center justify-center space-x-2'>
                <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
                <span className='text-lg'>25+ CLB tham gia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
