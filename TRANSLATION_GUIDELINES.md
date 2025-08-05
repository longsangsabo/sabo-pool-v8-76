# 🌐 SABO Pool Arena - Translation Guidelines

## 🎯 Mục Tiêu
Đảm bảo toàn bộ giao diện admin hỗ trợ song ngữ EN/VI hoàn chỉnh.

## ✅ Quy Tắc Bắt Buộc

### 1. **KHÔNG hardcode text trong components**
```typescript
// ❌ Sai - Hardcoded text
<Button>Create Tournament</Button>
<h1>User Management</h1>

// ✅ Đúng - Sử dụng translation
<Button>{t('tournaments.create')}</Button>
<h1>{t('users.title')}</h1>
```

### 2. **Luôn thêm translation key trước khi commit**
```typescript
// Khi thêm component mới, đảm bảo có translation files
const { t } = useTranslation('newFeature');
```

### 3. **Cập nhật cả EN và VI translations**
```json
// src/locales/en/newFeature.json
{
  "title": "New Feature",
  "description": "Feature description"
}

// src/locales/vi/newFeature.json  
{
  "title": "Tính Năng Mới",
  "description": "Mô tả tính năng"
}
```

## 🔧 Tools & Scripts

### **Translation Checker**
```bash
# Kiểm tra hardcoded strings và missing keys
npm run check-translations

# Báo cáo sẽ được lưu tại translation-report.json
```

### **Pre-commit Check**
```bash
# Setup pre-commit hook (tự động)
git config core.hooksPath scripts/
```

## 📊 Current Status

**✅ Hoàn thành:**
- Admin interface core pages (20+ pages)
- Translation infrastructure complete
- Language toggle functionality
- Fallback mechanism

**⚠️ Cần cải thiện:**
- 1076 hardcoded strings detected
- Legacy components chưa được dịch
- Error messages và tooltips

## 🚀 Priority Tasks

### **High Priority:**
1. Dịch AdminSidebarClean.tsx hardcoded strings
2. Cập nhật AuthLayout và AuthTestingDashboard
3. Form validation messages
4. Error handling components

### **Medium Priority:**
1. Legacy components
2. Tooltip texts
3. Modal dialogs
4. Loading states

### **Low Priority:**
1. Debug messages
2. Console logs
3. Development-only texts

## 📝 Best Practices

### **1. Namespace Organization**
```typescript
// Tổ chức theo feature/module
useTranslation('dashboard')  // dashboard.json
useTranslation('users')     // users.json  
useTranslation('tournaments') // tournaments.json
```

### **2. Key Naming Convention**
```json
{
  "title": "Page Title",
  "actions": {
    "create": "Create",
    "edit": "Edit", 
    "delete": "Delete"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive"
  }
}
```

### **3. Fallback Strategy**
```typescript
// Sử dụng fallback cho missing keys
{t('key', 'Default fallback text')}
```

## ⚡ Quick Commands

```bash
# Check translations
npm run check-translations

# Find specific hardcoded strings
grep -r "hardcoded text" src/

# Update translation files
code src/locales/vi/[namespace].json
```

## 🎯 Success Metrics

- **0 hardcoded strings** in production code
- **100% translation coverage** for admin interface  
- **Consistent language switching** across all pages
- **No missing translation keys** between EN/VI

---
🇻🇳 **Remember:** Every user-facing text should support Vietnamese! 
✨ **Goal:** Native Vietnamese experience for all admin users.
