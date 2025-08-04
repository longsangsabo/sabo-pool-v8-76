# 🚀 Team Onboarding: Documentation Quick Start

*#tags: onboarding, team, quick-start, documentation-system*

**Last Updated**: August 4, 2025
**Status**: Active
**Owner**: Documentation Team
**Dependencies**: DOC_GUIDELINES.md, Templates

**Purpose**: Get new team members productive with our documentation system in 5 minutes

---

## ⚡ 5-Minute Quick Start

### 🎯 Step 1: Understand the System (1 minute)
```bash
# View documentation structure
ls docs/

# Check current documentation index
cat docs/DOC_INDEX.md
```

**Key Concept**: We use **PREFIX_descriptive-name.md** naming convention:
- `TEST_` - Testing docs
- `SETUP_` - Configuration & setup
- `DEV_` - Development guides  
- `DEPLOY_` - Deployment procedures
- `GUIDE_` - General guides

### 🛠️ Step 2: Create Your First Doc (2 minutes)
```bash
# Copy appropriate template
cp docs/templates/DEV_template.md docs/DEV_my-feature.md

# Edit the new document
code docs/DEV_my-feature.md
```

**Template Checklist**:
- [ ] Replace `[bracketed]` placeholders
- [ ] Update metadata headers (#tags, Last Updated, Status, Owner)
- [ ] Add your specific content
- [ ] Test any code examples

### 🔍 Step 3: Validate & Publish (2 minutes)
```bash
# Validate your document
./docs/automation/doc-management.sh

# Check naming and format
npm run docs:validate

# Update documentation index
npm run docs:generate-index
```

---

## 📋 Essential Knowledge

### 🏷️ Naming Rules (Must Know)
```
✅ GOOD Examples:
- TEST_api-integration.md
- SETUP_database-config.md  
- DEV_user-authentication.md
- DEPLOY_production-checklist.md

❌ BAD Examples:
- test.md (no prefix)
- README-setup.md (wrong format)
- My Feature Guide.md (spaces, no prefix)
- VERY_LONG_FILENAME_WITH_TOO_MANY_WORDS.md
```

### 📁 Folder Structure (Must Know)
```
docs/
├── PREFIX_main-docs.md          ← Your new docs go here
├── essential/                   ← Top 10 critical docs only
├── working/                     ← Your drafts & WIP docs
├── templates/                   ← Copy these to start new docs
├── automation/                  ← Management scripts (don't touch)
└── team-resources/             ← This folder (training materials)
```

### 🎯 Required Metadata (Must Include)
```markdown
# 📊 Your Document Title

*#tags: category, topic, keywords, for-search*

**Last Updated**: YYYY-MM-DD
**Status**: Draft|Review|Approved
**Owner**: Your Name/Team
**Dependencies**: Related docs

**Purpose**: One-sentence description
```

---

## 🛠️ VS Code Setup

### 📝 Install Useful Extensions
```bash
# Markdown support
code --install-extension yzhang.markdown-all-in-one

# Spell checking
code --install-extension streetsidesoftware.code-spell-checker

# Auto-formatting
code --install-extension esbenp.prettier-vscode
```

### ⚡ VS Code Snippets
Add these to your VS Code snippets for faster documentation:

**File**: `.vscode/markdown.code-snippets`
```json
{
  "Doc Header": {
    "prefix": "docheader",
    "body": [
      "# 📊 ${1:Document Title}",
      "",
      "*#tags: ${2:category}, ${3:topic}, ${4:keywords}*",
      "",
      "**Last Updated**: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "**Status**: ${5|Draft,Review,Approved|}",
      "**Owner**: ${6:Your Name}",
      "**Dependencies**: ${7:Related docs}",
      "",
      "**Purpose**: ${8:Brief description}",
      "",
      "---",
      "",
      "$0"
    ],
    "description": "Standard documentation header"
  },
  
  "Quick Section": {
    "prefix": "section",
    "body": [
      "## ${1:🎯 Section Title}",
      "",
      "${2:Section content}",
      "",
      "$0"
    ],
    "description": "Quick section with emoji"
  },
  
  "Code Block": {
    "prefix": "codeblock",
    "body": [
      "```${1:language}",
      "${2:// Code example}",
      "```",
      "",
      "$0"
    ],
    "description": "Code block with language"
  }
}
```

### ⌨️ Useful Keyboard Shortcuts
- `Ctrl/Cmd + Shift + V` - Preview markdown
- `Ctrl/Cmd + K, V` - Open markdown preview to side
- `Alt + Shift + F` - Format document
- `Ctrl/Cmd + /` - Toggle line comment

---

## 🎯 Common Tasks

### 📝 Creating Documentation

#### 1. **New Feature Guide**
```bash
# Use DEV_ template
cp docs/templates/DEV_template.md docs/DEV_your-feature.md
```

#### 2. **Setup Instructions**
```bash
# Use SETUP_ template  
cp docs/templates/SETUP_template.md docs/SETUP_your-system.md
```

#### 3. **Testing Documentation**
```bash
# Use TEST_ template
cp docs/templates/TEST_template.md docs/TEST_your-tests.md
```

### 🔍 Finding Information

#### Search by Content
```bash
# Find documentation mentioning specific term
grep -r "authentication" docs/

# Search excluding archived docs
grep -r "API" docs/ --exclude-dir=archive
```

#### Search by Filename
```bash
# Find all test-related docs
find docs/ -name "TEST_*"

# Find recent documents (last 7 days)
find docs/ -name "*.md" -mtime -7
```

### 🧹 Maintenance Tasks

#### Weekly Maintenance
```bash
# Run automated checks
./docs/automation/doc-management.sh

# Update documentation index
npm run docs:generate-index

# Check for stale documents
find docs/ -name "*.md" -mtime +90
```

#### Archive Old Documents
```bash
# Archive completed task documentation
git mv docs/OLD_task.md docs/archive/$(date +%Y-%m)_OLD_task.md

# Update any references
grep -r "OLD_task.md" docs/ --exclude-dir=archive
```

---

## ✅ Quick Reference Checklist

### 📋 Before Creating a Document
- [ ] Check if similar documentation already exists
- [ ] Choose correct PREFIX based on document type
- [ ] Copy appropriate template from `docs/templates/`
- [ ] Verify you have all information needed

### 📋 While Writing
- [ ] Follow the template structure
- [ ] Update all metadata headers
- [ ] Include practical examples and code snippets
- [ ] Test any commands or code you include
- [ ] Add proper cross-references to related docs

### 📋 Before Publishing
- [ ] Run validation: `./docs/automation/doc-management.sh`
- [ ] Check naming follows conventions
- [ ] Verify all links work
- [ ] Update documentation index
- [ ] Get team review if required

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This
```bash
# Wrong naming
touch docs/readme.md
touch docs/guide.md
touch docs/My Feature.md

# Wrong location
echo "content" > docs/archive/new-feature.md

# No validation
git add docs/ && git commit -m "added docs"
```

### ✅ Do This Instead
```bash
# Correct naming
cp docs/templates/DEV_template.md docs/DEV_my-feature.md

# Correct location
# Main docs go in docs/ root
# Drafts go in docs/working/
# Old docs go in docs/archive/

# Always validate
./docs/automation/doc-management.sh
git add docs/ && git commit -m "docs: add DEV_my-feature guide"
```

---

## 🆘 Getting Help

### 📞 Quick Support
- **Documentation Issues**: #docs-help Slack channel
- **Template Questions**: Check `docs/DOC_GUIDELINES.md`
- **Technical Problems**: Create GitHub issue with `documentation` label
- **Team Lead**: @docs-team for urgent documentation needs

### 📚 Resources
- **Full Guidelines**: `docs/DOC_GUIDELINES.md`
- **All Templates**: `docs/templates/`
- **Examples**: Look at `TEST_comprehensive-guide.md`, `SETUP_complete-guide.md`
- **Automation Help**: `./docs/automation/doc-management.sh --help`

---

## 🎯 Success Metrics

### 📊 You're Doing Great When:
- ✅ You can create a new document in under 3 minutes
- ✅ Your documents pass validation on first try
- ✅ Team members easily find and use your documentation
- ✅ You update existing docs when making code changes
- ✅ You archive outdated documentation promptly

### 📈 Team Goals
- **Documentation Coverage**: 100% of features documented
- **Findability**: <30 seconds to locate any information
- **Freshness**: <10% of docs older than 90 days
- **Quality**: All docs follow template structure

---

**Welcome to the team! 🎉**

*You're now ready to contribute high-quality documentation that helps everyone be more productive!*

---

**Created**: August 2025  
**Version**: 1.0  
**Status**: ✅ Ready for Onboarding
