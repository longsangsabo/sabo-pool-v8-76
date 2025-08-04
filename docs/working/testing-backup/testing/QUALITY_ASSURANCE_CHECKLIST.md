# 🛡️ Danh Sách Kiểm Tra Đảm Bảo Chất Lượng

## 📝 Danh Sách Kiểm Tra Trước Khi Commit Code

### 🔍 Kiểm Tra Tổng Quát
- [ ] Code tuân thủ theo chuẩn JavaScript/TypeScript
- [ ] Không có warning/error khi chạy ESLint
- [ ] Định dạng code nhất quán (sử dụng Prettier)
- [ ] Không có `console.log` thừa
- [ ] Không có code comment thừa hoặc TODO comments
- [ ] Đã xóa code thử nghiệm hoặc code tạm thời

### 📦 Kiến Trúc & Cấu Trúc
- [ ] Code được đặt đúng thư mục theo kiến trúc feature-based
- [ ] Components tuân theo nguyên tắc Single Responsibility
- [ ] Logic phức tạp được tách ra custom hooks
- [ ] Sử dụng đúng path aliases cho imports
- [ ] Không có circular dependencies
- [ ] Không import từ feature khác trừ qua public API

### 🧪 Testing
- [ ] Đã viết unit tests cho các hàm quan trọng
- [ ] Đã viết component tests cho các UI components
- [ ] Đã viết integration tests cho các luồng chức năng
- [ ] Test coverage đạt yêu cầu
- [ ] Các edge cases được xử lý và test

### 🖌️ UI & UX
- [ ] UI phù hợp với design system
- [ ] Responsive trên các kích thước màn hình
- [ ] Có loading states cho các thao tác async
- [ ] Có error states và thông báo lỗi phù hợp
- [ ] Focus order hợp lý cho keyboard navigation
- [ ] UI có feedback rõ ràng cho người dùng

### ♿ Accessibility
- [ ] Sử dụng semantic HTML
- [ ] Có alt text cho images
- [ ] Contrast ratio đáp ứng WCAG AA
- [ ] Các elements có aria labels khi cần thiết
- [ ] Keyboard navigation hoạt động đúng
- [ ] Screen reader friendly

### 🔐 Security
- [ ] Input data được validate
- [ ] Không có hardcoded credentials
- [ ] Xử lý đúng các quyền và permissions
- [ ] API endpoints được bảo vệ đúng cách
- [ ] Không có XSS vulnerabilities
- [ ] Sensitive data được xử lý an toàn

### 🚀 Performance
- [ ] Không render không cần thiết (sử dụng memo, useMemo, useCallback)
- [ ] Tối ưu số lượng API calls
- [ ] Tối ưu kích thước bundle
- [ ] Lazy load components khi thích hợp
- [ ] Tối ưu hóa assets (images, fonts)
- [ ] Không có memory leaks

### 🌐 Internationalization
- [ ] Text UI được tách ra i18n keys
- [ ] Dates và numbers được format theo locale
- [ ] RTL support nếu cần thiết
- [ ] Pluralization được xử lý đúng
- [ ] Không có hardcoded strings

### 📚 Documentation
- [ ] Components có JSDoc
- [ ] Functions có mô tả và types
- [ ] Complex logic có comments giải thích
- [ ] README được cập nhật nếu cần
- [ ] API được document đầy đủ

## 🔄 Quy Trình Code Review

### 👁️ Reviewer
- [ ] Đã đọc và hiểu yêu cầu của task
- [ ] Đã kiểm tra code theo danh sách kiểm tra
- [ ] Đã test feature trên local
- [ ] Đã kiểm tra ảnh hưởng đến các feature khác
- [ ] Đã cung cấp feedback chi tiết và xây dựng

### 👨‍💻 Author
- [ ] Đã giải thích rõ ràng các quyết định kỹ thuật
- [ ] Đã trả lời các câu hỏi và feedback
- [ ] Đã sửa các issues được raise
- [ ] Đã thêm tests nếu cần
- [ ] Đã cập nhật documentation nếu cần

## 🚀 Checklist Triển Khai

### 🔧 Pre-Deployment
- [ ] Đã merge code từ main branch
- [ ] Đã chạy toàn bộ test suite
- [ ] Đã kiểm tra build không có lỗi
- [ ] Đã kiểm tra bundle size
- [ ] Đã chạy performance tests
- [ ] Đã cập nhật version trong package.json

### 🌍 Deployment
- [ ] Đã deploy lên staging environment
- [ ] Đã chạy smoke tests
- [ ] Đã kiểm tra logs không có errors
- [ ] Đã kiểm tra monitoring tools
- [ ] Đã kiểm tra database migrations
- [ ] Đã thông báo cho team về deployment

### 🔍 Post-Deployment
- [ ] Đã kiểm tra feature trên production
- [ ] Đã kiểm tra analytics
- [ ] Đã kiểm tra error tracking
- [ ] Đã kiểm tra performance metrics
- [ ] Đã cập nhật documentation
- [ ] Đã thông báo cho stakeholders

## 🔄 Continuous Integration

### 🤖 CI Pipeline
- [ ] ESLint check pass
- [ ] TypeScript check pass
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Build succeeds
- [ ] Bundle size within limits
- [ ] No security vulnerabilities

### 📊 Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring configured
- [ ] Usage analytics configured
- [ ] Alerting configured
- [ ] Logging configured
- [ ] Health checks configured
