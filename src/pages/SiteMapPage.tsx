import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Users,
  Trophy,
  Zap,
  User,
  Settings,
  Wallet,
  MessageCircle,
  HelpCircle,
  BarChart3,
  Shield,
  MapPin,
} from 'lucide-react';

const SiteMapPage = () => {
  const pageCategories = [
    {
      title: 'Trang chính',
      icon: <Home className='h-5 w-5' />,
      color: 'bg-blue-500',
      pages: [
        { name: 'Trang chủ', path: '/', description: 'Trang chủ chính' },
        {
          name: 'Dashboard',
          path: '/dashboard',
          description: 'Bảng điều khiển',
        },
        {
          name: 'Dashboard Overview',
          path: '/dashboard-overview',
          description: 'Tổng quan',
        },
        { name: 'Index', path: '/index', description: 'Trang index' },
      ],
    },
    {
      title: 'Xã hội & Khám phá',
      icon: <Users className='h-5 w-5' />,
      color: 'bg-green-500',
      pages: [
        { name: 'Feed', path: '/feed', description: 'Bảng tin' },
        {
          name: 'Social Feed',
          path: '/social-feed',
          description: 'Mạng xã hội',
        },
        {
          name: 'Khám phá',
          path: '/discovery',
          description: 'Khám phá nội dung',
        },
        {
          name: 'Enhanced Discovery',
          path: '/enhanced-discovery',
          description: 'Khám phá nâng cao',
        },
      ],
    },
    {
      title: 'Giải đấu & Thách đấu',
      icon: <Trophy className='h-5 w-5' />,
      color: 'bg-yellow-500',
      pages: [
        {
          name: 'Giải đấu',
          path: '/tournaments',
          description: 'Danh sách giải đấu',
        },
        {
          name: 'Khám phá giải đấu',
          path: '/tournament-discovery',
          description: 'Tìm giải đấu',
        },
        {
          name: 'Tạo giải đấu',
          path: '/create-tournament',
          description: 'Tạo giải đấu mới',
        },
        {
          name: 'Thách đấu',
          path: '/challenges',
          description: 'Danh sách thách đấu',
        },
        {
          name: 'Enhanced Challenges',
          path: '/enhanced-challenges',
          description: 'Thách đấu nâng cao',
        },
      ],
    },
    {
      title: 'CLB & Thành viên',
      icon: <Users className='h-5 w-5' />,
      color: 'bg-purple-500',
      pages: [
        { name: 'CLB', path: '/clubs', description: 'Danh sách câu lạc bộ' },
        {
          name: 'Chi tiết CLB',
          path: '/club/demo',
          description: 'Thông tin chi tiết CLB',
        },
        {
          name: 'Thành viên',
          path: '/membership',
          description: 'Quản lý thành viên',
        },
      ],
    },
    {
      title: 'Xếp hạng & Bảng xếp hạng',
      icon: <BarChart3 className='h-5 w-5' />,
      color: 'bg-orange-500',
      pages: [
        {
          name: 'Bảng xếp hạng',
          path: '/leaderboard',
          description: 'Xếp hạng người chơi',
        },
        {
          name: 'Enhanced Leaderboard',
          path: '/enhanced-leaderboard',
          description: 'Bảng xếp hạng nâng cao',
        },
        { name: 'Ranking', path: '/ranking', description: 'Hệ thống xếp hạng' },
      ],
    },
    {
      title: 'Marketplace & Ví',
      icon: <Wallet className='h-5 w-5' />,
      color: 'bg-indigo-500',
      pages: [
        {
          name: 'Marketplace',
          path: '/marketplace',
          description: 'Chợ trực tuyến',
        },
        {
          name: 'Enhanced Marketplace',
          path: '/enhanced-marketplace',
          description: 'Chợ nâng cao',
        },
        { name: 'Ví', path: '/wallet', description: 'Quản lý ví điện tử' },
      ],
    },
    {
      title: 'Thanh toán',
      icon: <Wallet className='h-5 w-5' />,
      color: 'bg-red-500',
      pages: [
        {
          name: 'Thanh toán thành viên',
          path: '/payment-membership',
          description: 'Thanh toán gói thành viên',
        },
        {
          name: 'Thanh toán CLB',
          path: '/payment-club-membership',
          description: 'Thanh toán thành viên CLB',
        },
        {
          name: 'Kết quả thanh toán',
          path: '/payment-result',
          description: 'Kết quả giao dịch',
        },
        {
          name: 'Thanh toán thành công',
          path: '/payment-success',
          description: 'Xác nhận thành công',
        },
      ],
    },
    {
      title: 'Hồ sơ & Cài đặt',
      icon: <User className='h-5 w-5' />,
      color: 'bg-teal-500',
      pages: [
        { name: 'Hồ sơ', path: '/profile', description: 'Hồ sơ cá nhân' },
        { name: 'Cài đặt', path: '/settings', description: 'Cài đặt hệ thống' },
        { name: 'Bảo mật', path: '/security', description: 'Cài đặt bảo mật' },
      ],
    },
    {
      title: 'Chat & Lịch sử',
      icon: <MessageCircle className='h-5 w-5' />,
      color: 'bg-pink-500',
      pages: [
        { name: 'Chat', path: '/chat', description: 'Trò chuyện' },
        {
          name: 'Lịch sử trận đấu',
          path: '/matches',
          description: 'Lịch sử thi đấu',
        },
        {
          name: 'Live Stream',
          path: '/live-stream',
          description: 'Phát trực tiếp',
        },
      ],
    },
    {
      title: 'Thông tin',
      icon: <HelpCircle className='h-5 w-5' />,
      color: 'bg-gray-500',
      pages: [
        {
          name: 'Về chúng tôi',
          path: '/about',
          description: 'Thông tin công ty',
        },
        { name: 'Trợ giúp', path: '/help', description: 'Hỗ trợ người dùng' },
        { name: 'FAQ', path: '/faq', description: 'Câu hỏi thường gặp' },
        { name: 'Blog', path: '/blog', description: 'Tin tức và bài viết' },
        {
          name: 'Điều khoản',
          path: '/terms',
          description: 'Điều khoản sử dụng',
        },
        {
          name: 'Bảo mật',
          path: '/privacy',
          description: 'Chính sách bảo mật',
        },
      ],
    },
    {
      title: 'Quản trị & Phân tích',
      icon: <Shield className='h-5 w-5' />,
      color: 'bg-red-600',
      pages: [
        {
          name: 'Analytics',
          path: '/analytics',
          description: 'Phân tích dữ liệu',
        },
        {
          name: 'System Health',
          path: '/system-health',
          description: 'Tình trạng hệ thống',
        },
        {
          name: 'System Audit',
          path: '/system-audit',
          description: 'Kiểm tra hệ thống',
        },
      ],
    },
    {
      title: 'Simple Club',
      icon: <MapPin className='h-5 w-5' />,
      color: 'bg-green-600',
      pages: [
        {
          name: 'Simple Club Home',
          path: '/simple-club',
          description: 'Trang chủ CLB đơn giản',
        },
        {
          name: 'Simple Booking',
          path: '/simple-booking',
          description: 'Đặt bàn đơn giản',
        },
        {
          name: 'Simple About',
          path: '/simple-about',
          description: 'Giới thiệu CLB',
        },
        {
          name: 'Simple Contact',
          path: '/simple-contact',
          description: 'Liên hệ CLB',
        },
        { name: 'Booking', path: '/booking', description: 'Đặt bàn' },
      ],
    },
  ];

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>
          🗺️ Sơ đồ trang web
        </h1>
        <p className='text-lg text-gray-600'>
          Tổng quan tất cả các trang có sẵn trong hệ thống (
          {pageCategories.reduce(
            (acc, category) => acc + category.pages.length,
            0
          )}{' '}
          trang)
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {pageCategories.map((category, index) => (
          <Card key={index} className='h-fit'>
            <CardHeader>
              <CardTitle className='flex items-center gap-3'>
                <div className={`p-2 rounded-lg ${category.color} text-white`}>
                  {category.icon}
                </div>
                <span>{category.title}</span>
                <Badge variant='secondary'>{category.pages.length} trang</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {category.pages.map((page, pageIndex) => (
                  <Link
                    key={pageIndex}
                    to={page.path}
                    className='block p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors'
                  >
                    <div className='font-medium text-gray-900'>{page.name}</div>
                    <div className='text-sm text-gray-500'>
                      {page.description}
                    </div>
                    <div className='text-xs text-blue-600 mt-1'>
                      {page.path}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='mt-12 p-6 bg-blue-50 rounded-lg'>
        <h2 className='text-2xl font-bold text-blue-900 mb-4'>
          📋 Trạng thái hoàn thành
        </h2>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-600'>
              {pageCategories.reduce(
                (acc, category) => acc + category.pages.length,
                0
              )}
            </div>
            <div className='text-sm text-gray-600'>Tổng số trang</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-blue-600'>
              {pageCategories.length}
            </div>
            <div className='text-sm text-gray-600'>Danh mục</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-600'>✅</div>
            <div className='text-sm text-gray-600'>Routing hoàn tất</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-orange-600'>🎯</div>
            <div className='text-sm text-gray-600'>Navigation cập nhật</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteMapPage;
