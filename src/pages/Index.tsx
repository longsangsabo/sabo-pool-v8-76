import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Trophy,
  Users,
  Calendar,
  Star,
  PlayCircle,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import saboClubBg from '@/assets/sabo-club-bg.jpg';

const Index = () => {

  React.useEffect(() => {

    return () => {

    };
  }, []);

  return (
    <>
      <Helmet>
        <title>SABO ARENA - CLB Billiards Chuyên Nghiệp</title>
        <meta
          name='description'
          content='SABO ARENA - Câu lạc bộ billiards chuyên nghiệp với hệ thống xếp hạng ELO, giải đấu và không gian chơi đẳng cấp'
        />
        <meta
          name='keywords'
          content='billiards, pool, vietnam, tournament, ranking, arena'
        />
      </Helmet>

      <div className='min-h-screen relative'>
        {/* Background Image */}
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: `url(${saboClubBg})` }}
        >
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/80 to-slate-900/70'></div>
        </div>
        {/* Header */}
        <header className='relative z-10 container mx-auto px-4 py-6 flex justify-between items-center backdrop-blur-sm bg-slate-900/20 rounded-lg mx-4 mt-4'>
          <div className='flex items-center space-x-2'>
            <Target className='h-8 w-8 text-yellow-400' />
            <h1 className='text-2xl font-bold text-white'>SABO ARENA</h1>
          </div>
          <div className='flex space-x-4'>
            <Link to='/login'>
              <Button
                variant='outline'
                className='text-white border-white hover:bg-white hover:text-slate-900'
              >
                Đăng nhập
              </Button>
            </Link>
            <Link to='/register'>
              <Button className='bg-yellow-400 text-slate-900 hover:bg-yellow-500'>
                Đăng ký
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section - Tablet Optimized */}
        <section className='relative z-10 container mx-auto px-4 tablet:px-8 py-20 tablet:py-24 text-center'>
          <Badge className='mb-4 tablet:mb-6 bg-yellow-400 text-slate-900 tablet:text-lg tablet:px-4 tablet:py-2'>
            CLB Billiards Chuyên Nghiệp
          </Badge>
          <h1 className='text-5xl md:text-6xl tablet:text-7xl xl:text-8xl font-bold text-white mb-6 tablet:mb-8 leading-tight'>
            Chào Mừng Đến
            <br />
            <span className='text-yellow-400'>SABO ARENA</span>
          </h1>
          <p className='text-xl tablet:text-2xl text-gray-300 mb-8 tablet:mb-12 max-w-2xl tablet:max-w-4xl mx-auto leading-relaxed'>
            Hệ thống quản lý và đặt bàn billiards hiện đại. Không gian chơi đẳng
            cấp, trang thiết bị chuyên nghiệp và dịch vụ tận tâm.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 tablet:gap-6 justify-center'>
            <Link to='/register'>
              <Button
                size='lg'
                className='bg-yellow-400 text-slate-900 hover:bg-yellow-500 px-8 py-3 tablet:px-12 tablet:py-4 text-lg tablet:text-xl'
              >
                <PlayCircle className='mr-2 h-5 w-5 tablet:h-6 tablet:w-6' />
                Bắt đầu ngay
              </Button>
            </Link>
            <Button
              size='lg'
              variant='outline'
              className='text-white border-white hover:bg-white hover:text-slate-900 px-8 py-3 tablet:px-12 tablet:py-4 text-lg tablet:text-xl'
            >
              Khám phá tính năng
            </Button>
          </div>
        </section>

        {/* Features Section - Tablet Optimized */}
        <section className='relative z-10 container mx-auto px-4 tablet:px-8 py-20 tablet:py-24'>
          <div className='text-center mb-16 tablet:mb-20'>
            <h2 className='text-4xl tablet:text-5xl font-bold text-white mb-4 tablet:mb-6'>
              Tại sao chọn SABO ARENA?
            </h2>
            <p className='text-gray-300 text-lg tablet:text-xl max-w-2xl tablet:max-w-4xl mx-auto leading-relaxed'>
              Hệ thống quản lý arena billiards toàn diện với công nghệ hiện đại
            </p>
          </div>

          <div className='grid md:grid-cols-2 tablet:grid-cols-3 gap-8 tablet:gap-8'>
            <Card className='bg-slate-800/80 backdrop-blur-sm border-slate-700/50 tablet:p-8'>
              <CardHeader className='tablet:pb-6'>
                <Trophy className='h-12 w-12 tablet:h-16 tablet:w-16 text-yellow-400 mb-4 tablet:mb-6' />
                <CardTitle className='text-white tablet:text-2xl'>
                  Hệ thống ELO chuyên nghiệp
                </CardTitle>
                <CardDescription className='text-gray-300 tablet:text-lg'>
                  Xếp hạng công bằng và chính xác theo tiêu chuẩn quốc tế
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='text-gray-300 tablet:text-lg space-y-2 tablet:space-y-3'>
                  <li>• Tính toán ELO real-time</li>
                  <li>• Theo dõi thống kê chi tiết</li>
                  <li>• Lịch sử trận đấu đầy đủ</li>
                </ul>
              </CardContent>
            </Card>

            <Card className='bg-slate-800/80 backdrop-blur-sm border-slate-700/50 tablet:p-8'>
              <CardHeader className='tablet:pb-6'>
                <Users className='h-12 w-12 tablet:h-16 tablet:w-16 text-blue-400 mb-4 tablet:mb-6' />
                <CardTitle className='text-white tablet:text-2xl'>
                  Cộng đồng sôi động
                </CardTitle>
                <CardDescription className='text-gray-300 tablet:text-lg'>
                  Kết nối với hàng nghìn tay cơ trên toàn quốc
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='text-gray-300 tablet:text-lg space-y-2 tablet:space-y-3'>
                  <li>• Thách đấu trực tuyến</li>
                  <li>• Chat và kết bạn</li>
                  <li>• Chia sẻ kinh nghiệm</li>
                </ul>
              </CardContent>
            </Card>

            <Card className='bg-slate-800/80 backdrop-blur-sm border-slate-700/50 tablet:p-8'>
              <CardHeader className='tablet:pb-6'>
                <Calendar className='h-12 w-12 tablet:h-16 tablet:w-16 text-green-400 mb-4 tablet:mb-6' />
                <CardTitle className='text-white tablet:text-2xl'>
                  Giải đấu thường xuyên
                </CardTitle>
                <CardDescription className='text-gray-300 tablet:text-lg'>
                  Tham gia các giải đấu với giải thưởng hấp dẫn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='text-gray-300 tablet:text-lg space-y-2 tablet:space-y-3'>
                  <li>• Giải đấu hàng tuần</li>
                  <li>• Giải thưởng tiền mặt</li>
                  <li>• Hệ thống bracket tự động</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section - Tablet Optimized */}
        <section className='relative z-10 container mx-auto px-4 tablet:px-8 py-20 tablet:py-24'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 tablet:gap-8 text-center'>
            <div>
              <div className='text-4xl tablet:text-5xl font-bold text-yellow-400 mb-2 tablet:mb-4'>
                5,000+
              </div>
              <div className='text-gray-300 tablet:text-lg'>Người chơi</div>
            </div>
            <div>
              <div className='text-4xl tablet:text-5xl font-bold text-yellow-400 mb-2 tablet:mb-4'>
                200+
              </div>
              <div className='text-gray-300 tablet:text-lg'>Arena đối tác</div>
            </div>
            <div>
              <div className='text-4xl tablet:text-5xl font-bold text-yellow-400 mb-2 tablet:mb-4'>
                1,000+
              </div>
              <div className='text-gray-300 tablet:text-lg'>Giải đấu</div>
            </div>
            <div>
              <div className='text-4xl tablet:text-5xl font-bold text-yellow-400 mb-2 tablet:mb-4'>
                50K+
              </div>
              <div className='text-gray-300 tablet:text-lg'>Trận đấu</div>
            </div>
          </div>
        </section>

        {/* CTA Section - Tablet Optimized */}
        <section className='relative z-10 container mx-auto px-4 tablet:px-8 py-20 tablet:py-24 text-center'>
          <Card className='bg-gradient-to-r from-yellow-400/90 to-orange-500/90 backdrop-blur-sm border-0 max-w-4xl tablet:max-w-5xl mx-auto tablet:p-8'>
            <CardHeader className='tablet:py-8'>
              <CardTitle className='text-3xl tablet:text-4xl font-bold text-slate-900 mb-4 tablet:mb-6'>
                Sẵn sàng thể hiện kỹ năng?
              </CardTitle>
              <CardDescription className='text-slate-800 text-lg tablet:text-xl'>
                Tham gia ngay hôm nay và bắt đầu hành trình trở thành cao thủ
                billiards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to='/register'>
                <Button
                  size='lg'
                  className='bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 tablet:px-12 tablet:py-4 text-lg tablet:text-xl'
                >
                  Đăng ký miễn phí
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className='relative z-10 container mx-auto px-4 py-8 border-t border-slate-700/50 backdrop-blur-sm bg-slate-900/20'>
          <div className='text-center text-gray-400'>
            <p>&copy; 2024 SABO ARENA Hub. Tất cả quyền được bảo lưu.</p>
            <p className='mt-2'>Nền tảng billiards hàng đầu Việt Nam</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
