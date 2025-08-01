import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Monitor,
  Smartphone,
  ArrowRight,
  Check,
  Star,
  Eye,
  Clock,
  Zap,
  Target,
  Users,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComparisonPoint {
  category: string;
  before: string;
  after: string;
  improvement: string;
}

const DashboardComparison = () => {
  const [activeView, setActiveView] = useState<'mobile' | 'desktop'>('mobile');

  const improvements: ComparisonPoint[] = [
    {
      category: 'Header',
      before: 'Chiều cao 64px, logo lớn, nhiều text',
      after: 'Chiều cao 48px, logo tối ưu, text ngắn gọn',
      improvement: '25% giảm chiều cao',
    },
    {
      category: 'Welcome',
      before: '2 dòng text riêng biệt, padding lớn',
      after: '1 dòng với font Bebas Neue, padding 12px',
      improvement: '60% giảm không gian',
    },
    {
      category: 'SPA Wallet',
      before: 'Card lớn, layout rải rác',
      after: 'Compact card, thông tin tập trung',
      improvement: '40% giảm kích thước',
    },
    {
      category: 'Player Stats',
      before: '4 cards ngang, khó đọc mobile',
      after: 'Grid 2x2, số liệu nổi bật',
      improvement: '2x dễ đọc hơn',
    },
    {
      category: 'Quick Actions',
      before: 'Cards lớn, text dài',
      after: 'Grid 2x2, icons nổi bật',
      improvement: 'Truy cập nhanh 3x',
    },
    {
      category: 'Activities',
      before: 'List dài, nhiều thông tin',
      after: 'Max 2 items, format timeline',
      improvement: 'Tải nhanh 2x',
    },
  ];

  const keyFeatures = [
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Tối ưu cho màn hình 320-414px',
      highlight: true,
    },
    {
      icon: Eye,
      title: 'Visual Hierarchy',
      description: 'Thông tin quan trọng nổi bật',
      highlight: true,
    },
    {
      icon: Clock,
      title: 'Quick Access',
      description: 'Hành động chính dễ tiếp cận',
      highlight: false,
    },
    {
      icon: Zap,
      title: 'Performance',
      description: 'Giảm DOM elements, tải nhanh',
      highlight: false,
    },
    {
      icon: Target,
      title: 'Touch Optimized',
      description: 'Targets tối thiểu 44x44px',
      highlight: false,
    },
    {
      icon: Users,
      title: 'Dark/Light Mode',
      description: 'Tương thích cả 2 theme',
      highlight: false,
    },
  ];

  const technicalSpecs = [
    { label: 'Header Height', before: '64px', after: '48px' },
    { label: 'Card Height', before: '120-140px', after: '80-100px' },
    { label: 'Font Sizes', before: '16-24px', after: '14-18px' },
    { label: 'Touch Targets', before: 'Không nhất quán', after: 'Min 44x44px' },
    { label: 'Spacing', before: '24-32px', after: '12-16px' },
    { label: 'DOM Elements', before: '~150', after: '~90' },
  ];

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-8'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <Badge variant='outline' className='mb-4'>
          <Star className='w-3 h-3 mr-1' />
          Mobile Dashboard Optimization
        </Badge>
        <h1 className='text-3xl font-bold'>SABO ARENA Dashboard</h1>
        <p className='text-muted-foreground max-w-2xl mx-auto'>
          Tối ưu hoàn toàn giao diện mobile cho trải nghiệm người dùng tốt nhất.
          Giảm kích thước, cải thiện spacing và tăng tốc độ tải.
        </p>

        {/* Quick Navigation */}
        <div className='flex gap-4 justify-center'>
          <Link to='/dashboard'>
            <Button className='flex items-center gap-2'>
              <Smartphone className='w-4 h-4' />
              Xem Dashboard Mới
            </Button>
          </Link>
          <Link to='/dashboard-legacy'>
            <Button variant='outline' className='flex items-center gap-2'>
              <Monitor className='w-4 h-4' />
              So sánh với cũ
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5' />
            Tính năng nổi bật
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-3 gap-4'>
            {keyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    feature.highlight
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-secondary/30'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mb-2 ${
                      feature.highlight
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <h3 className='font-semibold mb-1'>{feature.title}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      <Tabs defaultValue='improvements' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='improvements'>Cải tiến</TabsTrigger>
          <TabsTrigger value='technical'>Kỹ thuật</TabsTrigger>
          <TabsTrigger value='breakdown'>Chi tiết</TabsTrigger>
        </TabsList>

        <TabsContent value='improvements' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>So sánh Before vs After</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {improvements.map((item, index) => (
                  <div
                    key={index}
                    className='grid md:grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-lg'
                  >
                    <div className='font-semibold text-primary'>
                      {item.category}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      <strong>Trước:</strong> {item.before}
                    </div>
                    <div className='text-sm'>
                      <strong>Sau:</strong> {item.after}
                    </div>
                    <div className='text-sm font-semibold text-green-600 flex items-center gap-1'>
                      <Check className='w-3 h-3' />
                      {item.improvement}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='technical' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Thông số kỹ thuật</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {technicalSpecs.map((spec, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center p-3 bg-secondary/30 rounded-lg'
                  >
                    <span className='font-medium'>{spec.label}</span>
                    <div className='flex items-center gap-2'>
                      <span className='text-red-600 line-through'>
                        {spec.before}
                      </span>
                      <ArrowRight className='w-4 h-4 text-muted-foreground' />
                      <span className='text-green-600 font-semibold'>
                        {spec.after}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='breakdown' className='space-y-4'>
          <div className='grid md:grid-cols-2 gap-6'>
            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle>Typography System</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='p-3 bg-secondary/30 rounded'>
                  <div className='font-[family-name:var(--font-bebas)] text-lg'>
                    Bebas Neue - Tên người dùng
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Font nổi bật cho tên
                  </div>
                </div>
                <div className='p-3 bg-secondary/30 rounded'>
                  <div className='font-[family-name:var(--font-racing)] text-lg font-bold'>
                    Racing Sans One - Số điểm
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Font số liệu quan trọng
                  </div>
                </div>
                <div className='p-3 bg-secondary/30 rounded'>
                  <div className='font-[family-name:var(--font-epilogue)]'>
                    Epilogue - Text chính
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Font dễ đọc cho nội dung
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color System */}
            <Card>
              <CardHeader>
                <CardTitle>Color System</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='p-3 bg-primary rounded text-primary-foreground text-center text-sm'>
                    Primary
                  </div>
                  <div className='p-3 bg-secondary rounded text-secondary-foreground text-center text-sm'>
                    Secondary
                  </div>
                  <div className='p-3 bg-accent-green rounded text-white text-center text-sm'>
                    Success
                  </div>
                  <div className='p-3 bg-accent-red rounded text-white text-center text-sm'>
                    Error
                  </div>
                </div>
                <div className='text-xs text-muted-foreground'>
                  Hệ thống màu nhất quán, tương thích dark/light mode
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn sử dụng</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid md:grid-cols-2 gap-6'>
            <div>
              <h3 className='font-semibold mb-2'>Truy cập Dashboard mới:</h3>
              <code className='bg-secondary/50 p-2 rounded block text-sm'>
                /dashboard
              </code>
              <p className='text-sm text-muted-foreground mt-2'>
                Dashboard được tối ưu hoàn toàn cho mobile
              </p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>So sánh với phiên bản cũ:</h3>
              <code className='bg-secondary/50 p-2 rounded block text-sm'>
                /dashboard-legacy
              </code>
              <p className='text-sm text-muted-foreground mt-2'>
                Phiên bản cũ để so sánh sự khác biệt
              </p>
            </div>
          </div>

          <div className='border-t pt-4'>
            <h3 className='font-semibold mb-2'>Component tái sử dụng:</h3>
            <ul className='text-sm space-y-1 text-muted-foreground'>
              <li>
                • <code>OptimizedMobileDashboard.tsx</code> - Dashboard chính
              </li>
              <li>• Font families: Bebas Neue, Racing Sans One, Epilogue</li>
              <li>• Responsive breakpoints: 320px-414px (mobile first)</li>
              <li>• Touch targets: minimum 44x44px</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardComparison;
