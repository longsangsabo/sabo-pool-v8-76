# Hệ Thống Giải Đấu SABO POOL ARENA

## Tổng Quan

Hệ thống giải đấu SABO POOL ARENA được thiết kế để quản lý các giải đấu billiards liên tục với cấu trúc mùa giải và hệ thống tính điểm ELO. Mỗi CLB có thể tổ chức giải đấu riêng, và người chơi sẽ nhận được điểm ELO dựa trên thành tích của họ.

## Cấu Trúc Hệ Thống

### 1. Mùa Giải (Seasons)
- Mỗi mùa giải kéo dài nhiều tháng
- Mùa 2 hiện tại kéo dài đến hết 30/9/2025
- Top BXH của mùa sẽ nhận được phần thưởng của hệ thống SABO POOL ARENA

### 2. Hạng Giải Đấu (Tournament Tiers)
Hệ thống có 4 hạng giải đấu với điểm ELO khác nhau:

#### Giải Hạng G (Cao cấp nhất)
- 🥇 Top 1: +1200 điểm ELO
- 🥈 Top 2: +900 điểm ELO  
- 🥉 Top 3: +700 điểm ELO
- 4th: +500 điểm ELO
- Top 8: +250 điểm ELO
- Tham gia: +100 điểm ELO
- Phí đăng ký: 500,000 - 2,000,000 VNĐ

#### Giải Hạng H (Trung cấp)
- 🥇 Top 1: +1100 điểm ELO
- 🥈 Top 2: +850 điểm ELO
- 🥉 Top 3: +650 điểm ELO
- 4th: +450 điểm ELO
- Top 8: +200 điểm ELO
- Tham gia: +100 điểm ELO
- Phí đăng ký: 200,000 - 800,000 VNĐ

#### Giải Hạng I (Cơ bản)
- 🥇 Top 1: +1000 điểm ELO
- 🥈 Top 2: +800 điểm ELO
- 🥉 Top 3: +600 điểm ELO
- 4th: +400 điểm ELO
- Top 8: +150 điểm ELO
- Tham gia: +100 điểm ELO
- Phí đăng ký: 100,000 - 500,000 VNĐ

#### Giải Hạng K (Cho người mới)
- 🥇 Top 1: +1000 điểm ELO
- 🥈 Top 2: +800 điểm ELO
- 🥉 Top 3: +600 điểm ELO
- 4th: +400 điểm ELO
- Top 8: +150 điểm ELO
- Tham gia: +100 điểm ELO
- Phí đăng ký: 50,000 - 200,000 VNĐ

## Cấu Trúc Database

### Bảng Chính

#### 1. `tournament_tiers`
Lưu trữ thông tin các hạng giải đấu và điểm ELO tương ứng.

#### 2. `seasons`
Quản lý các mùa giải với thời gian bắt đầu/kết thúc.

#### 3. `tournaments`
Thông tin chi tiết về các giải đấu:
- Thông tin cơ bản (tên, mô tả, địa điểm)
- Loại giải đấu (single_elimination, double_elimination, round_robin, swiss)
- Format game (8_ball, 9_ball, 10_ball, straight_pool)
- Hạng giải đấu (tier_code)
- Giải thưởng và phí đăng ký
- Trạng thái giải đấu

#### 4. `tournament_registrations`
Quản lý đăng ký tham gia giải đấu.

#### 5. `tournament_matches`
Quản lý các trận đấu trong giải.

#### 6. `tournament_results`
Kết quả cuối cùng của người chơi trong giải đấu.

#### 7. `season_standings`
Bảng xếp hạng tổng thể của mùa giải.

#### 8. `club_standings`
Bảng xếp hạng riêng của từng CLB.

## Tính Năng Chính

### 1. Quản Lý Giải Đấu
- Tạo giải đấu với hạng và điểm ELO tương ứng
- Quản lý đăng ký tham gia
- Theo dõi trận đấu và kết quả
- Tự động tính điểm ELO khi kết thúc giải

### 2. Bảng Xếp Hạng
- **Bảng xếp hạng mùa giải**: Tổng hợp điểm ELO từ tất cả giải đấu trong mùa
- **Bảng xếp hạng CLB**: Chỉ tính người chơi đã xác nhận hạng tại CLB đó
- Hiển thị thay đổi thứ hạng (tăng/giảm)

### 3. Hệ Thống ELO
- Tính điểm ELO tự động dựa trên hạng giải đấu và vị trí
- Cộng dồn điểm qua các giải đấu
- Cập nhật thứ hạng real-time

### 4. Quản Lý CLB
- Mỗi CLB có bảng xếp hạng riêng
- Xác nhận người chơi tại CLB
- Thống kê thành tích CLB

## API Endpoints

### Tournaments
- `GET /tournaments` - Lấy danh sách giải đấu
- `POST /tournaments` - Tạo giải đấu mới
- `PUT /tournaments/:id` - Cập nhật giải đấu
- `DELETE /tournaments/:id` - Xóa giải đấu
- `POST /tournaments/:id/register` - Đăng ký tham gia
- `POST /tournaments/:id/finalize` - Kết thúc giải đấu

### Seasons
- `GET /seasons` - Lấy danh sách mùa giải
- `GET /seasons/:id/standings` - Bảng xếp hạng mùa
- `GET /seasons/:id/statistics` - Thống kê mùa giải

### Club Standings
- `GET /clubs/:id/standings` - Bảng xếp hạng CLB
- `POST /clubs/:id/verify-player` - Xác nhận người chơi tại CLB
- `DELETE /clubs/:id/players/:userId` - Xóa người chơi khỏi CLB

## Components React

### 1. TournamentCard
Hiển thị thông tin giải đấu với:
- Hạng giải đấu và điểm ELO
- Giải thưởng và phí đăng ký
- Trạng thái và thông tin tham gia

### 2. SeasonLeaderboard
Bảng xếp hạng mùa giải với:
- Thứ hạng và điểm ELO
- Thay đổi thứ hạng
- Thành tích và giải thưởng

### 3. ClubLeaderboard
Bảng xếp hạng CLB với:
- Thứ hạng trong CLB
- Trạng thái xác nhận
- Thành tích tại CLB

### 4. TournamentTierSelector
Chọn hạng giải đấu với:
- Hiển thị điểm ELO của từng hạng
- Phí đăng ký và yêu cầu
- So sánh các hạng

## Hooks React

### 1. useTournaments
Quản lý giải đấu:
- CRUD giải đấu
- Đăng ký/hủy đăng ký
- Quản lý trận đấu và kết quả
- Tính điểm ELO

### 2. useSeasons
Quản lý mùa giải:
- Lấy thông tin mùa giải
- Bảng xếp hạng mùa
- Thống kê và tiến độ

### 3. useClubStandings
Quản lý bảng xếp hạng CLB:
- Xác nhận người chơi
- Bảng xếp hạng CLB
- So sánh CLB

## Quy Trình Hoạt Động

### 1. Tạo Giải Đấu
1. CLB chọn hạng giải đấu (G/H/I/K)
2. Nhập thông tin giải đấu
3. Hệ thống tự động áp dụng điểm ELO theo hạng

### 2. Đăng Ký Tham Gia
1. Người chơi xem thông tin giải đấu
2. Đăng ký tham gia (nếu còn chỗ)
3. Thanh toán phí đăng ký

### 3. Diễn Ra Giải Đấu
1. Quản lý trận đấu
2. Cập nhật kết quả
3. Theo dõi tiến độ

### 4. Kết Thúc Giải Đấu
1. Nhập kết quả cuối cùng
2. Hệ thống tự động tính điểm ELO
3. Cập nhật bảng xếp hạng mùa và CLB

### 5. Kết Thúc Mùa Giải
1. Tổng kết điểm ELO của mùa
2. Trao giải thưởng cho top BXH
3. Bắt đầu mùa giải mới

## Bảo Mật và Quyền Truy Cập

### RLS Policies
- Chỉ CLB owner mới có thể tạo/sửa giải đấu
- Người chơi chỉ có thể đăng ký giải đấu
- Tournament organizer có thể quản lý trận đấu và kết quả
- Tất cả người dùng có thể xem bảng xếp hạng

### Validation
- Kiểm tra hạn chế hạng cho giải đấu
- Validate phí đăng ký theo hạng
- Kiểm tra số lượng người tham gia
- Validate thời gian đăng ký và diễn ra

## Monitoring và Analytics

### Thống Kê
- Số lượng giải đấu theo hạng
- Tổng điểm ELO phân phối
- Thành tích CLB
- Tiến độ mùa giải

### Báo Cáo
- Báo cáo giải đấu theo thời gian
- Thống kê người chơi tham gia
- Phân tích xu hướng điểm ELO
- So sánh hiệu suất CLB

## Deployment

### Migration
```sql
-- Chạy migration để tạo hệ thống giải đấu
supabase db push
```

### Functions
```sql
-- Tạo các function cần thiết
CREATE OR REPLACE FUNCTION calculate_tournament_elo_points(...)
CREATE OR REPLACE FUNCTION recalculate_rankings(...)
```

### Triggers
```sql
-- Tạo triggers tự động cập nhật
CREATE TRIGGER trigger_update_season_standings(...)
CREATE TRIGGER trigger_update_club_standings(...)
```

## Tương Lai

### Tính Năng Dự Kiến
- Live streaming giải đấu
- Hệ thống đặt cược
- Tournament brackets tự động
- Mobile app cho tournament management
- AI prediction kết quả giải đấu

### Mở Rộng
- Liên kết với các CLB khác
- Giải đấu quốc tế
- Hệ thống ranking toàn cầu
- E-sports integration 