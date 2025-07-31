# Hệ Thống Thách Đấu SABO POOL ARENA

## Tổng Quan

Hệ thống thách đấu cho phép các vận động viên thách đấu với nhau để tích thêm điểm ELO. Mỗi trận thách đấu diễn ra tại CLB và phải được xác minh bởi quản lý CLB hoặc người dùng có quyền xác minh.

## Cấu Trúc Thách Đấu

### Điều Kiện và Mức Điểm

| Điểm cược | Số ván đấu | Tỉ lệ chấp (1 hạng) | Tỉ lệ chấp (0.5 hạng) |
|-----------|------------|---------------------|----------------------|
| 600 - 650 | RACE 22    | 3.5                 | 2.5                  |
| 500 - 550 | RACE 18    | 3                   | 2                    |
| 400 - 450 | RACE 16    | 2.5                 | 1.5                  |
| 300 - 350 | RACE 14    | 2                   | 1.5                  |
| 200 - 250 | RACE 12    | 1.5                 | 1                    |
| 100 - 150 | RACE 8     | 1                   | 0.5                  |

### Quy Trình Thách Đấu

1. **Tạo thách đấu**: Người chơi chọn đối thủ, CLB, và điểm cược
2. **Chấp nhận/từ chối**: Đối thủ có thể chấp nhận hoặc từ chối thách đấu
3. **Diễn ra trận đấu**: Trận đấu diễn ra tại CLB đã chọn
4. **Nhập kết quả**: Người thắng nhập kết quả trận đấu
5. **Xác minh**: Quản lý CLB hoặc người có quyền xác minh kết quả
6. **Tính điểm ELO**: Hệ thống tự động tính và cập nhật điểm ELO

## Cấu Trúc Database

### Bảng Chính

#### 1. `challenges`
Lưu trữ thông tin thách đấu:
- Người thách đấu và đối thủ
- CLB diễn ra trận đấu
- Điểm cược và cấu hình (race to, handicap)
- Trạng thái thách đấu
- Kết quả và thông tin xác minh

#### 2. `challenge_results`
Kết quả thách đấu và thay đổi ELO:
- Người thắng/thua
- Điểm số
- Điểm ELO trao đổi
- Thay đổi ELO của từng người chơi

#### 3. `challenge_verifications`
Xác minh thách đấu:
- Loại xác minh (hình ảnh, hóa đơn, khác)
- Dữ liệu xác minh (hình ảnh, số hóa đơn, mô tả)
- Trạng thái xác minh
- Người xác minh

## Tính Năng Chính

### 1. Tạo Thách Đấu
- Chọn đối thủ từ danh sách người chơi
- Chọn CLB diễn ra trận đấu
- Chọn điểm cược (100-650 điểm)
- Hệ thống tự động áp dụng cấu hình theo điểm cược
- Lên lịch thời gian (tùy chọn)

### 2. Quản Lý Thách Đấu
- Chấp nhận/từ chối thách đấu
- Bắt đầu trận đấu
- Nhập kết quả
- Hủy thách đấu

### 3. Xác Minh Thách Đấu
- Upload hình ảnh làm bằng chứng
- Nhập số hóa đơn
- Mô tả cách xác minh
- Phê duyệt/từ chối xác minh

### 4. Tính Điểm ELO
- Tính toán ELO dựa trên rating hiện tại
- K-factor thay đổi theo điểm cược
- Cập nhật rating người chơi
- Cập nhật bảng xếp hạng mùa và CLB

## API Endpoints

### Challenges
- `GET /challenges` - Lấy danh sách thách đấu
- `POST /challenges` - Tạo thách đấu mới
- `PUT /challenges/:id/accept` - Chấp nhận thách đấu
- `PUT /challenges/:id/decline` - Từ chối thách đấu
- `PUT /challenges/:id/start` - Bắt đầu thách đấu
- `PUT /challenges/:id/result` - Nhập kết quả
- `DELETE /challenges/:id` - Hủy thách đấu

### Verifications
- `POST /challenges/:id/verify` - Xác minh thách đấu
- `GET /challenges/:id/verifications` - Lấy danh sách xác minh
- `PUT /verifications/:id/approve` - Phê duyệt xác minh
- `PUT /verifications/:id/reject` - Từ chối xác minh

## Components React

### 1. ChallengeCard
Hiển thị thông tin thách đấu:
- Người thách đấu và đối thủ
- Cấu hình thách đấu (race to, handicap)
- Trạng thái và kết quả
- Các action tương ứng

### 2. CreateChallengeForm
Form tạo thách đấu mới:
- Chọn đối thủ và CLB
- Chọn điểm cược với preview cấu hình
- Lên lịch thời gian
- Validation và error handling

### 3. ChallengeVerificationModal
Modal xác minh thách đấu:
- Upload hình ảnh
- Nhập thông tin hóa đơn
- Mô tả cách xác minh
- Ghi chú bổ sung

## Hooks React

### useChallenges
Quản lý thách đấu:
- CRUD thách đấu
- Chấp nhận/từ chối
- Nhập kết quả
- Xác minh thách đấu
- Thống kê thách đấu

## Quy Trình Xác Minh

### 1. Yêu Cầu Xác Minh
- Trận đấu phải diễn ra tại CLB đã đăng ký
- Kết quả phải được nhập bởi người thắng
- Cần bằng chứng xác minh (hình ảnh, hóa đơn, v.v.)

### 2. Loại Bằng Chứng
- **Hình ảnh**: Ảnh chụp trận đấu, bảng điểm, v.v.
- **Hóa đơn**: Hóa đơn CLB có tên người chơi
- **Khác**: Mô tả cách xác minh khác

### 3. Quyền Xác Minh
- Quản lý CLB nơi diễn ra trận đấu
- Admin hệ thống
- Người dùng có quyền xác minh

### 4. Quy Trình Xử Lý
1. Upload bằng chứng
2. Nhập thông tin bổ sung
3. Gửi yêu cầu xác minh
4. Admin phê duyệt/từ chối
5. Cập nhật trạng thái thách đấu

## Tính Điểm ELO

### Công Thức Tính
```
K-factor = f(bet_points)
Expected Win = 1 / (1 + 10^((opponent_rating - player_rating) / 400))
ELO Change = K-factor * (actual_result - expected_result)
```

### K-factor Theo Điểm Cược
- 600-650 điểm: K = 32
- 500-550 điểm: K = 28
- 400-450 điểm: K = 24
- 300-350 điểm: K = 20
- 200-250 điểm: K = 16
- 100-150 điểm: K = 12

### Cập Nhật Rating
- Cập nhật rating người chơi
- Cập nhật bảng xếp hạng mùa
- Cập nhật bảng xếp hạng CLB
- Recalculate rankings

## Bảo Mật và Validation

### RLS Policies
- Chỉ người thách đấu mới có thể tạo thách đấu
- Chỉ đối thủ mới có thể chấp nhận/từ chối
- Chỉ người thắng mới có thể nhập kết quả
- Chỉ quản lý CLB mới có thể xác minh

### Validation
- Điểm cược phải từ 100-650
- Không thể thách đấu chính mình
- Trận đấu phải diễn ra tại CLB đã đăng ký
- Kết quả phải hợp lệ (race to)

### Anti-Fraud
- Xác minh bắt buộc cho mọi trận đấu
- Bằng chứng hình ảnh/hóa đơn
- Quyền xác minh hạn chế
- Logging tất cả hoạt động

## Monitoring và Analytics

### Thống Kê
- Số lượng thách đấu theo thời gian
- Tỷ lệ chấp nhận/từ chối
- Điểm ELO trao đổi trung bình
- Thời gian xác minh trung bình

### Báo Cáo
- Báo cáo thách đấu theo CLB
- Thống kê người chơi thách đấu nhiều nhất
- Phân tích xu hướng điểm cược
- Báo cáo gian lận tiềm ẩn

## Deployment

### Migration
```sql
-- Chạy migration để tạo hệ thống thách đấu
supabase db push
```

### Functions
```sql
-- Tạo các function cần thiết
CREATE OR REPLACE FUNCTION get_challenge_config(...)
CREATE OR REPLACE FUNCTION calculate_challenge_elo(...)
CREATE OR REPLACE FUNCTION process_challenge_result(...)
CREATE OR REPLACE FUNCTION verify_challenge(...)
```

### Storage
```sql
-- Tạo bucket cho hình ảnh xác minh
supabase storage create-bucket verification-images
```

## Tương Lai

### Tính Năng Dự Kiến
- Live streaming thách đấu
- Hệ thống đặt cược thách đấu
- Tournament từ thách đấu
- AI detection gian lận
- Mobile app cho thách đấu

### Mở Rộng
- Thách đấu team
- Thách đấu online
- Hệ thống ranking thách đấu
- Leaderboard thách đấu
- Rewards cho thách đấu 