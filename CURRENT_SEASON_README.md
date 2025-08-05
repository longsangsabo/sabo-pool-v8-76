# Tính năng Mùa giải Hiện tại (Current Season)

## Tổng quan

Tính năng Mùa giải Hiện tại cho phép hiển thị thông tin chi tiết về mùa giải đang diễn ra, bao gồm:
- Thông tin mùa giải hiện tại (2025-S2)
- Tiến độ mùa giải với thanh progress bar
- So sánh với mùa giải trước
- Thống kê thay đổi của top players
- Dữ liệu 45 người chơi với điểm số và hạng

## Cấu trúc dữ liệu

### Bảng `current_season`
```sql
CREATE TABLE current_season (
  id UUID PRIMARY KEY,
  season_name TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ongoing',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Bảng `season_history` (đã có)
Thêm dữ liệu cho mùa 2025-S2 với 45 người chơi.

### Functions
- `get_current_season()`: Lấy thông tin mùa giải hiện tại
- `get_season_progress()`: Tính tiến độ mùa giải
- `get_user_best_season()`: Lấy mùa giải tốt nhất của user

## Dữ liệu mùa giải 2025-S2

### Thông tin mùa giải
- **Tên mùa**: S2 (Mùa 2)
- **Năm**: 2025
- **Thời gian**: 01/06/2025 - 30/09/2025
- **Trạng thái**: Đang diễn ra
- **Tổng người chơi**: 45

### Top 10 người chơi
| Hạng | Nickname | Điểm |
|------|----------|------|
| 1 | ĐĂNG RT | 3600 |
| 2 | KHÁNH HOÀNG | 3500 |
| 3 | THÙY LINH | 3450 |
| 4 | BEN SABO | 2300 |
| 5 | TRƯỜNG PHÚC | 2300 |
| 6 | HUY HÙNG | 2100 |
| 7 | BI SỨA | 2050 |
| 8 | LỌ LEM | 1650 |
| 9 | BẰNG NHIỆT | 1550 |
| 10 | THÀNH | 1450 |

## Components

### CurrentSeasonCard
Component chính hiển thị:
- Thông tin mùa giải hiện tại
- Thanh tiến độ với phần trăm hoàn thành
- Số ngày còn lại
- So sánh với mùa trước
- Thay đổi hạng của top players

### SeasonHistoryTab
Cập nhật với 3 tabs:
1. **Mùa hiện tại**: Hiển thị CurrentSeasonCard
2. **Bảng xếp hạng**: Leaderboard các mùa giải
3. **Tìm kiếm cá nhân**: Tìm kiếm lịch sử người chơi

## Tính năng

### 1. Hiển thị thông tin mùa giải
- Tên mùa và năm
- Ngày bắt đầu và kết thúc
- Số ngày còn lại
- Trạng thái mùa giải

### 2. Thanh tiến độ
- Hiển thị phần trăm hoàn thành mùa giải
- Số ngày đã qua và còn lại
- Progress bar trực quan

### 3. So sánh mùa giải
- So sánh thống kê với mùa trước
- Thay đổi số lượng người chơi
- Thay đổi điểm cao nhất và trung bình

### 4. Thay đổi top players
- Hiển thị thay đổi hạng của top 5
- Hiển thị thay đổi điểm số
- Icons trực quan cho xu hướng tăng/giảm

## Deployment

### 1. Chạy migration
```bash
# Chạy migration tự động
supabase db push

# Hoặc chạy script thủ công
psql -h your-db-host -U your-user -d your-db -f scripts/deploy-current-season.sql
```

### 2. Kiểm tra deployment
```sql
-- Kiểm tra dữ liệu đã được thêm
SELECT COUNT(*) FROM season_history WHERE season_name = 'S2' AND season_year = 2025;

-- Kiểm tra thông tin mùa hiện tại
SELECT * FROM get_current_season();

-- Kiểm tra tiến độ
SELECT * FROM get_season_progress('S2', 2025);
```

## Sử dụng

### 1. Import component
```tsx
import { CurrentSeasonCard } from '../components/CurrentSeasonCard';
```

### 2. Sử dụng trong component
```tsx
<CurrentSeasonCard className="my-4" />
```

### 3. Sử dụng hook
```tsx
import { useSeasonHistory } from '../hooks/useSeasonHistory';

const { getCurrentSeason, getSeasonProgress } = useSeasonHistory();

// Lấy thông tin mùa hiện tại
const currentSeason = await getCurrentSeason();

// Lấy tiến độ mùa giải
const progress = await getSeasonProgress('S2', 2025);
```

## API Endpoints

### Functions
- `get_current_season()`: Lấy thông tin mùa giải hiện tại
- `get_season_progress(season_name, season_year)`: Tính tiến độ mùa giải
- `get_user_best_season(nickname)`: Lấy mùa giải tốt nhất của user

### Views
- `season_stats`: Thống kê tổng hợp theo mùa giải

## Troubleshooting

### 1. Lỗi không hiển thị dữ liệu
- Kiểm tra migration đã chạy thành công
- Kiểm tra dữ liệu trong bảng `season_history`
- Kiểm tra dữ liệu trong bảng `current_season`

### 2. Lỗi functions
- Kiểm tra functions đã được tạo
- Kiểm tra quyền truy cập database
- Kiểm tra logs Supabase

### 3. Lỗi component
- Kiểm tra import đúng đường dẫn
- Kiểm tra TypeScript types
- Kiểm tra console errors

## Tương lai

### Tính năng dự kiến
1. **Real-time updates**: Cập nhật điểm số real-time
2. **Notifications**: Thông báo khi có thay đổi hạng
3. **Analytics**: Phân tích xu hướng mùa giải
4. **Predictions**: Dự đoán kết quả cuối mùa
5. **Achievements**: Hệ thống thành tích mùa giải

### Cải tiến
1. **Performance**: Tối ưu queries
2. **UI/UX**: Cải thiện giao diện
3. **Mobile**: Responsive design
4. **Accessibility**: Hỗ trợ accessibility

## Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ team phát triển. 