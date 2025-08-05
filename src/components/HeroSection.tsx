import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Play, Trophy, Users, Target } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
      {/* Background with felt texture */}
      <div className='absolute inset-0 felt-texture'></div>

      {/* Glowing orbs */}
      <div className='absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-yellow-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse'></div>
      <div className='absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse delay-1000'></div>

      {/* Cue pattern overlay */}
      <div className='absolute inset-0 cue-pattern opacity-5'></div>

      {/* Main content */}
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        {/* Logo area */}
        <div className='mb-8'>
          <div className='flex justify-center mb-6'>
            <img
              src='/lovable-uploads/5edec650-8645-4f77-a54a-e6d9bfc42ee6.png'
              alt='SABO ARENA Logo'
              className='h-20 md:h-24 w-auto object-contain'
            />
          </div>
        </div>

        {/* Main headline */}
        <div className='mb-12'>
          <h2 className='text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight'>
            <span className='white-glow'>ĐẤNG CAO THỦ</span>
            <br />
            <span className='bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent'>
              BIDA VIỆT NAM
            </span>
          </h2>

          <p className='text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto mb-8 leading-relaxed'>
            Nền tảng thi đấu bida chuyên nghiệp với hệ thống ranking ELO, giải
            đấu hàng tuần và cộng đồng game thủ hàng đầu Việt Nam
          </p>
        </div>

        {/* Stats bar */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-12'>
          {[
            { icon: Users, value: '15,847', label: 'NGƯỜI CHƠI' },
            { icon: Trophy, value: '2,156', label: 'GIẢI THƯỞNG' },
            { icon: Target, value: '89.7%', label: 'ĐỘ CHÍNH XÁC' },
            { icon: Play, value: '24/7', label: 'TRỰC TUYẾN' },
          ].map((stat, index) => (
            <div key={index} className='text-center'>
              <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400/20 to-green-400/20 rounded-lg mb-3 border border-yellow-400/30'>
                <stat.icon className='w-6 h-6 text-yellow-400' />
              </div>
              <div className='text-2xl md:text-3xl font-black text-white white-glow'>
                {stat.value}
              </div>
              <div className='text-sm font-bold text-gray-300'>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className='flex flex-col sm:flex-row gap-6 justify-center items-center mb-16'>
          <Link to='/register'>
            <Button className='btn-gold text-lg px-8 py-4 h-auto font-bold shadow-2xl hover:shadow-yellow-400/50 transition-all duration-300'>
              <Trophy className='w-5 h-5 mr-2' />
              THAM GIA ARENA
            </Button>
          </Link>

          <Link to='/tournaments'>
            <Button
              variant='outline'
              className='text-lg px-8 py-4 h-auto font-bold border-2 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400 transition-all duration-300'
            >
              <Play className='w-5 h-5 mr-2' />
              XEM GIẢI ĐẤU
            </Button>
          </Link>
        </div>

        {/* Achievement badges */}
        <div className='flex flex-wrap justify-center gap-4'>
          {[
            '🏆 TOP #1 VIETNAM',
            '⭐ 5-STAR RATING',
            '🔥 50K+ MATCHES',
            '💎 PREMIUM EXPERIENCE',
          ].map((badge, index) => (
            <div
              key={index}
              className='px-4 py-2 bg-gradient-to-r from-green-800/40 to-green-600/40 rounded-full border border-yellow-400/30 backdrop-blur-sm'
            >
              <span className='text-sm font-semibold text-yellow-400'>
                {badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating pool balls */}
      <div className='absolute top-1/4 left-10 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-bounce delay-500 opacity-30'></div>
      <div className='absolute top-1/3 right-16 w-6 h-6 bg-gradient-to-r from-red-500 to-red-700 rounded-full animate-bounce delay-1000 opacity-30'></div>
      <div className='absolute bottom-1/4 left-1/4 w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full animate-bounce delay-700 opacity-30'></div>
      <div className='absolute bottom-1/3 right-1/3 w-5 h-5 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full animate-bounce delay-300 opacity-30'></div>
    </section>
  );
};

export default HeroSection;
