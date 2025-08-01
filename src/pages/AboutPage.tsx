import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Target, Users, Trophy, Award } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

const AboutPage = () => {
  const stats = [
    { label: 'Hội viên', value: '1,200+', icon: Users },
    { label: 'Giải đấu', value: '50+', icon: Trophy },
    { label: 'CLB tham gia', value: '25+', icon: Target },
    { label: 'Giải thưởng', value: '100+', icon: Award },
  ];

  const team = [
    {
      name: 'Nguyễn Văn A',
      role: 'CEO & Founder',
      bio: 'Chuyên gia bida với 15 năm kinh nghiệm',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=founder&backgroundColor=b6e3f4',
    },
    {
      name: 'Trần Thị B',
      role: 'CTO',
      bio: 'Kỹ sư phần mềm hàng đầu',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=cto&backgroundColor=c0aede',
    },
    {
      name: 'Lê Văn C',
      role: 'Head of Operations',
      bio: 'Quản lý vận hành chuyên nghiệp',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=operations&backgroundColor=fecaca',
    },
  ];

  return (
    <PageLayout variant='full' className='bg-gray-50'>
      <Navigation />

      <div className='pt-16'>
        {/* Hero Section */}
        <div className='bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 text-white py-20'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h1 className='text-4xl md:text-6xl font-bold mb-6'>
              Về SABO ARENA
            </h1>
            <p className='text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed'>
              Nền tảng thi đấu bida chuyên nghiệp hàng đầu Việt Nam với hệ thống
              ranking ELO, giải đấu hàng tuần và cộng đồng game thủ đam mê.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className='py-16 bg-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className='text-center'>
                    <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <Icon className='w-8 h-8 text-blue-600' />
                    </div>
                    <div className='text-3xl font-bold text-gray-900 mb-2'>
                      {stat.value}
                    </div>
                    <div className='text-gray-600'>{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className='py-16 bg-gray-50'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid md:grid-cols-2 gap-12'>
              <div>
                <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                  Sứ Mệnh
                </h2>
                <p className='text-lg text-gray-700 leading-relaxed'>
                  Tạo ra một nền tảng thi đấu bida chuyên nghiệp, công bằng và
                  minh bạch, nơi mọi người có thể thể hiện tài năng, kết nối
                  cộng đồng và phát triển kỹ năng bida của mình.
                </p>
              </div>
              <div>
                <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                  Tầm Nhìn
                </h2>
                <p className='text-lg text-gray-700 leading-relaxed'>
                  Trở thành nền tảng bida số 1 Việt Nam, kết nối hàng triệu
                  người chơi bida trên toàn quốc và đưa môn thể thao này lên một
                  tầm cao mới.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className='py-16 bg-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-gray-900 mb-4'>
                Đội Ngũ Lãnh Đạo
              </h2>
              <p className='text-xl text-gray-600'>
                Những người đang xây dựng tương lai của bida Việt Nam
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {team.map((member, index) => (
                <div
                  key={index}
                  className='text-center bg-gray-50 p-8 rounded-lg'
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className='w-24 h-24 rounded-full mx-auto mb-4'
                  />
                  <h3 className='text-xl font-bold text-gray-900 mb-2'>
                    {member.name}
                  </h3>
                  <p className='text-blue-600 font-medium mb-4'>
                    {member.role}
                  </p>
                  <p className='text-gray-600'>{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className='py-16 bg-gray-50'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Liên Hệ Với Chúng Tôi
            </h2>
            <p className='text-xl text-gray-600 mb-8'>
              Có câu hỏi? Chúng tôi luôn sẵn sàng hỗ trợ bạn
            </p>
            <div className='space-y-4'>
              <p className='text-lg'>
                <strong>Email:</strong> info@sabopool.vn
              </p>
              <p className='text-lg'>
                <strong>Hotline:</strong> 1900 xxxx
              </p>
              <p className='text-lg'>
                <strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP. Hồ Chí Minh
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </PageLayout>
  );
};

export default AboutPage;
