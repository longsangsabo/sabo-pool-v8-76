import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  TestTube,
  Monitor,
  Smartphone,
  Tablet,
  BarChart3,
  Rocket,
  Users,
  FileText,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Info,
  Play,
  Settings,
  Activity,
  Shield,
} from 'lucide-react';

export const AdminTestingGuide: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string>('');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const GuideSection: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
    sectionKey: string;
  }> = ({ icon, title, description, children, sectionKey }) => (
    <Card className='mb-4'>
      <CardHeader
        className='cursor-pointer hover:bg-muted/50 transition-colors'
        onClick={() => toggleSection(sectionKey)}
      >
        <div className='flex items-center gap-3'>
          {icon}
          <div className='flex-1'>
            <CardTitle className='text-lg'>{title}</CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>{description}</p>
          </div>
          <Button variant='ghost' size='sm'>
            {expandedSection === sectionKey ? '▼' : '▶'}
          </Button>
        </div>
      </CardHeader>
      {expandedSection === sectionKey && <CardContent>{children}</CardContent>}
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <BookOpen className='h-5 w-5' />
          <CardTitle>📚 Hướng Dẫn Sử Dụng Admin Testing Dashboard</CardTitle>
        </div>
        <p className='text-muted-foreground'>
          Tìm hiểu cách sử dụng từng chức năng trong bảng điều khiển kiểm tra hệ
          thống responsive
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>Tổng Quan</TabsTrigger>
            <TabsTrigger value='testing-tabs'>Các Tab Kiểm Tra</TabsTrigger>
            <TabsTrigger value='workflows'>Quy Trình Làm Việc</TabsTrigger>
            <TabsTrigger value='troubleshooting'>Xử Lý Sự Cố</TabsTrigger>
          </TabsList>

          {/* Tổng Quan Tab */}
          <TabsContent value='overview' className='space-y-6'>
            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription>
                <strong>Admin Testing Dashboard</strong> là công cụ toàn diện để
                kiểm tra, giám sát và tối ưu hóa hệ thống responsive của ứng
                dụng.
              </AlertDescription>
            </Alert>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Card className='bg-blue-50'>
                <CardContent className='pt-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <TestTube className='h-5 w-5 text-blue-600' />
                    <h3 className='font-semibold text-blue-800'>
                      Testing & Validation
                    </h3>
                  </div>
                  <p className='text-sm text-blue-700'>
                    Kiểm tra tự động các tính năng responsive, performance và
                    compatibility trên nhiều thiết bị
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-green-50'>
                <CardContent className='pt-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <BarChart3 className='h-5 w-5 text-green-600' />
                    <h3 className='font-semibold text-green-800'>
                      Monitoring & Analytics
                    </h3>
                  </div>
                  <p className='text-sm text-green-700'>
                    Theo dõi hiệu suất real-time, thu thập feedback người dùng
                    và phân tích dữ liệu sử dụng
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-purple-50'>
                <CardContent className='pt-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Rocket className='h-5 w-5 text-purple-600' />
                    <h3 className='font-semibold text-purple-800'>
                      Deployment Control
                    </h3>
                  </div>
                  <p className='text-sm text-purple-700'>
                    Quản lý feature flags, A/B testing và rollout production một
                    cách an toàn
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-orange-50'>
                <CardContent className='pt-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <FileText className='h-5 w-5 text-orange-600' />
                    <h3 className='font-semibold text-orange-800'>
                      Documentation
                    </h3>
                  </div>
                  <p className='text-sm text-orange-700'>
                    Tài liệu hướng dẫn chi tiết, best practices và
                    troubleshooting guide
                  </p>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Lightbulb className='h-4 w-4' />
              <AlertDescription>
                <strong>💡 Lời khuyên:</strong> Bắt đầu với tab "Audit" để kiểm
                tra tổng quan hệ thống, sau đó chuyển sang các tab testing cụ
                thể.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Các Tab Kiểm Tra */}
          <TabsContent value='testing-tabs' className='space-y-4'>
            <GuideSection
              icon={<Shield className='h-5 w-5 text-blue-600' />}
              title='🔍 Tab Audit - Kiểm Tra Tổng Quan'
              description='Đánh giá sức khỏe tổng thể của hệ thống responsive'
              sectionKey='audit'
            >
              <div className='space-y-3'>
                <div className='bg-muted p-3 rounded-lg'>
                  <h4 className='font-medium mb-2'>Chức năng chính:</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>• Kiểm tra standardization của hooks và components</li>
                    <li>• Validate breakpoint configuration (768px, 1024px)</li>
                    <li>• Đánh giá props interface consistency</li>
                    <li>• Phát hiện legacy code cần migration</li>
                  </ul>
                </div>
                <div className='flex items-start gap-2 p-3 bg-green-50 rounded-lg'>
                  <CheckCircle className='h-4 w-4 text-green-600 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-green-800'>
                      Cách sử dụng:
                    </p>
                    <p className='text-sm text-green-700'>
                      Click "Run Audit" để chạy kiểm tra tự động. Xem kết quả
                      với màu xanh (pass), vàng (warning), đỏ (error).
                    </p>
                  </div>
                </div>
              </div>
            </GuideSection>

            <GuideSection
              icon={<TestTube className='h-5 w-5 text-green-600' />}
              title='🧪 Tab Tests - Kiểm Tra Responsive Core'
              description='Test các tính năng responsive cơ bản'
              sectionKey='tests'
            >
              <div className='space-y-3'>
                <div className='bg-muted p-3 rounded-lg'>
                  <h4 className='font-medium mb-2'>Kiểm tra gì:</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>• Hook performance và render count</li>
                    <li>• Breakpoint detection accuracy</li>
                    <li>• Layout switching smoothness</li>
                    <li>• Memory usage optimization</li>
                  </ul>
                </div>
                <Alert>
                  <Play className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Thực hành:</strong> Thay đổi kích thước cửa sổ
                    browser trong khi test chạy để xem responsive behavior
                    real-time.
                  </AlertDescription>
                </Alert>
              </div>
            </GuideSection>

            <GuideSection
              icon={<Monitor className='h-5 w-5 text-purple-600' />}
              title='📱 Tab Cross-Device - Kiểm Tra Đa Thiết Bị'
              description='Test compatibility trên mobile, tablet, desktop'
              sectionKey='cross-device'
            >
              <div className='space-y-3'>
                <div className='grid grid-cols-3 gap-2'>
                  <div className='text-center p-2 bg-blue-50 rounded'>
                    <Smartphone className='h-6 w-6 mx-auto text-blue-600 mb-1' />
                    <p className='text-xs font-medium'>Mobile</p>
                    <p className='text-xs text-muted-foreground'>&lt; 768px</p>
                  </div>
                  <div className='text-center p-2 bg-green-50 rounded'>
                    <Tablet className='h-6 w-6 mx-auto text-green-600 mb-1' />
                    <p className='text-xs font-medium'>Tablet</p>
                    <p className='text-xs text-muted-foreground'>768-1024px</p>
                  </div>
                  <div className='text-center p-2 bg-purple-50 rounded'>
                    <Monitor className='h-6 w-6 mx-auto text-purple-600 mb-1' />
                    <p className='text-xs font-medium'>Desktop</p>
                    <p className='text-xs text-muted-foreground'>≥ 1024px</p>
                  </div>
                </div>
                <div className='bg-yellow-50 p-3 rounded-lg'>
                  <h4 className='font-medium mb-2 text-yellow-800'>
                    Test scenarios:
                  </h4>
                  <ul className='space-y-1 text-sm text-yellow-700'>
                    <li>• Touch target size validation (44px minimum)</li>
                    <li>• Layout consistency across breakpoints</li>
                    <li>• Performance metrics per device</li>
                    <li>• Accessibility compliance</li>
                  </ul>
                </div>
              </div>
            </GuideSection>

            <GuideSection
              icon={<BarChart3 className='h-5 w-5 text-orange-600' />}
              title='⚡ Tab Performance - Tối Ưu Hiệu Suất'
              description='Monitor và optimize performance real-time'
              sectionKey='performance'
            >
              <div className='space-y-3'>
                <div className='bg-muted p-3 rounded-lg'>
                  <h4 className='font-medium mb-2'>Metrics được theo dõi:</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>
                      • <strong>Render Count:</strong> Số lần component
                      re-render
                    </li>
                    <li>
                      • <strong>Average Render Time:</strong> Thời gian render
                      trung bình
                    </li>
                    <li>
                      • <strong>Memory Usage:</strong> Bộ nhớ sử dụng (MB)
                    </li>
                    <li>
                      • <strong>Layout Shift:</strong> Cumulative Layout Shift
                      score
                    </li>
                  </ul>
                </div>
                <Alert>
                  <Activity className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Mục tiêu:</strong> Render time &lt; 16ms, Memory
                    &lt; 300MB, CLS &lt; 0.1 cho UX tốt nhất.
                  </AlertDescription>
                </Alert>
              </div>
            </GuideSection>

            <GuideSection
              icon={<Users className='h-5 w-5 text-teal-600' />}
              title='👥 Tab UX - Trải Nghiệm Người Dùng'
              description='Validate user experience và accessibility'
              sectionKey='ux'
            >
              <div className='space-y-3'>
                <div className='bg-muted p-3 rounded-lg'>
                  <h4 className='font-medium mb-2'>UX Tests bao gồm:</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>• Navigation flow testing</li>
                    <li>• Color contrast accessibility</li>
                    <li>• Keyboard navigation support</li>
                    <li>• Touch gesture validation</li>
                    <li>• Visual hierarchy assessment</li>
                  </ul>
                </div>
                <div className='bg-blue-50 p-3 rounded-lg'>
                  <p className='text-sm text-blue-700'>
                    <strong>Manual Tests:</strong> Một số test cần thực hiện thủ
                    công như keyboard navigation và touch gestures.
                  </p>
                </div>
              </div>
            </GuideSection>

            <GuideSection
              icon={<Rocket className='h-5 w-5 text-red-600' />}
              title='🚀 Tab Deployment - Quản Lý Production'
              description='Feature flags, A/B testing và rollout control'
              sectionKey='deployment'
            >
              <div className='space-y-3'>
                <div className='bg-muted p-3 rounded-lg'>
                  <h4 className='font-medium mb-2'>Tính năng chính:</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>
                      • <strong>Feature Flags:</strong> Bật/tắt tính năng theo
                      environment
                    </li>
                    <li>
                      • <strong>A/B Testing:</strong> Test 50/50 với
                      control/treatment groups
                    </li>
                    <li>
                      • <strong>Gradual Rollout:</strong> Deploy từ từ với
                      monitoring
                    </li>
                    <li>
                      • <strong>Emergency Rollback:</strong> Khôi phục nhanh khi
                      có sự cố
                    </li>
                  </ul>
                </div>
                <Alert>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>⚠️ Cẩn thận:</strong> Chỉ sử dụng Emergency Rollback
                    khi có vấn đề nghiêm trọng trong production.
                  </AlertDescription>
                </Alert>
              </div>
            </GuideSection>

            <GuideSection
              icon={<BarChart3 className='h-5 w-5 text-indigo-600' />}
              title='📊 Tab Monitoring - Theo Dõi Sau Deploy'
              description='Thu thập feedback và analytics từ người dùng'
              sectionKey='monitoring'
            >
              <div className='space-y-3'>
                <div className='bg-muted p-3 rounded-lg'>
                  <h4 className='font-medium mb-2'>Thu thập được gì:</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>• User feedback và ratings (1-5 sao)</li>
                    <li>• Device distribution analytics</li>
                    <li>• Performance metrics từ real users</li>
                    <li>• Sentiment analysis (positive/neutral/negative)</li>
                  </ul>
                </div>
                <div className='bg-green-50 p-3 rounded-lg'>
                  <p className='text-sm text-green-700'>
                    <strong>💡 Tip:</strong> Sử dụng feedback form để góp ý về
                    responsive experience và track user satisfaction.
                  </p>
                </div>
              </div>
            </GuideSection>

            <GuideSection
              icon={<FileText className='h-5 w-5 text-gray-600' />}
              title='📚 Tab Docs - Tài Liệu Hướng Dẫn'
              description='Documentation và best practices'
              sectionKey='docs'
            >
              <div className='space-y-3'>
                <div className='bg-muted p-3 rounded-lg'>
                  <h4 className='font-medium mb-2'>Nội dung documentation:</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>
                      • <strong>Getting Started:</strong> Quick start guide với
                      code examples
                    </li>
                    <li>
                      • <strong>Components:</strong> Mobile/tablet optimized
                      components
                    </li>
                    <li>
                      • <strong>Best Practices:</strong> Performance tips và
                      optimization
                    </li>
                    <li>
                      • <strong>Troubleshooting:</strong> Common issues và
                      solutions
                    </li>
                    <li>
                      • <strong>Migration:</strong> Upgrade từ legacy sang
                      optimized system
                    </li>
                  </ul>
                </div>
              </div>
            </GuideSection>
          </TabsContent>

          {/* Quy Trình Làm Việc */}
          <TabsContent value='workflows' className='space-y-6'>
            <Card className='bg-gradient-to-r from-blue-50 to-purple-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-5 w-5' />
                  🔄 Quy Trình Testing Khuyến Nghị
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-start gap-3'>
                    <Badge className='bg-blue-100 text-blue-800 min-w-[24px] h-6 flex items-center justify-center'>
                      1
                    </Badge>
                    <div>
                      <h4 className='font-medium'>Audit Hệ Thống</h4>
                      <p className='text-sm text-muted-foreground'>
                        Bắt đầu với tab "Audit" để đánh giá tổng quan và phát
                        hiện issues
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Badge className='bg-green-100 text-green-800 min-w-[24px] h-6 flex items-center justify-center'>
                      2
                    </Badge>
                    <div>
                      <h4 className='font-medium'>Kiểm Tra Core Functions</h4>
                      <p className='text-sm text-muted-foreground'>
                        Chạy "Tests" và "Cross-Device" để validate responsive
                        behavior
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Badge className='bg-orange-100 text-orange-800 min-w-[24px] h-6 flex items-center justify-center'>
                      3
                    </Badge>
                    <div>
                      <h4 className='font-medium'>Optimize Performance</h4>
                      <p className='text-sm text-muted-foreground'>
                        Dùng "Performance" tab để monitor và cải thiện hiệu suất
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Badge className='bg-purple-100 text-purple-800 min-w-[24px] h-6 flex items-center justify-center'>
                      4
                    </Badge>
                    <div>
                      <h4 className='font-medium'>Validate User Experience</h4>
                      <p className='text-sm text-muted-foreground'>
                        Test UX và accessibility với "UX" tab
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Badge className='bg-red-100 text-red-800 min-w-[24px] h-6 flex items-center justify-center'>
                      5
                    </Badge>
                    <div>
                      <h4 className='font-medium'>Deploy & Monitor</h4>
                      <p className='text-sm text-muted-foreground'>
                        Sử dụng "Deployment" để rollout và "Monitoring" để theo
                        dõi
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-5 w-5' />
                  📋 Checklist Hàng Ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <h4 className='font-medium'>Development:</h4>
                    <ul className='space-y-1 text-sm'>
                      <li className='flex items-center gap-2'>
                        <input type='checkbox' />
                        Run Audit để check code quality
                      </li>
                      <li className='flex items-center gap-2'>
                        <input type='checkbox' />
                        Test responsive trên 3 breakpoints
                      </li>
                      <li className='flex items-center gap-2'>
                        <input type='checkbox' />
                        Check performance metrics
                      </li>
                      <li className='flex items-center gap-2'>
                        <input type='checkbox' />
                        Validate accessibility
                      </li>
                    </ul>
                  </div>

                  <div className='space-y-2'>
                    <h4 className='font-medium'>Production:</h4>
                    <ul className='space-y-1 text-sm'>
                      <li className='flex items-center gap-2'>
                        <input type='checkbox' />
                        Monitor user feedback
                      </li>
                      <li className='flex items-center gap-2'>
                        <input type='checkbox' />
                        Check error rates
                      </li>
                      <li className='flex items-center gap-2'>
                        <input type='checkbox' />
                        Review performance stats
                      </li>
                      <li className='flex items-center gap-2'>
                        <input type='checkbox' />
                        Update feature flags nếu cần
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Xử Lý Sự Cố */}
          <TabsContent value='troubleshooting' className='space-y-6'>
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>🚨 Emergency Contacts:</strong> Khi gặp sự cố nghiêm
                trọng, sử dụng "Emergency Rollback" trong tab Deployment.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>🔧 Sự Cố Thường Gặp</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='border-l-4 border-red-500 pl-4'>
                  <h4 className='font-medium text-red-800'>
                    Tests Failed - Error Rate Cao
                  </h4>
                  <p className='text-sm text-red-700 mt-1'>
                    <strong>Nguyên nhân:</strong> Components thiếu test
                    attributes hoặc performance issues
                  </p>
                  <p className='text-sm mt-1'>
                    <strong>Giải pháp:</strong>
                    1. Check console logs để tìm lỗi cụ thể
                    <br />
                    2. Thêm data-testid cho components
                    <br />
                    3. Optimize memory usage nếu {'>'}300MB
                  </p>
                </div>

                <div className='border-l-4 border-yellow-500 pl-4'>
                  <h4 className='font-medium text-yellow-800'>
                    Performance Slow
                  </h4>
                  <p className='text-sm text-yellow-700 mt-1'>
                    <strong>Nguyên nhân:</strong> Quá nhiều re-renders hoặc
                    memory leaks
                  </p>
                  <p className='text-sm mt-1'>
                    <strong>Giải pháp:</strong>
                    1. Tăng debounce delay từ 150ms lên 300ms 2. Thêm
                    React.memo() cho layout components 3. Use CSS-only solutions
                    cho simple responsive behavior
                  </p>
                </div>

                <div className='border-l-4 border-blue-500 pl-4'>
                  <h4 className='font-medium text-blue-800'>Layout Jumping</h4>
                  <p className='text-sm text-blue-700 mt-1'>
                    <strong>Nguyên nhân:</strong> Breakpoint transitions không
                    smooth
                  </p>
                  <p className='text-sm mt-1'>
                    <strong>Giải pháp:</strong>
                    1. Thêm CSS transitions cho containers 2. Avoid sudden
                    dimension changes 3. Use loading states during transitions
                  </p>
                </div>

                <div className='border-l-4 border-green-500 pl-4'>
                  <h4 className='font-medium text-green-800'>
                    Touch Targets Too Small
                  </h4>
                  <p className='text-sm text-green-700 mt-1'>
                    <strong>Nguyên nhân:</strong> Mobile buttons {'<'}44px
                  </p>
                  <p className='text-sm mt-1'>
                    <strong>Giải pháp:</strong>
                    1. Sử dụng MobileTouchButton components 2. Set min-height:
                    44px cho mobile 3. Test với Cross-Device tab
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📞 Khi Nào Cần Hỗ Trợ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='bg-red-50 p-3 rounded-lg'>
                    <h4 className='font-medium text-red-800 mb-2'>
                      🚨 Urgent (Dùng Emergency Rollback):
                    </h4>
                    <ul className='space-y-1 text-sm text-red-700'>
                      <li>• Error rate {'>'}3% trong production</li>
                      <li>• User satisfaction {'<'}60%</li>
                      <li>• Critical functionality bị broken</li>
                      <li>• Memory leaks nghiêm trọng</li>
                    </ul>
                  </div>

                  <div className='bg-yellow-50 p-3 rounded-lg'>
                    <h4 className='font-medium text-yellow-800 mb-2'>
                      ⚠️ Medium (Monitor & Fix):
                    </h4>
                    <ul className='space-y-1 text-sm text-yellow-700'>
                      <li>• Performance score {'<'}80</li>
                      <li>• Memory usage {'>'}300MB</li>
                      <li>• Some tests failing</li>
                      <li>• User feedback mixed</li>
                    </ul>
                  </div>

                  <div className='bg-green-50 p-3 rounded-lg'>
                    <h4 className='font-medium text-green-800 mb-2'>
                      ✅ Low (Optimization):
                    </h4>
                    <ul className='space-y-1 text-sm text-green-700'>
                      <li>• Minor performance improvements</li>
                      <li>• Feature enhancement requests</li>
                      <li>• Documentation updates</li>
                      <li>• A/B testing optimization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
