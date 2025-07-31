import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MobileLayout from '../components/MobileLayout';

const PrivacyPage = () => {
  return (
    <MobileLayout>
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Chính sách bảo mật
            </h1>
            <p className='text-gray-600'>Cập nhật lần cuối: 29/06/2025</p>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>1. Thông tin chúng tôi thu thập</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Chúng tôi thu thập các loại thông tin sau để cung cấp dịch vụ
                  tốt nhất:
                </p>
                <div className='space-y-3'>
                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      Thông tin cá nhân:
                    </h4>
                    <ul className='list-disc list-inside space-y-1 text-gray-700 ml-4'>
                      <li>Họ tên, email, số điện thoại</li>
                      <li>Ngày sinh, giới tính</li>
                      <li>Địa chỉ và thông tin liên hệ</li>
                      <li>Ảnh đại diện (nếu có)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      Thông tin sử dụng:
                    </h4>
                    <ul className='list-disc list-inside space-y-1 text-gray-700 ml-4'>
                      <li>Lịch sử trận đấu và thành tích</li>
                      <li>Hoạt động trên nền tảng</li>
                      <li>Thông tin thiết bị và trình duyệt</li>
                      <li>Vị trí địa lý (nếu được phép)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Mục đích sử dụng thông tin</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Chúng tôi sử dụng thông tin của bạn để:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Cung cấp và cải thiện dịch vụ</li>
                  <li>Xử lý thanh toán và giao dịch</li>
                  <li>Gửi thông báo và cập nhật</li>
                  <li>Phân tích và thống kê</li>
                  <li>Bảo mật và ngăn chặn gian lận</li>
                  <li>Tuân thủ pháp luật</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Chia sẻ thông tin</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Chúng tôi có thể chia sẻ thông tin trong các trường hợp sau:
                </p>
                <div className='space-y-3'>
                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      Với sự đồng ý của bạn:
                    </h4>
                    <p className='text-gray-700'>
                      Chia sẻ thông tin với bên thứ ba khi bạn cho phép
                    </p>
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      Đối tác dịch vụ:
                    </h4>
                    <ul className='list-disc list-inside space-y-1 text-gray-700 ml-4'>
                      <li>Nhà cung cấp thanh toán</li>
                      <li>Dịch vụ phân tích và marketing</li>
                      <li>Nhà cung cấp hosting và bảo mật</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      Yêu cầu pháp lý:
                    </h4>
                    <p className='text-gray-700'>
                      Khi có yêu cầu từ cơ quan chức năng
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Bảo mật thông tin</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Chúng tôi cam kết bảo vệ thông tin của bạn bằng các biện pháp:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Mã hóa dữ liệu trong quá trình truyền tải</li>
                  <li>Bảo mật cơ sở dữ liệu với firewall</li>
                  <li>Kiểm soát truy cập nghiêm ngặt</li>
                  <li>Giám sát hệ thống 24/7</li>
                  <li>Đào tạo nhân viên về bảo mật</li>
                  <li>Kiểm tra bảo mật định kỳ</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Quyền của người dùng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Bạn có các quyền sau đối với thông tin cá nhân:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Quyền truy cập và xem thông tin</li>
                  <li>Quyền chỉnh sửa và cập nhật</li>
                  <li>Quyền yêu cầu xóa thông tin</li>
                  <li>Quyền hạn chế xử lý</li>
                  <li>Quyền di chuyển dữ liệu</li>
                  <li>Quyền phản đối xử lý</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Cookie và công nghệ theo dõi</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Chúng tôi sử dụng cookie và công nghệ tương tự để:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Ghi nhớ tùy chọn và cài đặt</li>
                  <li>Phân tích lưu lượng truy cập</li>
                  <li>Cải thiện trải nghiệm người dùng</li>
                  <li>Hiển thị quảng cáo phù hợp</li>
                </ul>
                <p className='text-gray-700'>
                  Bạn có thể kiểm soát cookie thông qua cài đặt trình duyệt.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Lưu trữ thông tin</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-gray-700'>
                  Chúng tôi lưu trữ thông tin trong thời gian cần thiết để:
                </p>
                <ul className='list-disc list-inside space-y-2 text-gray-700'>
                  <li>Cung cấp dịch vụ cho bạn</li>
                  <li>Tuân thủ nghĩa vụ pháp lý</li>
                  <li>Giải quyết tranh chấp</li>
                  <li>Thực thi thỏa thuận</li>
                </ul>
                <p className='text-gray-700'>
                  Thông tin sẽ được xóa an toàn khi không còn cần thiết.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Thay đổi chính sách</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700'>
                  Chúng tôi có thể cập nhật chính sách này theo thời gian. Những
                  thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo
                  trên ứng dụng. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi
                  được coi là chấp nhận chính sách mới.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Liên hệ về bảo mật</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700'>
                  Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện
                  quyền của mình, vui lòng liên hệ:
                </p>
                <div className='mt-2 space-y-1 text-gray-700'>
                  <p>Email: privacy@sabopoolarena.com</p>
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

export default PrivacyPage;
