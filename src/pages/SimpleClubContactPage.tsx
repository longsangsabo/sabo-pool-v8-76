import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const SimpleClubContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.message.trim()
    ) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm nhất có thể.');

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        message: '',
      });
    } catch (error) {
      toast.error(
        'Có lỗi xảy ra. Vui lòng thử lại hoặc gọi trực tiếp hotline.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Liên hệ - SABO Billiards</title>
        <meta
          name='description'
          content='Liên hệ với SABO Billiards để được tư vấn và hỗ trợ'
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
              <h1 className='text-2xl font-bold text-yellow-400'>📞 Liên hệ</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className='container mx-auto px-4 py-8'>
          <div className='max-w-6xl mx-auto'>
            <div className='grid lg:grid-cols-2 gap-8'>
              {/* Contact Form */}
              <Card className='bg-green-800 border-green-700'>
                <CardHeader>
                  <CardTitle className='text-white text-2xl text-center'>
                    Gửi tin nhắn cho chúng tôi
                  </CardTitle>
                  <p className='text-green-200 text-center'>
                    Chúng tôi sẽ phản hồi trong vòng 30 phút
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className='space-y-6'>
                    <div className='space-y-2'>
                      <Label
                        htmlFor='contact-name'
                        className='text-white text-lg font-medium'
                      >
                        Họ tên *
                      </Label>
                      <Input
                        id='contact-name'
                        value={formData.name}
                        onChange={e =>
                          handleInputChange('name', e.target.value)
                        }
                        placeholder='Nguyễn Văn An'
                        className='bg-green-700 border-green-600 text-white text-lg min-h-[44px]'
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label
                        htmlFor='contact-phone'
                        className='text-white text-lg font-medium'
                      >
                        Số điện thoại *
                      </Label>
                      <Input
                        id='contact-phone'
                        value={formData.phone}
                        onChange={e =>
                          handleInputChange('phone', e.target.value)
                        }
                        placeholder='0901234567'
                        type='tel'
                        className='bg-green-700 border-green-600 text-white text-lg min-h-[44px]'
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label
                        htmlFor='contact-email'
                        className='text-white text-lg font-medium'
                      >
                        Email (tùy chọn)
                      </Label>
                      <Input
                        id='contact-email'
                        value={formData.email}
                        onChange={e =>
                          handleInputChange('email', e.target.value)
                        }
                        placeholder='your@email.com'
                        type='email'
                        className='bg-green-700 border-green-600 text-white text-lg min-h-[44px]'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label
                        htmlFor='contact-message'
                        className='text-white text-lg font-medium'
                      >
                        Tin nhắn *
                      </Label>
                      <Textarea
                        id='contact-message'
                        value={formData.message}
                        onChange={e =>
                          handleInputChange('message', e.target.value)
                        }
                        placeholder='Tôi muốn hỏi về...'
                        className='bg-green-700 border-green-600 text-white text-lg min-h-[120px] resize-none'
                        required
                      />
                    </div>

                    <Button
                      type='submit'
                      className='w-full bg-yellow-400 text-green-900 hover:bg-yellow-500 font-bold py-4 text-xl min-h-[50px]'
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-green-900 mr-3'></div>
                          Đang gửi...
                        </>
                      ) : (
                        '📨 Gửi tin nhắn'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className='space-y-6'>
                {/* Quick Contact */}
                <Card className='bg-green-800 border-green-700'>
                  <CardHeader>
                    <CardTitle className='text-white text-2xl'>
                      Liên hệ nhanh
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <div className='flex items-center space-x-4'>
                      <div className='bg-yellow-400 p-3 rounded-full'>
                        <Phone className='h-6 w-6 text-green-900' />
                      </div>
                      <div>
                        <p className='text-white font-semibold text-lg'>
                          Hotline 24/7
                        </p>
                        <p className='text-green-200'>0901 234 567</p>
                        <Button
                          variant='outline'
                          size='sm'
                          className='mt-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-green-900 min-h-[40px]'
                          onClick={() => window.open('tel:0901234567')}
                        >
                          Gọi ngay
                        </Button>
                      </div>
                    </div>

                    <div className='flex items-center space-x-4'>
                      <div className='bg-yellow-400 p-3 rounded-full'>
                        <MessageCircle className='h-6 w-6 text-green-900' />
                      </div>
                      <div>
                        <p className='text-white font-semibold text-lg'>Zalo</p>
                        <p className='text-green-200'>0901 234 567</p>
                        <Button
                          variant='outline'
                          size='sm'
                          className='mt-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white min-h-[40px]'
                          onClick={() =>
                            window.open('https://zalo.me/0901234567')
                          }
                        >
                          Chat Zalo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location & Hours */}
                <Card className='bg-green-800 border-green-700'>
                  <CardHeader>
                    <CardTitle className='text-white text-2xl'>
                      Thông tin cơ sở
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-start space-x-3'>
                      <MapPin className='h-6 w-6 text-yellow-400 mt-1' />
                      <div>
                        <p className='text-white font-medium text-lg'>
                          Địa chỉ:
                        </p>
                        <p className='text-green-200'>123 Đường Nguyễn Huệ</p>
                        <p className='text-green-200'>Quận 1, TP.HCM</p>
                        <Button
                          variant='outline'
                          size='sm'
                          className='mt-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-green-900 min-h-[40px]'
                          onClick={() =>
                            window.open(
                              'https://maps.google.com/?q=123+Nguyen+Hue+District+1+HCMC'
                            )
                          }
                        >
                          Xem bản đồ
                        </Button>
                      </div>
                    </div>

                    <div className='flex items-start space-x-3'>
                      <Clock className='h-6 w-6 text-yellow-400 mt-1' />
                      <div>
                        <p className='text-white font-medium text-lg'>
                          Giờ mở cửa:
                        </p>
                        <p className='text-green-200'>
                          Thứ 2 - Chủ nhật: 8:00 - 23:00
                        </p>
                        <p className='text-yellow-400 font-medium'>
                          Không nghỉ lễ
                        </p>
                      </div>
                    </div>

                    <div className='flex items-start space-x-3'>
                      <Mail className='h-6 w-6 text-yellow-400 mt-1' />
                      <div>
                        <p className='text-white font-medium text-lg'>Email:</p>
                        <p className='text-green-200'>info@clbbiasaigon.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FAQ */}
                <Card className='bg-green-800 border-green-700'>
                  <CardHeader>
                    <CardTitle className='text-white text-2xl'>
                      Câu hỏi thường gặp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <p className='text-yellow-400 font-medium'>
                        Có cần đặt bàn trước không?
                      </p>
                      <p className='text-green-200 text-sm'>
                        Khuyến khích đặt trước, đặc biệt vào cuối tuần và giờ
                        cao điểm.
                      </p>
                    </div>
                    <div>
                      <p className='text-yellow-400 font-medium'>
                        Có dịch vụ gì khác không?
                      </p>
                      <p className='text-green-200 text-sm'>
                        Có đồ uống, thức ăn nhẹ và dịch vụ hướng dẫn cho người
                        mới.
                      </p>
                    </div>
                    <div>
                      <p className='text-yellow-400 font-medium'>
                        Giá cả như thế nào?
                      </p>
                      <p className='text-green-200 text-sm'>
                        25k/giờ (8h-17h) và 35k/giờ (17h-23h). Giá đã bao gồm cơ
                        và bi.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SimpleClubContactPage;
