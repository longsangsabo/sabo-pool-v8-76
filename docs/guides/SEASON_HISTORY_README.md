# Tính năng Lịch sử Mùa giải

## Tổng quan

Tính năng Lịch sử Mùa giải cho phép người dùng xem bảng xếp hạng của các mùa giải trước và tìm kiếm lịch sử thi đấu của từng người chơi.

## Cấu trúc Database

### Bảng `season_history`

```sql
CREATE TABLE season_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name TEXT NOT NULL,           -- Tên mùa giải (VD: S1, S2)
  season_year INTEGER NOT NULL,        -- Năm mùa giải
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,              -- Nickname người chơi
  ranking_points INTEGER NOT NULL,     -- Điểm ranking
  final_rank INTEGER NOT NULL,         -- Hạng cuối mùa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(season_name, season_year, user_id)
);
```

### View `season_stats`

View để xem thống kê tổng quan của từng mùa giải:
- Tổng số người chơi
- Điểm cao nhất
- Điểm thấp nhất
- Điểm trung bình
- Tổng số hạng

### Function `get_user_best_season(user_nickname TEXT)`

Function để tìm thành tích tốt nhất của một người chơi qua các mùa giải.

## Cách sử dụng

### 1. Truy cập tính năng

- Vào trang **Bảng xếp hạng & Đăng ký Rank**
- Chọn tab **"Lịch sử mùa"**

### 2. Xem bảng xếp hạng mùa giải

Tab **"Bảng xếp hạng"** hiển thị:
- **Thống kê mùa giải**: Tổng người chơi, điểm cao nhất, trung bình, thấp nhất
- **Bộ lọc**: Chọn mùa giải, tìm kiếm theo nickname
- **Bảng xếp hạng**: Danh sách người chơi theo hạng với phân trang

### 3. Tìm kiếm lịch sử cá nhân

Tab **"Tìm kiếm cá nhân"** cho phép:
- Nhập nickname để tìm kiếm
- Xem thành tích tốt nhất của người chơi
- Xem lịch sử thi đấu qua các mùa giải
- Phân tích xu hướng cải thiện/giảm sút

## Dữ liệu mẫu

### Mùa giải 2024-S2

Đã import dữ liệu của 153 người chơi với:
- **Hạng 1**: HẢI BÉ (13,725 điểm)
- **Hạng 2**: TUẤN KIỆT (9,700 điểm)
- **Hạng 3**: HÙNG FERARRI (5,125 điểm)
- ...
- **Hạng 153**: TRÍ MINHON (0 điểm)

## Deployment

### 1. Chạy migration

```bash
# Sử dụng Supabase CLI
supabase db push

# Hoặc chạy script SQL trực tiếp
psql -h your-db-host -U your-username -d your-database -f scripts/deploy-season-history.sql
```

### 2. Verify dữ liệu

```sql
-- Kiểm tra số lượng bản ghi
SELECT COUNT(*) FROM season_history;

-- Kiểm tra thống kê mùa S2 2024
SELECT * FROM season_stats WHERE season_name = 'S2' AND season_year = 2024;

-- Test function tìm kiếm
SELECT * FROM get_user_best_season('HẢI BÉ');
```

## API Endpoints

### Hook `useSeasonHistory`

```typescript
const {
  loading,
  error,
  getSeasonHistory,
  getSeasonStats,
  getUserBestSeason,
  getAvailableSeasons,
  searchPlayerHistory
} = useSeasonHistory();
```

### Các method chính:

- `getSeasonHistory(filters, page, limit)`: Lấy bảng xếp hạng với filter và phân trang
- `getSeasonStats(seasonName, seasonYear)`: Lấy thống kê mùa giải
- `getUserBestSeason(nickname)`: Tìm thành tích tốt nhất của người chơi
- `searchPlayerHistory(nickname)`: Tìm lịch sử thi đấu của người chơi

## Components

### SeasonHistoryTab

Component chính hiển thị:
- Tabs cho bảng xếp hạng và tìm kiếm cá nhân
- Thống kê mùa giải
- Bộ lọc và tìm kiếm
- Bảng xếp hạng với phân trang

### PlayerHistoryCard

Component tìm kiếm lịch sử cá nhân:
- Form tìm kiếm theo nickname
- Hiển thị thành tích tốt nhất
- Lịch sử thi đấu qua các mùa
- Phân tích xu hướng

## Bảo mật

### Row Level Security (RLS)

- **SELECT**: Tất cả user có thể xem lịch sử mùa giải
- **INSERT**: Chỉ admin mới có thể thêm dữ liệu mùa giải mới

### Policies

```sql
-- Cho phép tất cả user xem
CREATE POLICY "Users can view all season history" ON season_history
  FOR SELECT USING (true);

-- Chỉ admin mới thêm được
CREATE POLICY "Admins can insert season history" ON season_history
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );
```

## Thêm mùa giải mới

### 1. Chuẩn bị dữ liệu

Chuẩn bị file CSV hoặc Excel với format:
```
nickname,ranking_points,final_rank
NGUYỄN VĂN A,1500,1
TRẦN THỊ B,1200,2
...
```

### 2. Import dữ liệu

```sql
-- Thêm dữ liệu mùa giải mới
INSERT INTO season_history (season_name, season_year, nickname, ranking_points, final_rank) VALUES
('S1', 2025, 'NGUYỄN VĂN A', 1500, 1),
('S1', 2025, 'TRẦN THỊ B', 1200, 2),
-- ... thêm các bản ghi khác
```

### 3. Verify

```sql
-- Kiểm tra dữ liệu đã import
SELECT * FROM season_stats WHERE season_name = 'S1' AND season_year = 2025;
```

## Troubleshooting

### Lỗi thường gặp

1. **Không hiển thị dữ liệu**
   - Kiểm tra RLS policies
   - Verify dữ liệu đã được import
   - Check console errors

2. **Tìm kiếm không hoạt động**
   - Kiểm tra function `get_user_best_season`
   - Verify nickname trong database

3. **Performance chậm**
   - Kiểm tra indexes đã được tạo
   - Optimize queries với LIMIT và pagination

### Debug

```sql
-- Kiểm tra dữ liệu
SELECT COUNT(*) FROM season_history;

-- Kiểm tra view
SELECT * FROM season_stats;

-- Test function
SELECT * FROM get_user_best_season('test_nickname');
```

## Tính năng tương lai

- [ ] Export dữ liệu ra Excel/CSV
- [ ] Biểu đồ xu hướng ranking
- [ ] So sánh mùa giải
- [ ] Thông báo khi có mùa giải mới
- [ ] Tích hợp với hệ thống tournament 