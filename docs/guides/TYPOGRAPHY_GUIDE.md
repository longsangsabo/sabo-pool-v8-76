# SABO ARENA Typography Guide

## Tổng quan
Hệ thống typography của SABO ARENA sử dụng 4 font chính để tạo nên bộ nhận diện thương hiệu mạnh mẽ và hiện đại:

1. **Bebas Neue** - Brand Typography (Logo, tiêu đề chính)
2. **Epilogue** - Heading Typography (Tiêu đề phụ, nút bấm)
3. **Outfit** - Body Typography (Nội dung chính)
4. **Racing Sans One** - Stats Typography (Số liệu, thống kê)

## 1. Brand Typography - Bebas Neue

### Đặc điểm
- Font chữ in hoa, mạnh mẽ, thể thao
- Sử dụng cho logo, tên giải đấu, banner chính
- Tạo cảm giác năng động và chuyên nghiệp

### Classes có sẵn
```css
.brand-logo        /* Logo chính - 3xl/4xl/5xl */
.brand-title       /* Tiêu đề brand - 2xl/3xl/4xl */
.tournament-name   /* Tên giải đấu - xl/2xl/3xl */
```

### Ví dụ sử dụng
```jsx
<h1 className="brand-logo">SABO POOL ARENA</h1>
<h2 className="brand-title">GIẢI ĐẤU THẾ GIỚI</h2>
<h3 className="tournament-name">CHAMPION LEAGUE 2024</h3>
```

## 2. Heading Typography - Epilogue

### Đặc điểm
- Font hiện đại, rõ ràng, độ đọc cao
- Sử dụng cho tiêu đề section, nút bấm, thông tin quan trọng
- Có nhiều weight: 300, 400, 500, 600, 700, 800

### Classes có sẵn
```css
.heading-primary    /* Tiêu đề chính - xl/2xl/3xl, font-bold */
.heading-secondary  /* Tiêu đề phụ - lg/xl/2xl, font-semibold */
.heading-tertiary   /* Tiêu đề cấp 3 - base/lg/xl, font-medium */
.section-title      /* Tiêu đề section - lg/xl, font-semibold */
.card-title         /* Tiêu đề card - base/lg, font-medium */
.button-text        /* Text cho button - sm/base, font-medium */
.nav-text           /* Text navigation - sm/base, font-medium */
.username           /* Tên người dùng - sm/base, font-semibold */
.badge-text         /* Text cho badge - xs/sm, font-bold, uppercase */
.label-text         /* Text cho label - xs/sm, font-medium, uppercase */
```

### Ví dụ sử dụng
```jsx
<h2 className="heading-primary">Quản lý giải đấu</h2>
<h3 className="section-title">Danh sách người chơi</h3>
<button className="button-text bg-primary text-white px-4 py-2 rounded">
  Đăng ký tham gia
</button>
<span className="username">@player_name</span>
<span className="badge-text bg-green-100 text-green-800 px-2 py-1 rounded">
  VIP
</span>
```

## 3. Body Typography - Outfit

### Đặc điểm
- Font dễ đọc, hiện đại, trẻ trung
- Sử dụng cho nội dung chính, mô tả, thông tin chi tiết
- Weight: 300, 400, 500, 600, 700

### Classes có sẵn
```css
.body-large         /* Nội dung lớn - base/lg, font-400 */
.body-medium        /* Nội dung trung bình - sm/base, font-400 */
.body-small         /* Nội dung nhỏ - xs/sm, font-400 */
.description        /* Mô tả - sm/base, font-300, muted */
.link-text          /* Text cho link - sm/base, font-medium */
.timestamp          /* Thời gian - xs/sm, font-300, muted */
```

### Ví dụ sử dụng
```jsx
<p className="body-large">
  Đây là nội dung chính của bài viết với font size lớn hơn.
</p>
<p className="description">
  Mô tả chi tiết về giải đấu với màu muted để tạo hierarchy.
</p>
<a className="link-text text-primary" href="#">
  Xem thêm thông tin
</a>
<span className="timestamp">2 phút trước</span>
```

## 4. Stats Typography - Racing Sans One

### Đặc điểm
- Font gaming/tech, tạo cảm giác tốc độ và cạnh tranh
- Sử dụng cho ELO, tỷ lệ thắng, điểm số, thống kê
- Letter-spacing: 0.05em để tăng tính đọc

### Classes có sẵn
```css
.stats-large        /* Số liệu lớn - 2xl/3xl/4xl */
.stats-medium       /* Số liệu trung bình - xl/2xl/3xl */
.stats-small        /* Số liệu nhỏ - lg/xl/2xl */
.elo-score          /* ELO score - xl/2xl/3xl */
.match-score        /* Tỷ số trận đấu - lg/xl/2xl */
.win-rate           /* Tỷ lệ thắng - base/lg/xl */
```

### Ví dụ sử dụng
```jsx
<div className="text-center">
  <div className="elo-score text-blue-600">2450</div>
  <p className="body-small text-muted-foreground">ELO Rating</p>
</div>

<div className="flex justify-between">
  <span className="win-rate text-green-600">87.5%</span>
  <span className="match-score text-primary">15-7</span>
</div>
```

## 5. Responsive Typography

### Classes responsive có sẵn
```css
.text-responsive-xs  /* xs/sm/base */
.text-responsive-sm  /* sm/base/lg */
.text-responsive-md  /* base/lg/xl */
.text-responsive-lg  /* lg/xl/2xl */
.text-responsive-xl  /* xl/2xl/3xl */
```

### Ví dụ sử dụng
```jsx
<h2 className="text-responsive-lg font-heading font-bold">
  Tiêu đề responsive
</h2>
```

## 6. Best Practices

### 1. Hierarchy rõ ràng
```jsx
{/* Trang chính */}
<h1 className="brand-logo">SABO POOL ARENA</h1>
<h2 className="heading-primary">Giải đấu đang diễn ra</h2>
<h3 className="section-title">Danh sách tham gia</h3>
<p className="body-medium">Nội dung mô tả...</p>
```

### 2. Kết hợp màu sắc
```jsx
{/* Stats với màu semantic */}
<div className="stats-large text-green-600">2450</div>  {/* ELO cao */}
<div className="stats-medium text-red-600">45%</div>    {/* Tỷ lệ thấp */}
<div className="win-rate text-blue-600">87.5%</div>     {/* Thông tin */}
```

### 3. Responsive design
```jsx
{/* Mobile first approach */}
<h1 className="brand-title md:brand-logo">
  SABO POOL ARENA
</h1>
<p className="body-small md:body-medium lg:body-large">
  Nội dung responsive
</p>
```

### 4. Semantic meaning
```jsx
{/* Sử dụng đúng class cho đúng mục đích */}
<span className="username">@player_name</span>           {/* Tên user */}
<span className="timestamp">2 phút trước</span>          {/* Thời gian */}
<span className="elo-score">2450</span>                  {/* ELO score */}
<span className="tournament-name">WORLD CUP</span>       {/* Tên giải */}
```

## 7. Component Examples

### Tournament Card
```jsx
<div className="bg-white rounded-lg p-6 shadow-sm">
  <h3 className="tournament-name text-primary mb-2">
    GIẢI ĐẤU MÙA XUÂN 2024
  </h3>
  <div className="grid grid-cols-3 gap-4 mb-4">
    <div className="text-center">
      <div className="stats-medium text-green-600">32</div>
      <p className="body-small text-muted-foreground">Người chơi</p>
    </div>
    <div className="text-center">
      <div className="stats-medium text-blue-600">₫500K</div>
      <p className="body-small text-muted-foreground">Giải thưởng</p>
    </div>
    <div className="text-center">
      <div className="stats-medium text-orange-600">3</div>
      <p className="body-small text-muted-foreground">Ngày</p>
    </div>
  </div>
  <p className="description mb-4">
    Giải đấu bi-a 8 bi lớn nhất trong năm...
  </p>
  <button className="button-text bg-primary text-white px-6 py-2 rounded-lg">
    Đăng ký tham gia
  </button>
</div>
```

### Player Stats Card
```jsx
<div className="bg-white rounded-lg p-6 shadow-sm">
  <div className="flex items-center gap-4 mb-4">
    <img className="w-16 h-16 rounded-full" src="avatar.jpg" />
    <div>
      <h3 className="username text-lg">Nguyễn Văn An</h3>
      <span className="badge-text bg-green-100 text-green-800 px-2 py-1 rounded">
        PRO PLAYER
      </span>
    </div>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div className="text-center">
      <div className="elo-score text-blue-600">2450</div>
      <p className="body-small text-muted-foreground">ELO</p>
    </div>
    <div className="text-center">
      <div className="win-rate text-green-600">87.5%</div>
      <p className="body-small text-muted-foreground">Tỷ lệ thắng</p>
    </div>
  </div>
</div>
```

## 8. Migration Guide

### Từ typography cũ sang mới
```jsx
{/* CŨ */}
<h1 className="text-3xl font-bold">Title</h1>
<p className="text-base">Content</p>
<span className="text-2xl font-mono">2450</span>

{/* MỚI */}
<h1 className="heading-primary">Title</h1>
<p className="body-medium">Content</p>
<span className="elo-score">2450</span>
```

### Checklist migration
- [ ] Thay thế all heading tags với classes mới
- [ ] Cập nhật stats/numbers với font Racing Sans One
- [ ] Brand elements sử dụng Bebas Neue
- [ ] Body text sử dụng Outfit
- [ ] Test responsive trên mobile/tablet/desktop
- [ ] Kiểm tra contrast và accessibility

## 9. Performance Tips

1. **Font loading optimization đã được setup:**
   - Preconnect to Google Fonts
   - Font-display: swap
   - Only load needed weights

2. **CSS classes được optimize:**
   - Sử dụng Tailwind utilities
   - Mobile-first responsive
   - Consistent line-heights

3. **Accessibility:**
   - Minimum font sizes on mobile
   - Good contrast ratios
   - Semantic HTML structure

---

*Cập nhật cuối: $(date)*
*Phiên bản: 1.0*