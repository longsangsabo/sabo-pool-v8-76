import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  Award,
  MapPin,
  Phone,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SimpleClubAboutPage = () => {
  return (
    <>
      <Helmet>
        <title>Giới thiệu - SABO Billiards</title>
        <meta
          name='description'
          content='Tìm hiểu về SABO Billiards - câu lạc bộ billiards uy tín và chuyên nghiệp'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900'>
        {/* Header */}
        <header className='bg-green-800 border-b border-green-700'>
          <div className='container mx-auto px-4 py-4'>
            <div className='flex items-center space-x-4'>
              <Link to='/simple-club'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-yellow-400 hover:bg-green-700 min-h-[44px]'
                >
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  Về trang chủ
                </Button>
              </Link>
              <h1 className='text-2xl font-bold text-yellow-400'>
                🎱 Giới thiệu CLB
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className='container mx-auto px-4 py-8'>
          <div className='max-w-4xl mx-auto space-y-8'>
            {/* Hero Section */}
            <Card className='bg-green-800 border-green-700'>
              <CardHeader className='text-center'>
                <CardTitle className='text-white text-3xl mb-4'>
                  SABO Billiards
                </CardTitle>
                <p className='text-green-200 text-lg'>
                  Hơn 10 năm phục vụ đam mê billiards với chất lượng hàng đầu
                </p>
              </CardHeader>
              <CardContent className='text-center'>
                <div className='grid md:grid-cols-4 gap-6 mt-8'>
                  <div className='text-center'>
                    <Users className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
                    <p className='text-2xl font-bold text-white'>5000+</p>
                    <p className='text-green-200'>Khách hàng</p>
                  </div>
                  <div className='text-center'>
                    <Clock className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
                    <p className='text-2xl font-bold text-white'>10+</p>
                    <p className='text-green-200'>Năm kinh nghiệm</p>
                  </div>
                  <div className='text-center'>
                    <Award className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
                    <p className='text-2xl font-bold text-white'>12</p>
                    <p className='text-green-200'>Bàn billiards cao cấp</p>
                  </div>
                  <div className='text-center'>
                    <Star className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
                    <p className='text-2xl font-bold text-white'>4.8/5</p>
                    <p className='text-green-200'>Đánh giá</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story Section */}
            <Card className='bg-green-800 border-green-700'>
              <CardHeader>
                <CardTitle className='text-white text-2xl'>
                  Câu chuyện của chúng tôi
                </CardTitle>
              </CardHeader>
              <CardContent className='text-green-200 space-y-4 text-lg leading-relaxed'>
                <p>
                  SABO Billiards được thành lập vào năm 2014 với mong muốn tạo
                  ra một không gian chơi billiards chuyên nghiệp và thân thiện
                  cho cộng đồng yêu thích môn thể thao này.
                </p>
                <p>
                  Từ một quán billiards nhỏ với 4 bàn, chúng tôi đã không ngừng
                  phát triển và hiện tại sở hữu 12 bàn billiards cao cấp với
                  trang thiết bị hiện đại nhất.
                </p>
                <p>
                  Chúng tôi tự hào là nơi quy tụ những tay cơ giỏi nhất và
                  thường xuyên tổ chức các giải đấu billiards lớn nhỏ trong khu
                  vực.
                </p>
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card className='bg-green-800 border-green-700'>
              <CardHeader>
                <CardTitle className='text-white text-2xl'>
                  Cơ sở vật chất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <h3 className='text-yellow-400 font-semibold text-lg'>
                      Bàn billiards chất lượng cao
                    </h3>
                    <ul className='text-green-200 space-y-2'>
                      <li>• 12 bàn billiards chuẩn quốc tế</li>
                      <li>• Nỉ bàn cao cấp, thay định kỳ</li>
                      <li>• Hệ thống đèn chiếu sáng chuyên dụng</li>
                      <li>• Cơ billiards chính hãng, bảo dưỡng tốt</li>
                    </ul>
                  </div>
                  <div className='space-y-4'>
                    <h3 className='text-yellow-400 font-semibold text-lg'>
                      Tiện nghi khác
                    </h3>
                    <ul className='text-green-200 space-y-2'>
                      <li>• Điều hòa mát lạnh quanh năm</li>
                      <li>• Hệ thống âm thanh hiện đại</li>
                      <li>• Khu vực nghỉ ngơi thoải mái</li>
                      <li>• Dịch vụ đồ uống, thức ăn nhẹ</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className='bg-green-800 border-green-700'>
              <CardHeader>
                <CardTitle className='text-white text-2xl'>
                  Dịch vụ của chúng tôi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-3 gap-6'>
                  <div className='text-center p-4 bg-green-700 rounded-lg'>
                    <h3 className='text-yellow-400 font-semibold text-lg mb-2'>
                      Chơi billiards tự do
                    </h3>
                    <p className='text-green-200'>
                      Giá cả hợp lý theo giờ, không gian thoải mái
                    </p>
                  </div>
                  <div className='text-center p-4 bg-green-700 rounded-lg'>
                    <h3 className='text-yellow-400 font-semibold text-lg mb-2'>
                      Tổ chức giải đấu
                    </h3>
                    <p className='text-green-200'>
                      Hỗ trợ tổ chức các giải đấu billiards cho cộng đồng
                    </p>
                  </div>
                  <div className='text-center p-4 bg-green-700 rounded-lg'>
                    <h3 className='text-yellow-400 font-semibold text-lg mb-2'>
                      Hướng dẫn kỹ thuật
                    </h3>
                    <p className='text-green-200'>
                      Có HLV chuyên nghiệp hướng dẫn người mới
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className='bg-green-800 border-green-700'>
              <CardHeader>
                <CardTitle className='text-white text-2xl'>
                  Liên hệ với chúng tôi
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <MapPin className='h-6 w-6 text-yellow-400' />
                  <div>
                    <p className='text-white font-medium'>Địa chỉ:</p>
                    <p className='text-green-200'>
                      123 Đường Nguyễn Huệ, Quận 1, TP.HCM
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <Phone className='h-6 w-6 text-yellow-400' />
                  <div>
                    <p className='text-white font-medium'>Hotline:</p>
                    <p className='text-green-200'>0901 234 567</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <Clock className='h-6 w-6 text-yellow-400' />
                  <div>
                    <p className='text-white font-medium'>Giờ mở cửa:</p>
                    <p className='text-green-200'>
                      8:00 - 23:00 (Thứ 2 - Chủ nhật)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <div className='text-center py-8'>
              <h3 className='text-3xl font-bold text-white mb-4'>
                Sẵn sàng trải nghiệm?
              </h3>
              <p className='text-green-200 mb-6 text-lg'>
                Hãy đến và cảm nhận không khí chơi billiards chuyên nghiệp
              </p>
              <Link to='/simple-booking'>
                <Button
                  size='lg'
                  className='bg-yellow-400 text-green-900 hover:bg-yellow-500 font-bold px-8 py-4 text-lg min-h-[44px]'
                >
                  🎯 Đặt bàn ngay
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SimpleClubAboutPage;
