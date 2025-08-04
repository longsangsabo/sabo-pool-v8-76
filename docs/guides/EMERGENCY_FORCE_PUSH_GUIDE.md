# 🚨 Emergency Force Push Guide - Bảo vệ Code Admin & CLB

## ⚠️ Khi nào cần Force Push?

- Pull Request bị reject do conflict nghiêm trọng
- History bị rối, cần clean up
- Deadline gấp, không thể chờ review
- Remote branch bị corrupt

## 🛡️ Quy trình Force Push AN TOÀN (TUYỆT ĐỐI tuân thủ)

### 🔥 BƯỚC QUAN TRỌNG NHẤT: BACKUP TOÀN BỘ CODE

#### 1. Tạo backup branch cho từng hệ thống

```bash
# Backup main branch hiện tại
git checkout main
git pull origin main
git checkout -b backup-main-$(date +%Y%m%d-%H%M%S)
git push origin backup-main-$(date +%Y%m%d-%H%M%S)

# Backup riêng Admin system
git checkout -b backup-admin-system-$(date +%Y%m%d-%H%M%S)
git push origin backup-admin-system-$(date +%Y%m%d-%H%M%S)

# Backup riêng CLB system
git checkout -b backup-clb-system-$(date +%Y%m%d-%H%M%S)
git push origin backup-clb-system-$(date +%Y%m%d-%H%M%S)

# Backup UI work
git checkout -b backup-ui-work-$(date +%Y%m%d-%H%M%S)
git push origin backup-ui-work-$(date +%Y%m%d-%H%M%S)
```

#### 2. Tạo backup files quan trọng

```bash
# Backup toàn bộ workspace
tar -czf backup-workspace-$(date +%Y%m%d-%H%M%S).tar.gz \
  src/features/CLB/ \
  src/components/admin/ \
  src/pages/admin/ \
  src/components/ui/ \
  src/styles/ \
  --exclude=node_modules

# Backup riêng từng hệ thống
tar -czf backup-admin-$(date +%Y%m%d-%H%M%S).tar.gz src/components/admin/ src/pages/admin/
tar -czf backup-clb-$(date +%Y%m%d-%H%M%S).tar.gz src/features/CLB/
tar -czf backup-ui-$(date +%Y%m%d-%H%M%S).tar.gz src/components/ui/ src/styles/ src/assets/
```

#### 3. Document current state

```bash
# Ghi lại danh sách files quan trọng
find src/features/CLB/ -name "*.tsx" -o -name "*.ts" | tee clb-files-backup.txt
find src/components/admin/ src/pages/admin/ -name "*.tsx" -o -name "*.ts" | tee admin-files-backup.txt
find src/components/ui/ src/styles/ -name "*.tsx" -o -name "*.ts" -o -name "*.css" | tee ui-files-backup.txt

# Ghi lại commit hash hiện tại
git log --oneline -10 > current-commits-backup.txt
```

### 🔄 FORCE PUSH với Verification Steps

#### 4. Merge safely trước khi force push

```bash
# Về main và tạo merge branch
git checkout main
git checkout -b pre-force-push-merge

# Merge từng hệ thống một cách có kiểm soát
git merge feature/ui-enhancement --no-ff -m "merge: Add UI enhancements"
git merge feature/additional-work --no-ff -m "merge: Add additional features"

# Kiểm tra không có files bị mất
echo "🔍 Checking Admin files..."
ls src/components/admin/ | wc -l
ls src/pages/admin/ | wc -l

echo "🔍 Checking CLB files..."
ls src/features/CLB/ | wc -l

echo "🔍 Checking UI files..."
ls src/components/ui/ | wc -l || echo "UI folder might not exist yet"
```

#### 5. Thực hiện Force Push với Safeguards

```bash
# Đảm bảo merge branch hoạt động
npm run build || {
  echo "❌ Build failed! Fixing before force push..."
  # Fix build errors here
}

# Force push merge branch (KHÔNG phải main)
git push -f origin pre-force-push-merge

# Test merge branch trên remote
git checkout pre-force-push-merge
git pull origin pre-force-push-merge

# Verify toàn bộ files còn nguyên
echo "🔍 Final verification..."
[[ -d "src/features/CLB" ]] && echo "✅ CLB folder exists" || echo "❌ CLB folder MISSING!"
[[ -d "src/components/admin" ]] && echo "✅ Admin folder exists" || echo "❌ Admin folder MISSING!"

# CHỈ KHI NÀO ĐÃ VERIFY ĐẦY ĐỦ thì mới force push main
read -p "🚨 Are you ABSOLUTELY SURE all systems are intact? (type 'YES-I-AM-SURE'): " confirm
if [ "$confirm" = "YES-I-AM-SURE" ]; then
  git checkout main
  git reset --hard pre-force-push-merge
  git push -f origin main
  echo "✅ Force push completed with safeguards"
else
  echo "❌ Force push cancelled for safety"
fi
```

---

## 🔧 Script tự động cho Emergency Force Push

Tôi sẽ tạo script này để automation:

### emergency-force-push.sh

```bash
#!/bin/bash

echo "🚨 EMERGENCY FORCE PUSH PROTOCOL"
echo "================================"

# Kiểm tra user confirmation
read -p "⚠️  Are you absolutely sure you need to force push? (y/N): " confirm
if [ "$confirm" != "y" ]; then
  echo "❌ Cancelled for safety"
  exit 1
fi

# Step 1: Create comprehensive backups
echo "📦 Creating backups..."
timestamp=$(date +%Y%m%d-%H%M%S)

# Backup branches
git checkout main
git pull origin main
git checkout -b "emergency-backup-main-$timestamp"
git push origin "emergency-backup-main-$timestamp"

git checkout -b "emergency-backup-admin-$timestamp"
git push origin "emergency-backup-admin-$timestamp"

git checkout -b "emergency-backup-clb-$timestamp"
git push origin "emergency-backup-clb-$timestamp"

# Backup files
tar -czf "emergency-backup-$timestamp.tar.gz" \
  src/features/CLB/ \
  src/components/admin/ \
  src/pages/admin/ \
  src/components/ui/ \
  src/styles/ \
  src/assets/ \
  --exclude=node_modules 2>/dev/null

# Document state
find src/features/CLB/ -type f 2>/dev/null | tee "clb-files-$timestamp.txt"
find src/components/admin/ src/pages/admin/ -type f 2>/dev/null | tee "admin-files-$timestamp.txt"
git log --oneline -20 > "commits-$timestamp.txt"

echo "✅ Backups created:"
echo "   - Branches: emergency-backup-*-$timestamp"
echo "   - Files: emergency-backup-$timestamp.tar.gz"
echo "   - Lists: *-files-$timestamp.txt"

# Step 2: Verify current state
echo "🔍 Verifying current state..."
admin_files=$(find src/components/admin/ src/pages/admin/ -name "*.tsx" 2>/dev/null | wc -l)
clb_files=$(find src/features/CLB/ -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)

echo "   📊 Admin files: $admin_files"
echo "   📊 CLB files: $clb_files"

if [ "$admin_files" -lt 10 ] || [ "$clb_files" -lt 10 ]; then
  echo "❌ WARNING: File counts seem low. Are admin/CLB systems intact?"
  read -p "Continue anyway? (y/N): " continue_anyway
  if [ "$continue_anyway" != "y" ]; then
    echo "❌ Cancelled - please investigate file counts"
    exit 1
  fi
fi

# Step 3: Safe merge and force push
echo "🔄 Creating safe merge branch..."
git checkout main
git checkout -b "pre-force-push-$timestamp"

# Here you would merge your feature branches
echo "   Add your merge commands here:"
echo "   git merge your-feature-branch --no-ff"
read -p "Press Enter after you've added your merges manually..."

# Verification before force push
echo "🔍 Final verification..."
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed - please fix before continuing"
  exit 1
fi

# Final confirmation
echo "🚨 FINAL CONFIRMATION:"
echo "   - Backups created: ✅"
echo "   - Build successful: ✅"
echo "   - Admin files: $admin_files"
echo "   - CLB files: $clb_files"
echo ""
read -p "Type 'FORCE-PUSH-NOW' to proceed: " final_confirm

if [ "$final_confirm" = "FORCE-PUSH-NOW" ]; then
  git push -f origin "pre-force-push-$timestamp"

  # Last chance to verify on remote
  echo "🌐 Branch pushed to remote. Please verify at:"
  echo "   https://github.com/longsangsabo/sabo-pool-v8-76/tree/pre-force-push-$timestamp"
  read -p "If everything looks good, type 'UPDATE-MAIN-NOW': " main_confirm

  if [ "$main_confirm" = "UPDATE-MAIN-NOW" ]; then
    git checkout main
    git reset --hard "pre-force-push-$timestamp"
    git push -f origin main
    echo "✅ Emergency force push completed with full safeguards"

    # Cleanup confirmation
    read -p "Keep backup branches? (Y/n): " keep_backups
    if [ "$keep_backups" = "n" ]; then
      git push origin --delete "emergency-backup-main-$timestamp"
      git push origin --delete "emergency-backup-admin-$timestamp"
      git push origin --delete "emergency-backup-clb-$timestamp"
      git push origin --delete "pre-force-push-$timestamp"
      echo "🗑️  Backup branches cleaned up"
    else
      echo "📦 Backup branches preserved for safety"
    fi
  else
    echo "❌ Main update cancelled"
  fi
else
  echo "❌ Force push cancelled"
fi

echo "🏁 Emergency force push protocol completed"
```

---

## 🚑 Recovery Plan nếu vẫn mất code

### Nếu Admin code bị mất:

```bash
# Restore từ backup branch
git checkout backup-admin-system-[timestamp]
mkdir -p src/components/admin src/pages/admin
cp -r src/components/admin/* ../main-branch/src/components/admin/
cp -r src/pages/admin/* ../main-branch/src/pages/admin/

# Hoặc restore từ file backup
tar -xzf emergency-backup-[timestamp].tar.gz
cp -r src/components/admin/* [main-workspace]/src/components/admin/
```

### Nếu CLB code bị mất:

```bash
# Restore từ backup branch
git checkout backup-clb-system-[timestamp]
cp -r src/features/CLB/* ../main-branch/src/features/CLB/

# Hoặc restore từ file backup
tar -xzf emergency-backup-[timestamp].tar.gz
cp -r src/features/CLB/* [main-workspace]/src/features/CLB/
```

---

## 📋 Checklist cho Emergency Force Push

### Pre-Force Push (BẮT BUỘC):

- [ ] ✅ Created backup branches (main, admin, clb, ui)
- [ ] ✅ Created file backups (.tar.gz)
- [ ] ✅ Documented file counts and commits
- [ ] ✅ Verified admin folder exists (>10 files)
- [ ] ✅ Verified CLB folder exists (>10 files)
- [ ] ✅ Build passes successfully
- [ ] ✅ Team notified about emergency push

### During Force Push:

- [ ] ✅ Merge to temporary branch first
- [ ] ✅ Push temp branch and verify remotely
- [ ] ✅ Final confirmation received
- [ ] ✅ Force push executed with logging

### Post-Force Push:

- [ ] ✅ Verify all systems on remote
- [ ] ✅ Run build on remote/deployment
- [ ] ✅ Notify team of completion
- [ ] ✅ Document what caused the emergency
- [ ] ✅ Plan prevention measures

---

**⚡ Remember: "Better safe than sorry" - Always backup first! ⚡**
