import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MobileLayout from '../components/MobileLayout';

const TermsPage = () => {
  return (
    <MobileLayout>
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Điều khoản sử dụng
            </h1>
            <p className='text-gray-600'>Cập nhật lần cuối: 29/06/2025</p>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>1. Điều khoản chung</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Bằng việc truy cập và sử dụng ứng dụng SABO Pool Arena, bạn
                  đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều
                  kiện này.
                </p>
                <p className='text-gray-700'>
                  Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản
                  này, bạn không được phép sử dụng dịch vụ của chúng tôi.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Sử dụng dịch vụ</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  SABO Pool Arena cung cấp nền tảng kết nối người chơi bida, tổ
                  chức giải đấu và quản lý CLB.
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>
                    Bạn phải đăng ký tài khoản để sử dụng đầy đủ tính năng
                  </li>
                  <li>Thông tin đăng ký phải chính xác và cập nhật</li>
                  <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập</li>
                  <li>Không được sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Nội dung người dùng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Bạn có quyền đăng tải nội dung lên nền tảng, tuy nhiên:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Nội dung không được vi phạm quyền sở hữu trí tuệ</li>
                  <li>Không được đăng nội dung xúc phạm, bạo lực</li>
                  <li>Không được spam hoặc quảng cáo không được phép</li>
                  <li>Chúng tôi có quyền xóa nội dung vi phạm</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Thanh toán và phí dịch vụ</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Một số tính năng premium yêu cầu thanh toán:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Phí được tính theo gói dịch vụ đã chọn</li>
                  <li>Thanh toán được xử lý qua các cổng thanh toán an toàn</li>
                  <li>Không hoàn tiền cho các dịch vụ đã sử dụng</li>
                  <li>
                    Chúng tôi có quyền thay đổi phí dịch vụ với thông báo trước
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Bảo mật và quyền riêng tư</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Thông tin được mã hóa và bảo mật</li>
                  <li>
                    Không chia sẻ thông tin với bên thứ ba không được phép
                  </li>
                  <li>Tuân thủ quy định bảo vệ dữ liệu cá nhân</li>
                  <li>Bạn có quyền yêu cầu xóa thông tin cá nhân</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Giới hạn trách nhiệm</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  SABO Pool Arena không chịu trách nhiệm về:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Thiệt hại gián tiếp hoặc hậu quả</li>
                  <li>Mất dữ liệu do lỗi kỹ thuật</li>
                  <li>Hành vi của người dùng khác</li>
                  <li>Gián đoạn dịch vụ do bảo trì</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Thay đổi điều khoản</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700'>
                  Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào.
                  Những thay đổi sẽ có hiệu lực ngay khi được đăng tải. Việc
                  tiếp tục sử dụng dịch vụ sau khi thay đổi được coi là chấp
                  nhận điều khoản mới.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Liên hệ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700'>
                  Nếu bạn có câu hỏi về các điều khoản này, vui lòng liên hệ:
                </p>
                <div className='mt-2 space-y-1 text-gray-700'>
                  <p>Email: support@sabopoolarena.com</p>
                  <p>Điện thoại: 1900-xxxx</p>
                  <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default TermsPage;
