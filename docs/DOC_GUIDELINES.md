# 📚 Documentation Management Guidelines

*#tags: guidelines, standards, process, documentation-system*

## 🎯 Overview

This guide establishes standards for creating, maintaining, and organizing documentation in the Sabo Pool V8 project to ensure consistency, discoverability, and maintainability.

---

## 📁 Folder Structure Rules

### 🏗️ Core Structure
```
docs/
├── 📋 [PREFIX]_[descriptive-name].md     ← Main consolidated docs
├── essential/                            ← Top 10 critical docs
├── working/                              ← Drafts & WIP documents  
├── archive/                              ← Historical & deprecated
├── templates/                            ← Document templates
├── automation/                           ← Management scripts
└── team-resources/                       ← Onboarding & reference
```

### 📂 Subfolder Guidelines
- **essential/**: Maximum 10 files, most critical docs only
- **working/**: Active development docs, reviewed weekly
- **archive/**: Files older than 90 days or superseded versions
- **templates/**: Standard document templates for each category
- **automation/**: Scripts for doc management and validation
- **team-resources/**: Onboarding guides, checklists, snippets

---

## 🏷️ Naming Conventions

### 📝 File Naming Pattern
```
[PREFIX]_[main-topic][-subtopic].md

Examples:
✅ TEST_comprehensive-guide.md
✅ SETUP_database-configuration.md
✅ DEV_frontend-components.md
✅ DEPLOY_production-checklist.md
✅ GUIDE_team-onboarding.md
```

### 🎯 Category Prefixes
| Prefix | Purpose | Examples |
|--------|---------|----------|
| `TEST_` | Testing documentation | `TEST_comprehensive-guide.md` |
| `SETUP_` | Setup & configuration | `SETUP_complete-guide.md` |
| `DEV_` | Development guides | `DEV_complete-guide.md` |
| `DEPLOY_` | Deployment procedures | `DEPLOY_production-checklist.md` |
| `GUIDE_` | General guides & references | `GUIDE_complete-project.md` |
| `PLAN_` | Project planning | `PLAN_roadmap-2025.md` |
| `REPORT_` | Status reports | `REPORT_monthly-progress.md` |
| `API_` | API documentation | `API_authentication-guide.md` |
| `ARCH_` | Architecture docs | `ARCH_system-design.md` |
| `SECURITY_` | Security guidelines | `SECURITY_authentication.md` |

### 🚫 Avoid These Patterns
```
❌ README.md (too generic)
❌ guide.md (no category)
❌ test-file.md (no prefix)
❌ VERY_LONG_FILENAME_WITH_TOO_MANY_WORDS.md
❌ file with spaces.md
❌ ALLCAPS.md
```

---

## 📋 Document Structure Standards

### 🎯 Required Metadata Header
```markdown
# 📊 [Document Title]

*#tags: category, topic, keywords, for-search*

**Last Updated**: [Date]
**Status**: [Draft|Review|Approved|Deprecated]
**Owner**: [Team/Person responsible]
**Dependencies**: [List of related docs]

**Purpose**: One-sentence description of document purpose

---
```

### 📝 Standard Section Structure
```markdown
## 🎯 Overview
Brief description and scope

## 🚀 Quick Start
Essential steps for immediate use

## 📚 Detailed Guide
Comprehensive information

## 🔧 Configuration
Setup and customization options

## 🧪 Testing
Validation and verification steps

## 🚨 Troubleshooting
Common issues and solutions

## 📖 References
Links to related documentation

---

**Last Updated**: [Date]
**Version**: [Semantic version]
**Status**: ✅ [Current status]
```

---

## ⏰ Document Lifecycle

### 📅 Creation Process
1. **Check existing docs** - Avoid duplication
2. **Choose appropriate prefix** - Follow naming conventions
3. **Use template** - Start with category template
4. **Add metadata** - Include all required headers
5. **Review dependencies** - Link to related docs
6. **Test examples** - Verify all code/commands work

### 🔄 Review Schedule
- **Weekly**: Review `working/` folder for stale drafts
- **Monthly**: Update status and last-modified dates
- **Quarterly**: Archive outdated docs (>90 days)
- **Annually**: Full documentation audit

### 📦 Archiving Rules
**Archive if**:
- Document is >90 days old without updates
- Content has been consolidated into newer doc
- Feature/process is deprecated
- Document is superseded by official version

**Archive process**:
```bash
git mv docs/OLD_doc.md docs/archive/[YYYY-MM]_OLD_doc.md
# Update any references to point to new location/doc
```

---

## 🔍 Quality Standards

### ✅ Content Requirements
- **Actionable**: Clear steps that users can follow
- **Complete**: No missing critical information
- **Tested**: All examples and code verified to work
- **Current**: Information reflects latest system state
- **Linked**: Proper cross-references to related docs

### 📏 Format Standards
- **Emoji sections**: Use consistent emoji for section headers
- **Code blocks**: Include language specification
- **Lists**: Use bullet points for readability
- **Links**: Use descriptive link text (not "click here")
- **Images**: Include alt text and captions

### 🎯 Writing Style
- **Concise**: Direct and to-the-point
- **Professional**: Business-appropriate tone
- **Inclusive**: Accessible to all skill levels
- **Consistent**: Follow established terminology

---

## 🤖 Automation Integration

### 📊 Automated Checks
- **Naming validation**: Verify prefix conventions
- **Link checking**: Ensure all internal links work
- **Staleness detection**: Flag docs >90 days old
- **Template compliance**: Check required metadata
- **Index generation**: Auto-update doc index

### 🔧 Automation Scripts
```bash
# Validate document naming
npm run docs:validate-naming

# Check for stale documents
npm run docs:check-stale

# Generate documentation index
npm run docs:generate-index

# Archive old documents
npm run docs:archive-old
```

---

## 👥 Team Responsibilities

### 📝 Content Owners
- **Developers**: `DEV_`, `TEST_`, `API_` documents
- **DevOps**: `SETUP_`, `DEPLOY_`, `SECURITY_` documents  
- **Project Managers**: `PLAN_`, `REPORT_`, `GUIDE_` documents
- **Team Leads**: Review and approval process

### 🔄 Review Process
1. **Draft**: Create in `working/` folder
2. **Review**: Team lead reviews for accuracy
3. **Approve**: Move to main `docs/` folder
4. **Maintain**: Regular updates and improvements

---

## 🚨 Emergency Procedures

### 🆘 Urgent Documentation Needs
1. Create minimal doc immediately with `[URGENT]` prefix
2. Include essential information only
3. Schedule proper documentation within 48 hours
4. Replace urgent doc with proper version

### 📞 Escalation Path
1. **Missing critical docs**: Contact team lead
2. **Incorrect information**: File GitHub issue immediately
3. **Broken processes**: Update doc and notify team
4. **System changes**: Update affected docs within 24 hours

---

## 📈 Success Metrics

### 🎯 Documentation KPIs
- **Coverage**: 100% of features documented
- **Freshness**: <10% of docs older than 90 days
- **Usage**: Documentation page views and feedback
- **Quality**: Regular user satisfaction surveys
- **Findability**: <30 seconds to locate any information

### 📊 Monthly Review
- Count of new documents created
- Number of documents archived
- User feedback and improvement suggestions
- Compliance with naming conventions
- Automation script effectiveness

---

## 🔗 Quick Reference

### 📚 Essential Commands
```bash
# Create new doc from template
cp docs/templates/[PREFIX]_template.md docs/[PREFIX]_new-doc.md

# Validate documentation
npm run docs:validate

# Archive old document  
git mv docs/old.md docs/archive/$(date +%Y-%m)_old.md
```

### 🎯 Quick Decision Tree
```
Need to document something?
├── Is it testing related? → Use TEST_ prefix
├── Is it setup/config? → Use SETUP_ prefix  
├── Is it development? → Use DEV_ prefix
├── Is it deployment? → Use DEPLOY_ prefix
└── General guide? → Use GUIDE_ prefix
```

---

**Established**: August 2025  
**Version**: 1.0  
**Status**: ✅ Active Guidelines  
**Next Review**: September 2025
