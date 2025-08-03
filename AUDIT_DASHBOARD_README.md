# Sabo Pool - Audit Dashboard

Đây là công cụ trực quan hóa và tự động hóa quy trình phân tích mã nguồn cho dự án Sabo Pool.

## Tính năng

- **Giao diện trực quan**: Dashboard với các nút bấm để kích hoạt từng loại phân tích
- **Phân tích tự động**: Chạy tự động các script phân tích và hiển thị kết quả
- **Báo cáo chi tiết**: Hiển thị kết quả phân tích dưới dạng báo cáo Markdown
- **Dễ mở rộng**: Dễ dàng thêm các loại phân tích mới

## Các loại phân tích

1. **Hợp Nhất Component**: Phát hiện và đề xuất cách hợp nhất các component tương tự
2. **Phân Tích Dependencies**: Tìm các dependencies không sử dụng, lỗi thời hoặc có vấn đề bảo mật
3. **Phân Tích Hiệu Năng**: Phát hiện các vấn đề có thể ảnh hưởng đến hiệu năng trong React
4. **Phân Tích Bảo Mật**: Tìm các lỗ hổng bảo mật và mẫu code không an toàn
5. **Phân Tích Test Coverage**: Phân tích độ phủ test và đề xuất cải thiện
6. **Phân Tích Toàn Diện**: Chạy tất cả các loại phân tích cùng lúc

## Cài đặt

```bash
# Clone repository
git clone https://github.com/yourusername/sabo-pool-audit.git

# Di chuyển vào thư mục
cd sabo-pool-audit

# Cài đặt dependencies (nếu cần)
npm install
```

## Sử dụng

### Phương pháp 1: Server Express (đầy đủ tính năng)

```bash
# Chạy server Express
node audit-server.js
```

Truy cập dashboard tại: http://localhost:3000/audit-dashboard.html

### Phương pháp 2: HTTP Server đơn giản

```bash
# Chạy HTTP server đơn giản
node simple-server.js
```

Truy cập dashboard tại: http://localhost:9090/audit-dashboard.html

### Sử dụng Dashboard

1. Nhấp vào nút tương ứng với loại phân tích bạn muốn chạy
2. Đợi quá trình phân tích hoàn tất
3. Xem báo cáo kết quả ở phần "Báo Cáo Phân Tích Gần Đây"
4. Nhấp vào "Xem Báo Cáo" để xem chi tiết và tải xuống báo cáo

## Tùy chỉnh

### Thêm script phân tích mới

1. Tạo script phân tích mới trong thư mục `/scripts`
2. Cập nhật `audit-server.js` để thêm endpoint xử lý loại phân tích mới
3. Thêm card mới vào `audit-dashboard.html` với nút kích hoạt phân tích

## Cấu trúc dự án

```
sabo-pool-audit/
├── audit-dashboard.html  # Giao diện người dùng
├── audit-server.js       # Server Express đầy đủ tính năng
├── simple-server.js      # HTTP Server đơn giản
├── scripts/              # Các script phân tích
│   ├── simple-component-consolidation.js
│   ├── simple-dependency-analyzer.js
│   ├── simple-performance-analyzer.js
│   ├── simple-security-analyzer.js
│   ├── simple-test-analyzer.js
│   └── master-audit-orchestrator.js
└── reports/              # Thư mục lưu trữ báo cáo
```

## Đóng góp

Các đóng góp là rất được hoan nghênh! Vui lòng tạo issues hoặc pull requests.

## Giấy phép

MIT License
