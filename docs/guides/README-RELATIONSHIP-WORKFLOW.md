# 🔄 Relationship Management Workflow

## Tổng quan
Hệ thống tự động hóa để quản lý và đảm bảo consistency của Supabase foreign key relationships trong toàn bộ codebase.

## 🚀 Features

### 1. **Relationship Mapping System**
- Định nghĩa chuẩn cho tất cả relationships
- Mapping tự động giữa tables và foreign keys
- Utility functions để build queries consistent

### 2. **Validation Engine**
- Tự động scan và detect relationship issues
- Báo cáo chi tiết về các vấn đề
- Phân loại theo mức độ nghiêm trọng (error/warning/info)

### 3. **Auto-Fix Tool**
- Tự động sửa các pattern không đúng chuẩn
- Smart context-aware fixes
- Preview mode để xem trước changes

### 4. **Development Integration**
- CLI commands để check/fix relationships
- VS Code tasks integration
- Pre-commit hooks để prevent issues

## 📁 Cấu trúc Files

```
src/utils/
├── relationshipMapper.ts      # Core mapping system
├── relationshipValidator.ts   # Validation engine
└── relationshipAutoFix.ts     # Auto-fix functionality

scripts/
└── relationship-check.js      # CLI tool

.vscode/
└── settings.json             # VS Code integration
```

## 🛠 Usage

### CLI Commands

```bash
# Check for relationship issues
npm run relationship-check

# Preview potential fixes  
npm run relationship-preview

# Apply auto-fixes
npm run relationship-fix

# Verbose output
npm run relationship-check -- --verbose
```

### VS Code Integration

1. **Command Palette**: 
   - `Tasks: Run Task` → `Check Relationships`
   - `Tasks: Run Task` → `Fix Relationships`

2. **Problems Panel**: Issues sẽ được hiển thị trong Problems tab

### Programmatic Usage

```typescript
import { 
  getStandardRelationship,
  buildSelectWithRelationships,
  validateRelationships,
  autoFixRelationships 
} from '@/utils/relationshipMapper';

// Get standard relationship name
const rel = getStandardRelationship('challenges', 'challenger_id');
// Returns: 'profiles!challenger_id'

// Build consistent query
const query = buildSelectWithRelationships('*', [
  {
    alias: 'challenger_profile',
    table: 'challenges', 
    foreignKey: 'challenger_id',
    fields: ['full_name', 'display_name']
  }
]);

// Validate code content
const issues = validateRelationships(codeContent);

// Auto-fix content
const fixed = autoFixRelationships(codeContent);
```

## 🎯 Relationship Standards

### Current Standards

| Table | Foreign Key | Referenced Table | Standard Format |
|-------|-------------|------------------|-----------------|
| challenges | challenger_id | profiles | `profiles!challenger_id` |
| challenges | opponent_id | profiles | `profiles!opponent_id` |
| challenges | club_id | club_profiles | `club_profiles!club_id` |
| matches | player1_id | profiles | `profiles!player1_id` |
| matches | player2_id | profiles | `profiles!player2_id` |
| tournaments | created_by | profiles | `profiles!created_by` |

### ❌ Deprecated Patterns

```typescript
// OLD - Don't use these
profiles!challenges_challenger_id_fkey
profiles!challenges_opponent_id_fkey 
user_profiles!challenger_id
clubs!club_id

// NEW - Use these instead
profiles!challenger_id
profiles!opponent_id
profiles!challenger_id
club_profiles!club_id
```

## 🔧 Common Fixes Applied

1. **Foreign Key Format**: 
   - `profiles!challenges_challenger_id_fkey` → `profiles!challenger_id`

2. **Table References**:
   - `user_profiles!` → `profiles!`
   - `clubs!` → `club_profiles!`

3. **Field Names**:
   - `clubs.name` → `club_profiles.club_name`

4. **Query Structure**:
   - Automatically fix select statements
   - Ensure consistent field mappings

## 📊 Validation Rules

### Error Level Issues
- Deprecated foreign key formats
- Incorrect table references
- Missing relationship definitions

### Warning Level Issues  
- Outdated table names
- Inconsistent query patterns

### Info Level Issues
- Complex queries that could use utilities
- Potential optimization opportunities

## 🚀 Development Workflow

### Pre-commit Hook
```bash
# Automatically runs relationship check before commit
git commit -m "feature: add new challenge system"
# → Runs relationship-check automatically
# → Fails commit if issues found
```

### CI/CD Integration
```yaml
# .github/workflows/relationship-check.yml
- name: Check Relationships
  run: npm run relationship-check
```

### IDE Integration
- Real-time validation trong VS Code
- Quick fixes suggestions
- Auto-completion for standard relationships

## 📈 Benefits

1. **Consistency**: Đảm bảo tất cả relationships follow cùng standard
2. **Error Prevention**: Catch issues trước khi deploy
3. **Developer Experience**: Auto-fixes và clear error messages
4. **Maintainability**: Dễ refactor và update relationships
5. **Documentation**: Self-documenting relationship standards

## 🔮 Future Enhancements

- [ ] **IDE Plugin**: Full VS Code extension
- [ ] **Type Generation**: Auto-generate TypeScript types
- [ ] **Performance Monitoring**: Track query performance
- [ ] **Schema Sync**: Auto-update mapping từ Supabase schema
- [ ] **Team Dashboard**: Web interface để monitor relationships

## 🆘 Troubleshooting

### Common Issues

**Issue**: Script không chạy được
```bash
chmod +x scripts/relationship-check.js
npm run relationship-check
```

**Issue**: VS Code tasks không hiển thị
- Reload VS Code window
- Check `.vscode/settings.json` syntax

**Issue**: Auto-fix không apply changes
- Check file permissions
- Ensure files không bị lock bởi editor

### Debug Mode
```bash
npm run relationship-check -- --verbose
```

## 🤝 Contributing

1. Update `RELATIONSHIP_MAPPINGS` khi add tables mới
2. Add validation patterns cho common issues
3. Test auto-fix patterns thoroughly
4. Update documentation

---

*Generated by Relationship Management Workflow v1.0*