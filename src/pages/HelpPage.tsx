import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Phone,
  Mail,
  Search,
  Trophy,
  Users,
  Zap,
  User,
  Wallet,
  Settings,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/layout/PageLayout';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const categories = [
    { id: 'all', name: 'Tất cả', icon: Search },
    { id: 'account', name: 'Tài khoản', icon: User },
    { id: 'challenges', name: 'Thách đấu', icon: Zap },
    { id: 'tournaments', name: 'Giải đấu', icon: Trophy },
    { id: 'clubs', name: 'Câu lạc bộ', icon: Users },
    { id: 'wallet', name: 'Ví & Thanh toán', icon: Wallet },
    { id: 'settings', name: 'Cài đặt', icon: Settings },
  ];

  const faqs = [
    {
      category: 'account',
      question: 'Làm thế nào để đăng ký tài khoản?',
      answer:
        'Bạn có thể đăng ký tài khoản bằng cách nhấn nút "Đăng ký" ở góc trên bên phải, sau đó điền thông tin cần thiết như email, số điện thoại và mật khẩu.',
    },
    {
      category: 'account',
      question: 'Tôi quên mật khẩu, phải làm sao?',
      answer:
        'Trên trang đăng nhập, nhấn "Quên mật khẩu" và nhập email đã đăng ký. Chúng tôi sẽ gửi link reset mật khẩu đến email của bạn.',
    },
    {
      category: 'challenges',
      question: 'Cách thách đấu người chơi khác?',
      answer:
        'Vào mục "Thách đấu", chọn người chơi bạn muốn thách đấu, đặt mức cược và gửi lời mời. Đối phương có 48 giờ để phản hồi.',
    },
    {
      category: 'challenges',
      question: 'Điểm SPA là gì và được tính như thế nào?',
      answer:
        'Điểm SPA (SABO ARENA) là hệ thống xếp hạng của chúng tôi. Bạn được điểm khi thắng thách đấu, tham gia giải đấu, và check-in hàng ngày. Điểm cao hơn = hạng cao hơn.',
    },
    {
      category: 'tournaments',
      question: 'Làm sao để tham gia giải đấu?',
      answer:
        'Vào mục "Giải đấu", chọn giải đấu bạn muốn tham gia, kiểm tra thể lệ và nhấn "Đăng ký". Một số giải đấu có phí tham gia.',
    },
    {
      category: 'tournaments',
      question: 'Tôi có thể tự tổ chức giải đấu không?',
      answer:
        'Có, nếu bạn là chủ câu lạc bộ được xác minh, bạn có thể tạo giải đấu riêng thông qua trang quản lý CLB.',
    },
    {
      category: 'clubs',
      question: 'Cách đăng ký câu lạc bộ?',
      answer:
        'Vào "Hồ sơ" > "Đăng ký CLB", điền đầy đủ thông tin về câu lạc bộ của bạn. Admin sẽ xem xét và phê duyệt trong 1-3 ngày làm việc.',
    },
    {
      category: 'clubs',
      question: 'Lợi ích của việc có câu lạc bộ?',
      answer:
        'Chủ CLB có thể xác thực hạng cho player, tổ chức giải đấu riêng, thu phí dịch vụ, và quản lý thành viên. Đây là cách kiếm thu nhập từ nền tảng.',
    },
    {
      category: 'wallet',
      question: 'Cách nạp tiền vào ví?',
      answer:
        'Vào "Ví của tôi", chọn "Nạp tiền", chọn phương thức thanh toán (VNPay, Momo, Banking) và làm theo hướng dẫn.',
    },
    {
      category: 'wallet',
      question: 'Tôi có thể rút tiền không?',
      answer:
        'Có, bạn có thể rút tiền về tài khoản ngân hàng. Phí rút tiền là 5,000 VNĐ/lần, thời gian xử lý 1-2 ngày làm việc.',
    },
    {
      category: 'settings',
      question: 'Cách thay đổi thông tin cá nhân?',
      answer:
        'Vào "Hồ sơ" > "Chỉnh sửa thông tin", bạn có thể cập nhật tên, avatar, địa chỉ và các thông tin khác.',
    },
    {
      category: 'settings',
      question: 'Làm sao để bật/tắt thông báo?',
      answer:
        'Vào "Cài đặt" > "Thông báo", bạn có thể tùy chỉnh các loại thông báo muốn nhận (thách đấu, giải đấu, tin nhắn, v.v.).',
    },
  ];

  const contactMethods = [
    {
      title: 'Chat trực tiếp',
      description: 'Hỗ trợ trực tiếp qua chat (8:00 - 22:00)',
      icon: MessageCircle,
      action: 'Bắt đầu chat',
      color: 'bg-blue-500',
    },
    {
      title: 'Điện thoại',
      description: 'Hotline: 1900-1234 (24/7)',
      icon: Phone,
      action: 'Gọi ngay',
      color: 'bg-green-500',
    },
    {
      title: 'Email',
      description: 'support@sabopool.vn',
      icon: Mail,
      action: 'Gửi email',
      color: 'bg-purple-500',
    },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory =
      selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Đã gửi liên hệ',
      description: 'Chúng tôi sẽ phản hồi trong vòng 24 giờ.',
    });
  };

  return (
    <PageLayout variant='content'>
      <div className='pt-20'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-foreground mb-4'>
            Trung tâm trợ giúp
          </h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Tìm câu trả lời cho mọi thắc mắc về SABO ARENA
          </p>
        </div>

        {/* Quick Contact */}
        <div className='grid md:grid-cols-3 gap-6 mb-12'>
          {contactMethods.map(method => {
            const Icon = method.icon;
            return (
              <Card
                key={method.title}
                className='hover:shadow-lg transition-shadow cursor-pointer'
              >
                <CardContent className='p-6 text-center'>
                  <div
                    className={`${method.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='font-semibold text-lg mb-2'>{method.title}</h3>
                  <p className='text-muted-foreground text-sm mb-4'>
                    {method.description}
                  </p>
                  <Button variant='outline' size='sm'>
                    {method.action}
                    <ChevronRight className='w-4 h-4 ml-2' />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className='grid lg:grid-cols-4 gap-8'>
          {/* Categories Sidebar */}
          <div className='lg:col-span-1'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Danh mục</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className='w-4 h-4' />
                      <span className='font-medium'>{category.name}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className='lg:col-span-3 space-y-8'>
            {/* Search */}
            <Card>
              <CardContent className='p-6'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                  <Input
                    placeholder='Tìm kiếm câu hỏi...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </CardContent>
            </Card>

            {/* FAQ Results */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Câu hỏi thường gặp
                  <Badge variant='secondary'>
                    {filteredFaqs.length} kết quả
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Các câu hỏi được hỏi nhiều nhất từ cộng đồng người chơi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type='single' collapsible className='space-y-4'>
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`faq-${index}`}
                      className='border rounded-lg px-4'
                    >
                      <AccordionTrigger className='text-left py-4 hover:no-underline'>
                        <div className='flex items-center space-x-3'>
                          <Badge variant='outline' className='text-xs'>
                            {categories.find(c => c.id === faq.category)?.name}
                          </Badge>
                          <span className='font-medium'>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className='pb-4 text-muted-foreground'>
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {filteredFaqs.length === 0 && (
                  <div className='text-center py-12'>
                    <Search className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
                    <h3 className='text-lg font-semibold mb-2'>
                      Không tìm thấy kết quả
                    </h3>
                    <p className='text-muted-foreground mb-4'>
                      Thử thay đổi từ khóa hoặc chọn danh mục khác
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Không tìm thấy câu trả lời?</CardTitle>
                <CardDescription>
                  Gửi câu hỏi cho chúng tôi, sẽ có phản hồi trong 24 giờ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Họ tên
                      </label>
                      <Input placeholder='Nhập họ tên của bạn' required />
                    </div>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Email
                      </label>
                      <Input
                        type='email'
                        placeholder='your-email@example.com'
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium mb-2 block'>
                      Tiêu đề
                    </label>
                    <Input placeholder='Tóm tắt vấn đề của bạn' required />
                  </div>
                  <div>
                    <label className='text-sm font-medium mb-2 block'>
                      Nội dung
                    </label>
                    <Textarea
                      placeholder='Mô tả chi tiết vấn đề hoặc câu hỏi của bạn...'
                      rows={4}
                      required
                    />
                  </div>
                  <Button type='submit' className='w-full md:w-auto'>
                    <Mail className='w-4 h-4 mr-2' />
                    Gửi câu hỏi
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Liên kết hữu ích</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-2 gap-4'>
                  <Link
                    to='/terms'
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors'
                  >
                    <span>Điều khoản sử dụng</span>
                    <ExternalLink className='w-4 h-4' />
                  </Link>
                  <Link
                    to='/privacy'
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors'
                  >
                    <span>Chính sách bảo mật</span>
                    <ExternalLink className='w-4 h-4' />
                  </Link>
                  <Link
                    to='/about'
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors'
                  >
                    <span>Về SABO ARENA</span>
                    <ExternalLink className='w-4 h-4' />
                  </Link>
                  <Link
                    to='/contact'
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors'
                  >
                    <span>Liên hệ</span>
                    <ExternalLink className='w-4 h-4' />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default HelpPage;
