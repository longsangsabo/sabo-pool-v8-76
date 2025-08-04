# 📊 Hướng Dẫn Quản Lý Dữ Liệu Hiệu Quả - Sabo Pool Arena

## 🎯 Tổng Quan Hệ Thống Database

### 📋 Cấu Trúc Database Hoàn Chỉnh (40+ Tables)

#### **1. 👥 User Management**
- `profiles` - Thông tin người dùng
- `user_settings` - Cài đặt cá nhân
- `user_streaks` - Streak check-in và điểm thưởng
- `user_penalties` - Hình phạt và cảnh báo
- `user_follows` - Theo dõi người chơi

#### **2. 🏛️ Club System**
- `clubs` - Thông tin câu lạc bộ
- `club_profiles` - Hồ sơ chi tiết CLB
- `club_stats` - Thống kê hoạt động CLB
- `club_accountability` - Độ tin cậy CLB
- `memberships` - Thành viên CLB

#### **3. 🎱 Game Management**
- `challenges` - Thách đấu
- `matches` - Trận đấu
- `match_history` - Lịch sử hành động trận đấu
- `match_ratings` - Đánh giá sau trận
- `practice_sessions` - Luyện tập

#### **4. 🏆 Tournament System**
- `tournaments` - Giải đấu
- `tournament_registrations` - Đăng ký tham gia
- `tournament_matches` - Trận đấu giải đấu
- `tournament_brackets` - Bảng đấu
- `tournament_results` - Kết quả giải đấu

#### **5. 📊 Ranking & Stats**
- `player_stats` - Thống kê người chơi
- `player_trust_scores` - Điểm tin cậy
- `leaderboards` - Bảng xếp hạng
- `favorite_opponents` - Đối thủ yêu thích
- `rank_verifications` - Xác thực rank
- `rank_adjustments` - Điều chỉnh rank
- `rank_reports` - Báo cáo rank giả

#### **6. 💰 Payment & Wallet**
- `wallets` - Ví điện tử
- `wallet_transactions` - Giao dịch ví
- `table_bookings` - Đặt bàn
- `reward_redemptions` - Đổi thưởng

#### **7. 🛒 Marketplace**
- `products` - Sản phẩm
- `seller_profiles` - Hồ sơ người bán
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `shopping_cart` - Giỏ hàng
- `product_reviews` - Đánh giá sản phẩm
- `product_wishlist` - Danh sách yêu thích

#### **8. 📱 Social Features**
- `posts` - Bài đăng
- `post_comments` - Bình luận
- `post_likes` - Like bài đăng
- `comment_likes` - Like bình luận
- `notifications` - Thông báo
- `live_streams` - Live stream

#### **9. 🔍 Discovery**
- `player_availability` - Trạng thái sẵn sàng

---

## 🛠️ Hướng Dẫn Quản Lý Database

### 1. 📈 Monitoring & Performance

#### **Daily Checks (Kiểm tra hàng ngày)**
```sql
-- Kiểm tra số lượng users hoạt động
SELECT COUNT(*) as active_users 
FROM profiles 
WHERE updated_at > now() - interval '24 hours';

-- Top queries chậm
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Dung lượng database
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### **Weekly Analysis (Phân tích hàng tuần)**
```sql
-- Growth metrics
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as new_users
FROM profiles 
WHERE created_at > now() - interval '4 weeks'
GROUP BY week
ORDER BY week;

-- Tournament participation trends
SELECT 
  DATE_TRUNC('week', registration_date) as week,
  COUNT(*) as registrations
FROM tournament_registrations
WHERE registration_date > now() - interval '4 weeks'
GROUP BY week;
```

### 2. 🔧 Maintenance Tasks

#### **Index Optimization**
```sql
-- Tìm indexes không được sử dụng
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan as scans
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
AND schemaname = 'public';

-- Rebuild indexes nếu cần
REINDEX INDEX CONCURRENTLY idx_name;
```

#### **Data Cleanup (Dọn dệp dữ liệu)**
```sql
-- Xóa notifications cũ (>30 ngày)
DELETE FROM notifications 
WHERE created_at < now() - interval '30 days' 
AND is_read = true;

-- Xóa expired challenges
DELETE FROM challenges 
WHERE status = 'expired' 
AND created_at < now() - interval '7 days';

-- Archive old matches (>1 năm)
-- Chuyển sang bảng matches_archive trước khi xóa
```

### 3. 📊 Business Intelligence Queries

#### **Revenue Analytics**
```sql
-- Doanh thu theo tháng
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) as revenue
FROM wallet_transactions 
WHERE transaction_type = 'deposit'
GROUP BY month
ORDER BY month DESC;

-- Top CLB theo doanh thu
SELECT 
  c.name,
  SUM(tb.total_cost) as revenue
FROM table_bookings tb
JOIN clubs c ON c.id = tb.club_id
WHERE tb.payment_status = 'paid'
GROUP BY c.name
ORDER BY revenue DESC;
```

#### **User Engagement**
```sql
-- User retention (7-day)
WITH user_cohorts AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', created_at) as cohort_week
  FROM profiles
),
user_activities AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', last_checkin_date) as activity_week
  FROM user_streaks
)
SELECT 
  cohort_week,
  COUNT(DISTINCT uc.user_id) as cohort_size,
  COUNT(DISTINCT ua.user_id) as retained_users
FROM user_cohorts uc
LEFT JOIN user_activities ua 
  ON uc.user_id = ua.user_id 
  AND ua.activity_week = uc.cohort_week + interval '1 week'
GROUP BY cohort_week
ORDER BY cohort_week DESC;
```

### 4. 🚨 Data Quality Checks

#### **Data Integrity Validation**
```sql
-- Kiểm tra orphaned records
SELECT COUNT(*) as orphaned_matches 
FROM matches m
LEFT JOIN profiles p1 ON m.player1_id = p1.user_id
LEFT JOIN profiles p2 ON m.player2_id = p2.user_id
WHERE p1.user_id IS NULL OR p2.user_id IS NULL;

-- Kiểm tra duplicate phones
SELECT phone, COUNT(*) 
FROM profiles 
WHERE phone IS NOT NULL
GROUP BY phone 
HAVING COUNT(*) > 1;

-- Validate wallet balances
SELECT 
  w.user_id,
  w.balance,
  COALESCE(SUM(
    CASE 
      WHEN wt.transaction_type IN ('deposit', 'refund', 'reward') THEN wt.amount
      WHEN wt.transaction_type IN ('withdrawal', 'payment', 'penalty') THEN -wt.amount
      ELSE 0
    END
  ), 0) as calculated_balance
FROM wallets w
LEFT JOIN wallet_transactions wt ON w.id = wt.wallet_id
GROUP BY w.user_id, w.balance
HAVING w.balance != COALESCE(SUM(
  CASE 
    WHEN wt.transaction_type IN ('deposit', 'refund', 'reward') THEN wt.amount
    WHEN wt.transaction_type IN ('withdrawal', 'payment', 'penalty') THEN -wt.amount
    ELSE 0
  END
), 0);
```

### 5. 🔄 Backup Strategy

#### **Automated Backups**
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump "postgresql://[CONNECTION_STRING]" \
  --format=custom \
  --file="backup_$DATE.dump" \
  --verbose

# Compress and upload to cloud storage
gzip "backup_$DATE.dump"
aws s3 cp "backup_$DATE.dump.gz" s3://your-backup-bucket/
```

#### **Point-in-Time Recovery**
```sql
-- Restore to specific timestamp
pg_restore --clean --if-exists \
  --jobs=4 \
  --dbname=your_db \
  backup_file.dump
```

### 6. 🔐 Security Best Practices

#### **RLS Policy Audit**
```sql
-- Check tables without RLS
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (
  SELECT tablename 
  FROM pg_policies 
  WHERE schemaname = 'public'
);
```

#### **User Access Review**
```sql
-- Review admin users
SELECT DISTINCT user_id 
FROM user_roles 
WHERE role = 'admin';

-- Check failed login attempts
SELECT COUNT(*) as failed_attempts
FROM auth.audit_log_entries 
WHERE event_message LIKE '%failed%'
AND created_at > now() - interval '24 hours';
```

### 7. 📱 API Performance Optimization

#### **Query Optimization**
```sql
-- Add missing indexes based on query patterns
CREATE INDEX CONCURRENTLY idx_matches_club_date 
  ON matches(club_id, created_at);

CREATE INDEX CONCURRENTLY idx_posts_user_created 
  ON posts(user_id, created_at DESC);

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY idx_active_tournaments 
  ON tournaments(created_at) 
  WHERE status = 'active';
```

### 8. 📊 Real-time Analytics Setup

#### **Enable Realtime for Key Tables**
```sql
-- Enable realtime for live features
ALTER TABLE live_streams REPLICA IDENTITY FULL;
ALTER TABLE matches REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime 
ADD TABLE live_streams, matches, notifications;
```

---

## 🚀 Production Deployment Checklist

### Before Going Live:
- [ ] Run all data quality checks
- [ ] Verify all RLS policies
- [ ] Test backup/restore procedures
- [ ] Set up monitoring alerts
- [ ] Configure auto-scaling
- [ ] Load test with realistic data
- [ ] Verify all indexes are in place
- [ ] Test all API endpoints
- [ ] Security audit complete

### Post-Launch Monitoring:
- [ ] Daily performance reports
- [ ] Weekly growth analysis
- [ ] Monthly data cleanup
- [ ] Quarterly security review
- [ ] Semi-annual architecture review

---

## 📞 Support & Emergency Procedures

### Emergency Contacts:
- **Database Admin**: [Your Contact]
- **System Admin**: [Your Contact]
- **Security Team**: [Your Contact]

### Emergency Procedures:
1. **Database Down**: Check Supabase status, verify connections
2. **Performance Issues**: Review slow queries, check indexes
3. **Data Corruption**: Restore from latest backup
4. **Security Breach**: Immediately revoke compromised tokens

---

*Document cập nhật: {{current_date}}*
*Version: 1.0*