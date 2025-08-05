import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsPage = () => {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <Card className='max-w-4xl mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold text-center'>
            Điều khoản sử dụng
          </CardTitle>
          <p className='text-center text-muted-foreground'>
            Có hiệu lực từ: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </CardHeader>
        <CardContent className='space-y-6'>
          <section>
            <h2 className='text-xl font-semibold mb-3'>
              1. Chấp nhận điều khoản
            </h2>
            <p className='text-muted-foreground'>
              Bằng việc sử dụng SABO Arena, bạn đồng ý tuân thủ các điều khoản
              và điều kiện được nêu trong tài liệu này. Nếu bạn không đồng ý với
              bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của chúng
              tôi.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>2. Mô tả dịch vụ</h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>SABO Arena là nền tảng game cộng đồng cung cấp:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Tổ chức và tham gia các giải đấu game</li>
                <li>Hệ thống thách đấu giữa người chơi</li>
                <li>Xếp hạng và thống kê thành tích</li>
                <li>Cộng đồng game thủ và tương tác xã hội</li>
                <li>Các tính năng bổ sung khác</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              3. Tài khoản người dùng
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Khi tạo tài khoản, bạn cam kết:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Cung cấp thông tin chính xác và cập nhật</li>
                <li>Bảo mật thông tin đăng nhập</li>
                <li>Chịu trách nhiệm cho mọi hoạt động trong tài khoản</li>
                <li>Thông báo ngay nếu phát hiện sử dụng trái phép</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>4. Quy tắc sử dụng</h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Bạn không được:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                <li>Quấy rối, xúc phạm người dùng khác</li>
                <li>Gian lận trong game hoặc giải đấu</li>
                <li>Chia sẻ nội dung không phù hợp</li>
                <li>Cố gắng xâm nhập hệ thống</li>
                <li>Sử dụng bot hoặc phần mềm gian lận</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              5. Nội dung người dùng
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Đối với nội dung bạn đăng tải:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Bạn giữ quyền sở hữu nội dung của mình</li>
                <li>Bạn cấp cho chúng tôi quyền sử dụng để vận hành dịch vụ</li>
                <li>Nội dung phải tuân thủ pháp luật và quy tắc cộng đồng</li>
                <li>Chúng tôi có quyền xóa nội dung vi phạm</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              6. Thanh toán và hoàn tiền
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Các điều khoản về tài chính:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Phí dịch vụ được niêm yết rõ ràng</li>
                <li>Thanh toán qua các phương thức được hỗ trợ</li>
                <li>Hoàn tiền theo chính sách cụ thể</li>
                <li>Không hoàn tiền cho dịch vụ đã sử dụng</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>
              7. Giới hạn trách nhiệm
            </h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>SABO Arena không chịu trách nhiệm cho:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Gián đoạn dịch vụ do bảo trì hoặc kỹ thuật</li>
                <li>Mất mát dữ liệu do lỗi người dùng</li>
                <li>Tranh chấp giữa người dùng</li>
                <li>Thiệt hại gián tiếp hoặc ngẫu nhiên</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>8. Chấm dứt dịch vụ</h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Chúng tôi có quyền:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Tạm ngừng hoặc chấm dứt tài khoản vi phạm</li>
                <li>Thay đổi hoặc ngừng cung cấp dịch vụ</li>
                <li>Thông báo trước cho các thay đổi quan trọng</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold mb-3'>9. Liên hệ</h2>
            <div className='space-y-2 text-muted-foreground'>
              <p>Để được hỗ trợ hoặc giải đáp thắc mắc:</p>
              <ul className='list-disc list-inside space-y-1 ml-4'>
                <li>Email: support@saboarena.com</li>
                <li>Hotline: 1900-SABO (7226)</li>
                <li>Giờ hỗ trợ: 8:00 - 22:00 hàng ngày</li>
              </ul>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsPage;
