# 🎨 Frontend/UI Developer Guide - Sabo Pool Project

## 🏗️ Kiến trúc dự án hiện tại

```
Sabo Pool Arena Hub
├── 🏢 CLB Management (Hoàn thành)     ← Đồng nghiệp A
├── ⚙️  Admin System (Hoàn thành)      ← Đồng nghiệp B
└── 🎨 User Interface (Đang làm)       ← BẠN ĐÂY!
```

## 🎯 Nhiệm vụ của bạn: Frontend/UI Enhancement

### 🔍 Phạm vi công việc:

- **UI Components**: Buttons, Forms, Cards, Modals
- **Responsive Design**: Mobile-first approach
- **Styling**: CSS, Themes, Animations
- **User Experience**: Navigation, Layouts, Interactions
- **Visual Assets**: Icons, Images, Logos

### 📁 Cấu trúc thư mục đề xuất:

```
src/
├── components/
│   ├── ui/                    # 🎨 YOUR WORK
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Form/
│   │   └── Navigation/
│   ├── admin/                 # ⚙️ ADMIN (Đừng động vào)
│   └── clb/                   # 🏢 CLB (Đừng động vào)
├── styles/                    # 🎨 YOUR WORK
│   ├── globals.css
│   ├── variables.css
│   ├── components.css
│   └── themes/
│       ├── light.css
│       └── dark.css
├── assets/                    # 🎨 YOUR WORK
│   ├── images/
│   ├── icons/
│   ├── logos/
│   └── fonts/
└── layouts/                   # 🎨 YOUR WORK
    ├── MainLayout.tsx
    ├── AuthLayout.tsx
    └── DashboardLayout.tsx
```

---

## 🚀 Git Workflow cho UI Developer

### 🔧 Setup lần đầu

```bash
# Clone và setup
git clone https://github.com/longsangsabo/sabo-pool-v8-76.git
cd sabo-pool-v8-76
npm install

# Tạo branch UI của bạn
git checkout -b feature/ui-enhancement-[tên-bạn]
```

### 💻 Quy trình làm việc hàng ngày

#### 1. Bắt đầu ngày làm việc

```bash
git checkout main
git pull origin main                    # Lấy code mới nhất
git checkout feature/ui-enhancement-[tên-bạn]
git merge main                          # Merge code mới vào branch của bạn
```

#### 2. Làm việc trên UI

```bash
# Tạo UI component mới
mkdir -p src/components/ui/NewComponent
touch src/components/ui/NewComponent/NewComponent.tsx
touch src/components/ui/NewComponent/NewComponent.module.css
touch src/components/ui/NewComponent/index.ts

# Test UI component
npm run dev  # Chạy development server
```

#### 3. Commit thường xuyên

```bash
# Mỗi khi hoàn thành 1 component
git add src/components/ui/NewComponent/
git commit -m "feat(ui): add NewComponent with responsive design"

# Mỗi khi hoàn thành styling
git add src/styles/
git commit -m "style: update global styles and themes"
```

#### 4. Push cuối ngày

```bash
git push origin feature/ui-enhancement-[tên-bạn]
```

---

## 🎨 Best Practices cho UI/Frontend

### ✅ CSS Organization

```css
/* variables.css - Định nghĩa variables */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --border-radius: 8px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* components.css - Styles cho components */
.button {
  background-color: var(--primary-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}
```

### ✅ Component Structure

```tsx
// Button.tsx - Clean component structure
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}) => {
  return (
    <button
      className={`button button--${variant} button--${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### ✅ Responsive Design

```css
/* Mobile First Approach */
.container {
  width: 100%;
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: 2rem;
  }
}
```

---

## ⚠️ Lưu ý quan trọng

### 🚫 KHÔNG được động vào:

```
src/features/CLB/          # Code CLB của đồng nghiệp
src/components/admin/      # Code Admin của đồng nghiệp
src/pages/admin/           # Admin pages
src/hooks/use*CLB*         # CLB hooks
```

### ✅ An toàn để chỉnh sửa:

```
src/components/ui/         # UI components của bạn
src/styles/               # Global styles
src/assets/               # Images, icons
src/layouts/              # Layout components
public/                   # Static assets
```

### ⚡ Performance Tips:

- Optimize images (WebP format)
- Use CSS modules để tránh style conflicts
- Lazy load components nặng
- Minimize bundle size

---

## 🔧 Debugging & Testing

### Development Server

```bash
npm run dev           # Start dev server
npm run build         # Test production build
npm run preview       # Preview production build
```

### Browser Testing

- ✅ Chrome (Desktop + Mobile view)
- ✅ Firefox
- ✅ Safari (nếu có Mac)
- ✅ Mobile browsers (iOS Safari, Android Chrome)

### Tools để dùng:

- **React DevTools**: Debug components
- **Chrome DevTools**: Responsive testing
- **Lighthouse**: Performance audit

---

## 🆘 Troubleshooting

### Lỗi CSS conflicts:

```bash
# Kiểm tra CSS class trùng lặp
grep -r "className.*button" src/
```

### Lỗi component import:

```tsx
// Sử dụng absolute imports
import { Button } from '@/components/ui/Button';
// Thay vì relative imports
import { Button } from '../../../components/ui/Button';
```

### Performance issues:

```bash
# Kiểm tra bundle size
npm run build
npm run analyze  # Nếu có script này
```

---

## 🎁 Deliverables cuối dự án

### 📦 UI Component Library:

- [ ] Button (variants: primary, secondary, ghost)
- [ ] Card (với shadows và borders)
- [ ] Modal (responsive, accessible)
- [ ] Form components (input, select, textarea)
- [ ] Navigation (mobile menu, breadcrumbs)

### 🎨 Design System:

- [ ] Color palette
- [ ] Typography scale
- [ ] Spacing system
- [ ] Component documentation

### 📱 Responsive Layouts:

- [ ] Mobile-first design
- [ ] Tablet breakpoints
- [ ] Desktop optimization
- [ ] Cross-browser compatibility

---

## 📞 Support & Communication

### 🚨 Khi cần hỗ trợ khẩn cấp:

1. **CSS conflicts với admin/CLB**: Tag @admin-dev @clb-dev
2. **Git conflicts**: Liên hệ team lead ngay
3. **Performance issues**: Hỏi senior frontend dev

### 💬 Daily Communication:

- Morning standup: Báo cáo tiến độ UI
- Afternoon review: Demo UI components mới
- End of day: Push code và update team

---

**🎨 Happy Coding! Tạo ra những UI tuyệt đẹp nhé! ✨**
