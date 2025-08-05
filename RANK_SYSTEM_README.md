# Hệ thống Đăng ký Rank với Xác minh CLB

## Tổng quan

Hệ thống này cho phép người dùng đăng ký rank với CLB và CLB có thể phê duyệt, từ chối hoặc yêu cầu kiểm tra tại chỗ. Hệ thống bao gồm các tính năng chống gian lận và thông báo tự động.

## Các thành phần chính

### 1. Database Schema

#### Bảng `rank_requests`
```sql
CREATE TABLE rank_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_rank INTEGER NOT NULL CHECK (requested_rank >= 0 AND requested_rank <= 3000),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'on_site_test', 'rejected', 'banned')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);
```

#### RLS Policies
- Người dùng chỉ có thể xem yêu cầu rank của mình
- CLB chỉ có thể xem yêu cầu rank của CLB mình
- Chỉ chủ CLB mới có thể phê duyệt/từ chối yêu cầu

### 2. Components

#### `RankRegistrationForm`
- Form đăng ký rank cho người dùng
- Hiển thị rank hiện tại và lịch sử yêu cầu
- Tích hợp với Google Maps Places Autocomplete

#### `RankRequestsTab`
- Dashboard cho CLB để quản lý yêu cầu rank
- Thống kê theo trạng thái
- Các action: Phê duyệt, Kiểm tra tại chỗ, Từ chối

#### `ClubDashboard`
- Tích hợp ClubProfileTab và RankRequestsTab
- Hiển thị theo vai trò người dùng

### 3. Hooks

#### `useRankRequests`
- Quản lý CRUD operations cho rank requests
- Gửi notifications tự động
- Tính toán thống kê

### 4. Edge Functions

#### `rank-request-notification`
- Gửi email notifications
- Tạo in-app notifications
- Hỗ trợ SendGrid

## Cài đặt và Triển khai

### 1. Database Migration

Chạy migration để tạo bảng và policies:
```bash
supabase db push
```

### 2. Environment Variables

Thêm vào file `.env`:
```env
VITE_GOOGLE_PLACES_KEY=your_google_places_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy rank-request-notification
```

### 4. Cập nhật RLS Policies

Đảm bảo các policies được áp dụng:
```sql
-- Kiểm tra policies
SELECT * FROM pg_policies WHERE tablename = 'rank_requests';
```

## Luồng hoạt động

### 1. Người dùng đăng ký rank
1. Chọn CLB từ danh sách đã xác minh
2. Chọn rank muốn đăng ký (500-3000 ELO)
3. Hệ thống tạo rank request với status 'pending'
4. Gửi notification cho chủ CLB

### 2. CLB xử lý yêu cầu
1. Xem danh sách yêu cầu rank trong dashboard
2. Chọn action:
   - **Phê duyệt**: Cập nhật ELO người dùng, gửi thông báo
   - **Kiểm tra tại chỗ**: Yêu cầu người dùng đến CLB kiểm tra
   - **Từ chối**: Từ chối với lý do (tùy chọn)

### 3. Chống gian lận
- Nếu phát hiện gian lận, admin có thể đánh dấu status 'banned'
- Tự động cấm tài khoản người dùng (is_banned = true)
- Gửi thông báo cấm

## Tính năng bảo mật

### 1. Row Level Security (RLS)
- Người dùng chỉ thấy yêu cầu của mình
- CLB chỉ thấy yêu cầu của CLB mình
- Chỉ chủ CLB mới có quyền phê duyệt

### 2. Validation
- Rank phải trong khoảng 0-3000
- Status phải là một trong các giá trị cho phép
- User phải tồn tại và được xác minh

### 3. Audit Trail
- Lưu thông tin người phê duyệt
- Timestamp cho mọi thay đổi
- Lý do từ chối (nếu có)

## API Endpoints

### Rank Requests
- `GET /rank_requests` - Lấy danh sách (có filter)
- `POST /rank_requests` - Tạo yêu cầu mới
- `PUT /rank_requests/:id` - Cập nhật trạng thái

### Notifications
- `POST /functions/v1/rank-request-notification` - Gửi thông báo

## Monitoring và Logs

### 1. Database Logs
```sql
-- Xem rank requests theo trạng thái
SELECT status, COUNT(*) FROM rank_requests GROUP BY status;

-- Xem rank requests theo CLB
SELECT c.name, COUNT(*) 
FROM rank_requests rr 
JOIN clubs c ON rr.club_id = c.id 
GROUP BY c.name;
```

### 2. Edge Function Logs
```bash
supabase functions logs rank-request-notification
```

## Troubleshooting

### 1. Lỗi thường gặp

#### RLS Policy không hoạt động
```sql
-- Kiểm tra policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'rank_requests';
```

#### Edge Function không gửi email
- Kiểm tra SENDGRID_API_KEY
- Kiểm tra logs của function
- Đảm bảo email template đúng format

#### Google Maps không hoạt động
- Kiểm tra VITE_GOOGLE_PLACES_KEY
- Đảm bảo API key có quyền Places API
- Kiểm tra billing của Google Cloud

### 2. Performance

#### Indexes
```sql
-- Tạo indexes cho performance
CREATE INDEX idx_rank_requests_user_id ON rank_requests(user_id);
CREATE INDEX idx_rank_requests_club_id ON rank_requests(club_id);
CREATE INDEX idx_rank_requests_status ON rank_requests(status);
```

#### Pagination
- Sử dụng cursor-based pagination cho danh sách lớn
- Limit kết quả trả về

## Roadmap

### Phase 2
- [ ] Tích hợp với hệ thống matchmaking
- [ ] Auto-ranking dựa trên kết quả thi đấu
- [ ] Tournament ranking system
- [ ] Advanced analytics dashboard

### Phase 3
- [ ] Machine learning để phát hiện gian lận
- [ ] Video verification system
- [ ] International ranking system
- [ ] Mobile app integration

## Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong Supabase Dashboard
2. Xem documentation của Supabase
3. Tạo issue trên GitHub repository 