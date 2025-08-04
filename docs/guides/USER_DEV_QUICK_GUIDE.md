# 🎯 Git Quick Reference - User Interface/Frontend

## 🚀 Quy trình chuẩn (5 bước)

### 1️⃣ Setup

```bash
git checkout main
git pull origin main
git checkout -b feature/user-interface-enhancement
```

### 2️⃣ Code Structure

```
src/components/ui/     ← UI components của bạn
src/styles/           ← CSS và themes
src/assets/           ← Images, icons
src/layouts/          ← Layout components
```

### 3️⃣ Commit

```bash
git add src/components/ui/ src/styles/ src/assets/ src/layouts/
git commit -m "feat: Enhance user interface components"
```

### 4️⃣ Safety Check

```bash
./git-safety-check.sh  # Chạy script kiểm tra
```

### 5️⃣ Push & PR

```bash
git push -u origin feature/user-interface-enhancement
# Tạo Pull Request trên GitHub
```

---

## ✅ Lệnh AN TOÀN

| Mục đích       | Lệnh                                  |
| -------------- | ------------------------------------- |
| Xem trạng thái | `git status`                          |
| Xem diff       | `git diff`                            |
| Tạo branch     | `git checkout -b feature/new-feature` |
| Push branch    | `git push origin feature-branch`      |
| Pull updates   | `git pull origin main`                |

## ❌ Lệnh NGUY HIỂM - TUYỆT ĐỐI KHÔNG dùng

| ❌ TUYỆT ĐỐI KHÔNG        | ✅ Thay vào đó                |
| ------------------------- | ----------------------------- |
| `git push -f`             | `git push origin branch-name` |
| `git push --force`        | Tạo Pull Request              |
| `git reset --hard HEAD~5` | `git revert commit-hash`      |
| Push lên main trực tiếp   | Push lên feature branch       |

---

## 🆘 SOS - Khi gặp lỗi

### Lỗi: "Updates were rejected"

```bash
git pull origin feature/user-interface-enhancement
# Giải quyết conflict nếu có
git push origin feature/user-interface-enhancement
```

### Lỗi: "fatal: remote origin already exists"

```bash
git remote -v  # Xem remote hiện tại
# Bình thường, không cần làm gì
```

### Lỗi: Conflict khi merge

```bash
git status  # Xem files conflict
# Sửa conflict thủ công trong editor
git add .
git commit -m "resolve: Fix merge conflicts"
```

---

## 📱 Contacts

| Vai trò         | Tên             | Khi nào liên hệ             |
| --------------- | --------------- | --------------------------- |
| CLB Dev         | [Tên bạn]       | Conflict với CLB features   |
| Admin Dev       | [Tên admin dev] | Conflict với Admin features |
| UI/Frontend Dev | [Tên UI dev]    | Conflict với UI components  |
| Team Lead       | [Tên lead]      | Lỗi nghiêm trọng            |

---

## 🎪 Demo Day Checklist

- [ ] UI components responsive trên mobile/desktop
- [ ] Không conflict với admin/clb styling
- [ ] Files UI được tổ chức đúng thư mục
- [ ] Performance tốt (fast loading)
- [ ] Pull Request được tạo
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Screenshots UI mới đã attach vào PR

---

**💡 Pro Tip**: Luôn chạy `./git-safety-check.sh` trước khi push!
