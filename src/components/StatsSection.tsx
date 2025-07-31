import { TrendingUp, Users, Trophy, Target } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    {
      icon: Users,
      value: '15,847',
      label: 'NGƯỜI CHƠI ACTIVE',
      change: '+24%',
      trend: 'up',
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      icon: Trophy,
      value: '2,156',
      label: 'GIẢI THƯỞNG ĐÃ TRAO',
      change: '+18%',
      trend: 'up',
      gradient: 'from-yellow-400 to-yellow-600',
    },
    {
      icon: Target,
      value: '89.7%',
      label: 'ĐỘ CHÍNH XÁC',
      change: '+12%',
      trend: 'up',
      gradient: 'from-green-400 to-green-600',
    },
    {
      icon: TrendingUp,
      value: '₫2.8M',
      label: 'TỔNG GIẢI THƯỞNG',
      change: '+156%',
      trend: 'up',
      gradient: 'from-purple-400 to-purple-600',
    },
  ];

  return (
    <section className='py-24 relative overflow-hidden'>
      {/* Dark billiards background */}
      <div className='absolute inset-0 bg-gradient-to-b from-gray-900 via-slate-800 to-green-900'></div>

      {/* Felt texture pattern */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute inset-0 felt-texture'></div>
      </div>

      {/* Glowing elements */}
      <div className='absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-3xl'></div>
      <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl'></div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Section header */}
        <div className='text-center mb-16'>
          <h2 className='text-4xl md:text-5xl font-black text-white mb-4'>
            <span className='bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent'>
              THỐNG KÊ
            </span>{' '}
            <span className='white-glow'>NỀN TẢNG</span>
          </h2>
          <p className='text-xl text-gray-300 max-w-2xl mx-auto'>
            Dữ liệu thời gian thực từ hệ sinh thái cạnh tranh của chúng tôi
          </p>
        </div>

        {/* Stats grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {stats.map((stat, index) => (
            <div
              key={index}
              className='group relative card-billiards p-8 rounded-2xl hover:border-yellow-400/50 transition-all duration-500'
            >
              {/* Icon with gradient */}
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-r ${stat.gradient} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300 pocket-shadow`}
              >
                <div className='w-full h-full bg-gray-900 rounded-xl flex items-center justify-center'>
                  <stat.icon className='w-7 h-7 text-white' />
                </div>
              </div>

              {/* Value */}
              <div className='mb-2'>
                <span className='text-3xl md:text-4xl font-black text-white white-glow'>
                  {stat.value}
                </span>
                <span
                  className={`ml-2 text-sm font-bold px-2 py-1 rounded-full bg-gradient-to-r ${stat.gradient} text-black`}
                >
                  {stat.change}
                </span>
              </div>

              {/* Label */}
              <p className='text-gray-300 font-bold text-sm tracking-wide'>
                {stat.label}
              </p>

              {/* Animated background on hover */}
              <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'></div>
            </div>
          ))}
        </div>

        {/* Bottom section with live indicator */}
        <div className='mt-16 text-center'>
          <div className='inline-flex items-center gap-3 px-6 py-3 card-billiards rounded-full border border-yellow-400/30'>
            <div className='w-2 h-2 bg-yellow-400 rounded-full animate-pulse'></div>
            <span className='text-yellow-400 font-semibold text-sm'>
              DỮ LIỆU TRỰC TIẾP • CẬP NHẬT MỖI 30 GIÂY
            </span>
            <div className='w-2 h-2 bg-yellow-400 rounded-full animate-pulse'></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
