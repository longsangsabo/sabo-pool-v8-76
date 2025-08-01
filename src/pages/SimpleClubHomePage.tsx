import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Phone, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const SimpleClubHomePage = () => {
  return (
    <>
      <Helmet>
        <title>SABO Pool Arena - Đặt bàn nhanh chóng</title>
        <meta
          name='description'
          content='Câu lạc bộ billiards chuyên nghiệp. Đặt bàn dễ dàng, chất lượng cao.'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900'>
        {/* Header */}
        <header className='bg-green-800 border-b border-green-700 sticky top-0 z-50'>
          <div className='container mx-auto px-4 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center'>
                  <span className='text-2xl'>🎱</span>
                </div>
                <div>
                  <h1 className='text-xl font-bold text-yellow-400'>
                    SABO Pool Arena
                  </h1>
                  <p className='text-green-200 text-sm'>
                    Chuyên nghiệp • Uy tín
                  </p>
                </div>
              </div>
              <nav className='hidden md:flex space-x-6'>
                <Link
                  to='/simple-club'
                  className='text-green-200 hover:text-yellow-400 transition-colors'
                >
                  Trang chủ
                </Link>
                <Link
                  to='/simple-booking'
                  className='text-green-200 hover:text-yellow-400 transition-colors'
                >
                  Đặt bàn
                </Link>
                <Link
                  to='/simple-about'
                  className='text-green-200 hover:text-yellow-400 transition-colors'
                >
                  Giới thiệu
                </Link>
                <Link
                  to='/simple-contact'
                  className='text-green-200 hover:text-yellow-400 transition-colors'
                >
                  Liên hệ
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className='py-16 px-4'>
          <div className='container mx-auto text-center'>
            <h2 className='text-4xl md:text-6xl font-bold text-white mb-6'>
              Chơi Bi-a Đẳng Cấp
            </h2>
            <p className='text-xl text-green-200 mb-8 max-w-2xl mx-auto'>
              12 bàn bi-a cao cấp • Không gian thoáng mát • Giá cả hợp lý
            </p>
            <Link to='/simple-booking'>
              <Button
                size='lg'
                className='bg-yellow-400 text-green-900 hover:bg-yellow-500 font-bold px-8 py-4 text-lg min-h-[44px]'
              >
                🎯 Đặt Bàn Ngay
              </Button>
            </Link>
          </div>
        </section>

        {/* Quick Info Cards */}
        <section className='py-12 px-4'>
          <div className='container mx-auto'>
            <div className='grid md:grid-cols-4 gap-6'>
              <Card className='bg-green-800 border-green-700 text-center'>
                <CardHeader className='pb-3'>
                  <Clock className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
                  <CardTitle className='text-white text-lg'>
                    Giờ mở cửa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-green-200 font-medium'>8:00 - 23:00</p>
                  <p className='text-green-300 text-sm'>Thứ 2 - Chủ nhật</p>
                </CardContent>
              </Card>

              <Card className='bg-green-800 border-green-700 text-center'>
                <CardHeader className='pb-3'>
                  <Users className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
                  <CardTitle className='text-white text-lg'>
                    Bàn trống
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-yellow-400 font-bold text-2xl'>8/12</p>
                  <p className='text-green-300 text-sm'>bàn có sẵn</p>
                </CardContent>
              </Card>

              <Card className='bg-green-800 border-green-700 text-center'>
                <CardHeader className='pb-3'>
                  <Star className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
                  <CardTitle className='text-white text-lg'>Đánh giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-yellow-400 font-bold text-2xl'>4.8/5</p>
                  <p className='text-green-300 text-sm'>từ 200+ khách hàng</p>
                </CardContent>
              </Card>

              <Card className='bg-green-800 border-green-700 text-center'>
                <CardHeader className='pb-3'>
                  <Phone className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
                  <CardTitle className='text-white text-lg'>Hotline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-green-200 font-medium'>0901 234 567</p>
                  <p className='text-green-300 text-sm'>Hỗ trợ 24/7</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className='py-12 px-4 bg-green-800/50'>
          <div className='container mx-auto'>
            <h3 className='text-3xl font-bold text-white text-center mb-8'>
              Bảng Giá Rõ Ràng
            </h3>
            <div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
              <Card className='bg-green-800 border-green-700'>
                <CardHeader className='text-center'>
                  <CardTitle className='text-yellow-400 text-2xl'>
                    Giờ Vàng
                  </CardTitle>
                  <p className='text-green-200'>8:00 - 17:00</p>
                </CardHeader>
                <CardContent className='text-center'>
                  <p className='text-4xl font-bold text-white mb-2'>25.000đ</p>
                  <p className='text-green-300'>mỗi giờ</p>
                </CardContent>
              </Card>

              <Card className='bg-green-800 border-green-700'>
                <CardHeader className='text-center'>
                  <CardTitle className='text-yellow-400 text-2xl'>
                    Giờ Cao Điểm
                  </CardTitle>
                  <p className='text-green-200'>17:00 - 23:00</p>
                </CardHeader>
                <CardContent className='text-center'>
                  <p className='text-4xl font-bold text-white mb-2'>35.000đ</p>
                  <p className='text-green-300'>mỗi giờ</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className='py-16 px-4 text-center'>
          <div className='container mx-auto'>
            <h3 className='text-3xl font-bold text-white mb-4'>
              Sẵn sàng chơi bi-a?
            </h3>
            <p className='text-green-200 mb-8 text-lg'>
              Đặt bàn ngay để không bỏ lỡ cơ hội
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link to='/simple-booking'>
                <Button
                  size='lg'
                  className='bg-yellow-400 text-green-900 hover:bg-yellow-500 font-bold px-8 py-4 min-h-[44px]'
                >
                  📅 Đặt Bàn Online
                </Button>
              </Link>
              <Button
                size='lg'
                variant='outline'
                className='border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-green-900 font-bold px-8 py-4 min-h-[44px]'
              >
                📞 Gọi Ngay: 0901 234 567
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className='bg-green-900 border-t border-green-700 py-8 px-4'>
          <div className='container mx-auto text-center'>
            <div className='flex items-center justify-center space-x-2 mb-4'>
              <MapPin className='h-5 w-5 text-yellow-400' />
              <p className='text-green-200'>
                123 Đường Nguyễn Huệ, Q.1, TP.HCM
              </p>
            </div>
            <p className='text-green-300 text-sm'>
              © 2024 SABO Pool Arena. Bản quyền thuộc về chúng tôi.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SimpleClubHomePage;
