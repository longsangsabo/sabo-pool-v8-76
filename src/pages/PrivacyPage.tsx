import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPage = () => {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <Card className='max-w-4xl mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold text-center'>
            Chính sách bảo mật
          </CardTitle>
          <p className='text-center text-muted-foreground'>
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </CardHeader>
        <CardContent className='space-y-6'>
          <section>
            <h2 className='text-xl font-semibold mb-3'>
              1. Thông tin chúng tôi thu thập
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Chúng tôi thu thập các thông tin sau:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Thông tin cá nhân: Họ tên, email, số điện thoại</li>
                <li>
                  Thông tin tài khoản: Tên đăng nhập, mật khẩu (được mã hóa)
                </li>
                <li>Thông tin game: Lịch sử chơi, thống kê, thành tích</li>
                <li>
                  Thông tin thiết bị: IP address, loại thiết bị, trình duyệt
                </li>
                <li>Cookies và dữ liệu theo dõi</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              2. Cách chúng tôi sử dụng thông tin
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Thông tin của bạn được sử dụng để:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Cung cấp và cải thiện dịch vụ</li>
                <li>Xác thực danh tính và bảo mật tài khoản</li>
                <li>Gửi thông báo về hoạt động game</li>
                <li>Phân tích và thống kê sử dụng dịch vụ</li>
                <li>Tuân thủ các yêu cầu pháp lý</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>3. Chia sẻ thông tin</h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>
                Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn.
                Thông tin có thể được chia sẻ trong các trường hợp:
              </p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Với sự đồng ý của bạn</li>
                <li>Để tuân thủ pháp luật hoặc quy định</li>
                <li>Bảo vệ quyền lợi của chúng tôi và người dùng khác</li>
                <li>Với các đối tác dịch vụ (được kiểm soát chặt chẽ)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>4. Bảo mật thông tin</h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Chúng tôi sử dụng các biện pháp bảo mật:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Mã hóa SSL/TLS cho tất cả kết nối</li>
                <li>Mã hóa mật khẩu với bcrypt</li>
                <li>Xác thực hai yếu tố (2FA)</li>
                <li>Firewall và hệ thống phát hiện xâm nhập</li>
                <li>Kiểm tra bảo mật định kỳ</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              5. Quyền của người dùng
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Bạn có quyền:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Truy cập và xem thông tin cá nhân</li>
                <li>Chỉnh sửa hoặc cập nhật thông tin</li>
                <li>Xóa tài khoản và dữ liệu</li>
                <li>Từ chối nhận thông báo marketing</li>
                <li>Yêu cầu xuất dữ liệu cá nhân</li>
                <li>Khiếu nại về việc xử lý dữ liệu</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              6. Cookies và theo dõi
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Chúng tôi sử dụng cookies để:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Ghi nhớ đăng nhập và tùy chọn</li>
                <li>Phân tích lưu lượng truy cập</li>
                <li>Cải thiện trải nghiệm người dùng</li>
                <li>Hiển thị nội dung phù hợp</li>
              </ul>
              <p className='mt-2'>
                Bạn có thể tắt cookies trong cài đặt trình duyệt.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              7. Dữ liệu của trẻ em
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>
                Dịch vụ của chúng tôi dành cho người từ 13 tuổi trở lên. Chúng
                tôi không cố ý thu thập thông tin từ trẻ em dưới 13 tuổi. Nếu
                phát hiện, chúng tôi sẽ xóa ngay lập tức.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              8. Thay đổi chính sách
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>
                Chúng tôi có thể cập nhật chính sách này theo thời gian. Thay
                đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên
                ứng dụng.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>9. Liên hệ</h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Nếu có thắc mắc về chính sách bảo mật, vui lòng liên hệ:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Email: privacy@saboarena.com</li>
                <li>Điện thoại: 1900-SABO (7226)</li>
                <li>Địa chỉ: 123 Đường ABC, Quận XYZ, TP. HCM</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              10. Tuân thủ pháp luật
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Chính sách này tuân thủ:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân</li>
                <li>Luật An toàn thông tin mạng 2015</li>
                <li>Các quy định pháp luật Việt Nam có liên quan</li>
              </ul>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPage;
