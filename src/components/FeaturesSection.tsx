import { Trophy, Users, Target, Play, Shield, Crown } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Trophy,
      title: 'HỆ THỐNG XẾP HẠNG',
      description:
        'Hệ thống ELO tiên tiến theo dõi kỹ năng của bạn qua các chế độ chơi và giải đấu khác nhau.',
      gradient: 'from-yellow-400 to-yellow-600',
      glowColor: 'shadow-yellow-400/20',
    },
    {
      icon: Users,
      title: 'GIẢI ĐẤU ĐỒNG ĐỘI',
      description:
        'Lập đội và tham gia giải đấu theo nhóm. Giao tiếp và chiến thuật là chìa khóa chiến thắng.',
      gradient: 'from-blue-400 to-blue-600',
      glowColor: 'shadow-blue-400/20',
    },
    {
      icon: Target,
      title: 'THÁCH THỨC KỸ NĂNG',
      description:
        'Thử thách hàng ngày và mini-game rèn luyện độ chính xác và kỹ thuật của bạn.',
      gradient: 'from-green-400 to-green-600',
      glowColor: 'shadow-green-400/20',
    },
    {
      icon: Play,
      title: 'TRỰC TIẾP LIVE',
      description:
        'Xem trận đấu chuyên nghiệp trực tiếp, học hỏi từ cao thủ và stream gameplay của chính bạn.',
      gradient: 'from-purple-400 to-purple-600',
      glowColor: 'shadow-purple-400/20',
    },
    {
      icon: Shield,
      title: 'HỆ THỐNG CHỐNG GIAN LẬN',
      description:
        'Giám sát tiên tiến đảm bảo công bằng. Trọng tài và công nghệ của chúng tôi bảo đảm tính cạnh tranh.',
      gradient: 'from-red-400 to-red-600',
      glowColor: 'shadow-red-400/20',
    },
    {
      icon: Crown,
      title: 'PHẦN THƯỞNG PREMIUM',
      description:
        'Kiếm skin độc quyền, nâng cấp cơ và giải thưởng tiền mặt thật. Thành viên Premium nhận thưởng cao hơn.',
      gradient: 'from-yellow-400 to-yellow-600',
      glowColor: 'shadow-yellow-400/20',
    },
  ];

  return (
    <section className='py-24 billiards-bg relative overflow-hidden'>
      {/* Background pattern */}
      <div className='absolute inset-0 cue-pattern opacity-10'></div>

      {/* Glowing orbs */}
      <div className='absolute top-10 right-10 w-72 h-72 bg-gradient-to-r from-yellow-400/5 to-green-400/5 rounded-full blur-3xl'></div>
      <div className='absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-r from-green-400/5 to-yellow-400/5 rounded-full blur-3xl'></div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Section header */}
        <div className='text-center mb-20'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-800/40 to-green-600/40 rounded-full border border-yellow-400/30 mb-6 backdrop-blur-sm'>
            <Target className='w-4 h-4 text-yellow-400' />
            <span className='text-sm font-semibold text-yellow-400'>
              TÍNH NĂNG NỔI BẬT
            </span>
          </div>

          <h2 className='text-4xl md:text-6xl font-black text-white mb-6'>
            <span className='white-glow'>TRẢI NGHIỆM</span>
            <br />
            <span className='bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent'>
              ĐẲNG CẤP THẾ GIỚI
            </span>
          </h2>

          <p className='text-xl text-gray-200 max-w-3xl mx-auto'>
            Được xây dựng cho những người chơi nghiêm túc. Mọi tính năng được
            thiết kế để nâng tầm trò chơi của bạn.
          </p>
        </div>

        {/* Features grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group relative card-billiards p-8 rounded-2xl hover:border-yellow-400/50 transition-all duration-500 hover:transform hover:-translate-y-2'
            >
              {/* Icon with gradient background */}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <div className='w-full h-full bg-gray-900 rounded-2xl flex items-center justify-center'>
                  <feature.icon className='w-8 h-8 text-white' />
                </div>
              </div>

              {/* Content */}
              <h3 className='text-xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors duration-300'>
                {feature.title}
              </h3>

              <p className='text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300'>
                {feature.description}
              </p>

              {/* Hover effect overlay */}
              <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'></div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className='text-center mt-16'>
          <div className='inline-flex items-center gap-4'>
            <div className='h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent w-20'></div>
            <span className='text-yellow-400 font-bold text-lg gold-glow'>
              THAM GIA CUỘC THI
            </span>
            <div className='h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent w-20'></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
