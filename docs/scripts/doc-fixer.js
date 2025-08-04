const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * 🔧 Documentation Fixer - Auto-repair existing docs
 * Scans và tự động fix broken references, outdated content
 */
class DocFixer {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.docsPath = path.join(projectRoot, 'docs');
    this.srcPath = path.join(projectRoot, 'src');
    this.packageJson = this.loadPackageJson();
    
    this.fixes = [];
    this.issues = [];
  }

  /**
   * Load package.json for version info
   */
  loadPackageJson() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch (error) {
      return { name: 'Unknown', version: '1.0.0' };
    }
  }

  /**
   * Scan all existing docs for issues
   */
  async scanAndFix() {
    console.log('🔍 Scanning existing documentation for issues...');
    
    const docFiles = glob.sync(path.join(this.docsPath, '**/*.md'), {
      ignore: ['**/node_modules/**', '**/auto-generated/**']
    });
    
    console.log(`Found ${docFiles.length} documentation files to check`);
    
    for (const filePath of docFiles) {
      await this.scanFile(filePath);
    }
    
    await this.generateFixReport();
    
    return {
      totalFiles: docFiles.length,
      issuesFound: this.issues.length,
      fixesApplied: this.fixes.length
    };
  }

  /**
   * Scan individual file for issues
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.docsPath, filePath);
      
      console.log(`📄 Checking: ${relativePath}`);
      
      let updatedContent = content;
      let hasChanges = false;
      
      // Check for various issues and fix them
      const checks = [
        this.fixBrokenLinks.bind(this),
        this.updateVersionReferences.bind(this),
        this.fixCodeReferences.bind(this),
        this.standardizeMetadata.bind(this),
        this.fixFileReferences.bind(this),
        this.updateOutdatedContent.bind(this)
      ];
      
      for (const check of checks) {
        const result = await check(updatedContent, filePath);
        if (result.content !== updatedContent) {
          updatedContent = result.content;
          hasChanges = true;
        }
        if (result.fixes) {
          this.fixes.push(...result.fixes);
        }
        if (result.issues) {
          this.issues.push(...result.issues);
        }
      }
      
      // Write back if changes were made
      if (hasChanges) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`✅ Fixed: ${relativePath}`);
      }
      
    } catch (error) {
      console.error(`❌ Error scanning ${filePath}:`, error.message);
      this.issues.push({
        file: filePath,
        type: 'scan_error',
        message: error.message
      });
    }
  }

  /**
   * Fix broken internal links
   */
  async fixBrokenLinks(content, filePath) {
    const fixes = [];
    const issues = [];
    let updatedContent = content;
    
    // Find markdown links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, linkText, linkPath] = match;
      
      // Skip external links
      if (linkPath.startsWith('http')) continue;
      
      // Check if internal link exists
      const resolvedPath = this.resolveLinkPath(linkPath, filePath);
      
      if (resolvedPath && !fs.existsSync(resolvedPath)) {
        // Try to find the file in current structure
        const fileName = path.basename(linkPath);
        const foundPath = this.findFileInDocs(fileName);
        
        if (foundPath) {
          const newPath = path.relative(path.dirname(filePath), foundPath);
          const newLink = `[${linkText}](${newPath})`;
          updatedContent = updatedContent.replace(fullMatch, newLink);
          
          fixes.push({
            file: path.relative(this.projectRoot, filePath),
            type: 'broken_link_fixed',
            oldPath: linkPath,
            newPath: newPath
          });
        } else {
          issues.push({
            file: path.relative(this.projectRoot, filePath),
            type: 'broken_link',
            path: linkPath
          });
        }
      }
    }
    
    return { content: updatedContent, fixes, issues };
  }

  /**
   * Update version references
   */
  async updateVersionReferences(content, filePath) {
    const fixes = [];
    let updatedContent = content;
    
    // Find version patterns
    const versionPatterns = [
      /version:\s*["\']?(\d+\.\d+\.\d+)["\']?/gi,
      /v(\d+\.\d+\.\d+)/g,
      /Version\s+(\d+\.\d+\.\d+)/gi
    ];
    
    const currentVersion = this.packageJson.version;
    
    versionPatterns.forEach(pattern => {
      const matches = Array.from(content.matchAll(pattern));
      matches.forEach(match => {
        const [fullMatch, foundVersion] = match;
        if (foundVersion !== currentVersion) {
          const newMatch = fullMatch.replace(foundVersion, currentVersion);
          updatedContent = updatedContent.replace(fullMatch, newMatch);
          
          fixes.push({
            file: path.relative(this.projectRoot, filePath),
            type: 'version_updated',
            oldVersion: foundVersion,
            newVersion: currentVersion
          });
        }
      });
    });
    
    return { content: updatedContent, fixes, issues: [] };
  }

  /**
   * Fix code references and imports
   */
  async fixCodeReferences(content, filePath) {
    const fixes = [];
    const issues = [];
    let updatedContent = content;
    
    // Find import statements in code blocks
    const importRegex = /```(?:typescript|javascript|tsx|jsx)\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const [fullMatch, codeBlock] = match;
      const importLines = codeBlock.split('\n').filter(line => 
        line.trim().startsWith('import')
      );
      
      importLines.forEach(importLine => {
        // Check if imported file exists
        const pathMatch = importLine.match(/from\s+['"](.*?)['"]/);
        if (pathMatch && pathMatch[1]) {
          const importPath = pathMatch[1];
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            // Relative import - check if file exists
            const resolvedPath = this.resolveImportPath(importPath, filePath);
            if (resolvedPath && !fs.existsSync(resolvedPath)) {
              issues.push({
                file: path.relative(this.projectRoot, filePath),
                type: 'broken_import',
                import: importPath
              });
            }
          }
        }
      });
    }
    
    return { content: updatedContent, fixes, issues };
  }

  /**
   * Standardize metadata headers
   */
  async standardizeMetadata(content, filePath) {
    const fixes = [];
    let updatedContent = content;
    
    // Check if file has proper metadata header
    const hasMetadata = content.includes('*#tags:') && 
                       content.includes('**Last Updated**:') &&
                       content.includes('**Status**:');
    
    if (!hasMetadata) {
      // Try to add basic metadata
      const fileName = path.basename(filePath, '.md');
      const title = this.extractTitle(content) || fileName;
      const category = this.categorizeFile(filePath);
      
      const metadata = `\n*#tags: ${category}, documentation, auto-fixed*\n\n` +
                      `**Last Updated**: ${new Date().toISOString().split('T')[0]}\n` +
                      `**Status**: Review Required\n` +
                      `**Owner**: Documentation Team\n\n` +
                      `**Purpose**: ${title}\n\n---\n\n`;
      
      // Insert after first heading
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        const insertIndex = content.indexOf('\n', headingMatch.index);
        updatedContent = content.slice(0, insertIndex) + metadata + content.slice(insertIndex);
        
        fixes.push({
          file: path.relative(this.projectRoot, filePath),
          type: 'metadata_added',
          description: 'Added standard metadata headers'
        });
      }
    }
    
    return { content: updatedContent, fixes, issues: [] };
  }

  /**
   * Fix file references
   */
  async fixFileReferences(content, filePath) {
    const fixes = [];
    const issues = [];
    let updatedContent = content;
    
    // Find file references in backticks
    const fileRefRegex = /`([^`]+\.(ts|tsx|js|jsx|md))`/g;
    let match;
    
    while ((match = fileRefRegex.exec(content)) !== null) {
      const [fullMatch, fileName] = match;
      
      // Check if file exists in project
      const foundPath = this.findFileInProject(fileName);
      if (!foundPath) {
        issues.push({
          file: path.relative(this.projectRoot, filePath),
          type: 'missing_file_reference',
          fileName: fileName
        });
      }
    }
    
    return { content: updatedContent, fixes, issues };
  }

  /**
   * Update outdated content patterns
   */
  async updateOutdatedContent(content, filePath) {
    const fixes = [];
    let updatedContent = content;
    
    // Update common outdated patterns
    const replacements = [
      // Update old React patterns
      { 
        pattern: /React\.FC</g, 
        replacement: 'React.FC<',
        description: 'Updated React.FC syntax'
      },
      // Update import patterns
      {
        pattern: /import React, \{ FC \}/g,
        replacement: 'import React from \'react\';\nimport type { FC }',
        description: 'Updated React import syntax'
      },
      // Update date references
      {
        pattern: /\b202[0-3]\b/g,
        replacement: '2025',
        description: 'Updated year references'
      }
    ];
    
    replacements.forEach(({ pattern, replacement, description }) => {
      if (pattern.test(content)) {
        updatedContent = updatedContent.replace(pattern, replacement);
        fixes.push({
          file: path.relative(this.projectRoot, filePath),
          type: 'content_updated',
          description
        });
      }
    });
    
    return { content: updatedContent, fixes, issues: [] };
  }

  /**
   * Generate fix report
   */
  async generateFixReport() {
    const reportPath = path.join(this.docsPath, 'auto-generated', 'fix-report.md');
    
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    
    let report = `# 🔧 Documentation Fix Report

*Generated on: ${date}*
*Total Files Scanned: ${this.fixes.length + this.issues.length}*

## ✅ Fixes Applied (${this.fixes.length})

`;

    if (this.fixes.length > 0) {
      const fixesByType = {};
      this.fixes.forEach(fix => {
        if (!fixesByType[fix.type]) {
          fixesByType[fix.type] = [];
        }
        fixesByType[fix.type].push(fix);
      });
      
      Object.entries(fixesByType).forEach(([type, fixes]) => {
        report += `### ${this.getFixTypeTitle(type)} (${fixes.length})\n\n`;
        fixes.forEach(fix => {
          report += `- **${fix.file}**: ${fix.description || this.getFixDescription(fix)}\n`;
        });
        report += '\n';
      });
    } else {
      report += 'No automatic fixes were needed.\n\n';
    }

    report += `## ⚠️ Issues Found (${this.issues.length})

`;

    if (this.issues.length > 0) {
      const issuesByType = {};
      this.issues.forEach(issue => {
        if (!issuesByType[issue.type]) {
          issuesByType[issue.type] = [];
        }
        issuesByType[issue.type].push(issue);
      });
      
      Object.entries(issuesByType).forEach(([type, issues]) => {
        report += `### ${this.getIssueTypeTitle(type)} (${issues.length})\n\n`;
        issues.forEach(issue => {
          report += `- **${issue.file}**: ${issue.message || this.getIssueDescription(issue)}\n`;
        });
        report += '\n';
      });
    } else {
      report += 'No issues found! 🎉\n\n';
    }

    report += `---

**Report Generated**: ${timestamp}  
**Status**: ${this.issues.length === 0 ? '✅ All Good' : '⚠️ Issues Need Attention'}  
**Next Scan**: Run \`npm run docs:fix\` to scan again
`;

    // Ensure directory exists
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    console.log(`📊 Fix report generated: ${path.relative(this.projectRoot, reportPath)}`);
  }

  /**
   * Helper methods
   */
  resolveLinkPath(linkPath, fromFile) {
    if (linkPath.startsWith('/')) {
      return path.join(this.projectRoot, linkPath);
    }
    return path.resolve(path.dirname(fromFile), linkPath);
  }

  resolveImportPath(importPath, fromFile) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const basePath = path.resolve(path.dirname(fromFile), '../../src', importPath);
    
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    return null;
  }

  findFileInDocs(fileName) {
    const files = glob.sync(path.join(this.docsPath, '**', fileName));
    return files[0] || null;
  }

  findFileInProject(fileName) {
    const files = glob.sync(path.join(this.projectRoot, '**', fileName), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    return files[0] || null;
  }

  extractTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].replace(/[📊🔧⚙️🎯📚🧩]/g, '').trim() : null;
  }

  categorizeFile(filePath) {
    const pathSegments = filePath.toLowerCase().split(path.sep);
    
    if (pathSegments.some(seg => seg.includes('test'))) return 'testing';
    if (pathSegments.some(seg => seg.includes('setup'))) return 'setup';
    if (pathSegments.some(seg => seg.includes('deploy'))) return 'deployment';
    if (pathSegments.some(seg => seg.includes('dev'))) return 'development';
    if (pathSegments.some(seg => seg.includes('guide'))) return 'guide';
    
    return 'documentation';
  }

  getFixTypeTitle(type) {
    const titles = {
      'broken_link_fixed': '🔗 Broken Links Fixed',
      'version_updated': '📦 Version References Updated',
      'metadata_added': '📋 Metadata Headers Added',
      'content_updated': '📝 Content Updated'
    };
    return titles[type] || type;
  }

  getIssueTypeTitle(type) {
    const titles = {
      'broken_link': '🔗 Broken Links',
      'broken_import': '📦 Broken Imports',
      'missing_file_reference': '📄 Missing File References',
      'scan_error': '❌ Scan Errors'
    };
    return titles[type] || type;
  }

  getFixDescription(fix) {
    switch (fix.type) {
      case 'broken_link_fixed':
        return `Fixed link from \`${fix.oldPath}\` to \`${fix.newPath}\``;
      case 'version_updated':
        return `Updated version from ${fix.oldVersion} to ${fix.newVersion}`;
      default:
        return 'Applied automatic fix';
    }
  }

  getIssueDescription(issue) {
    switch (issue.type) {
      case 'broken_link':
        return `Broken link to: ${issue.path}`;
      case 'broken_import':
        return `Broken import: ${issue.import}`;
      case 'missing_file_reference':
        return `File not found: ${issue.fileName}`;
      default:
        return issue.message || 'Issue detected';
    }
  }
}

module.exports = DocFixer;

// CLI usage
if (require.main === module) {
  (async () => {
    console.log('🔧 Starting Documentation Fixer...');
    
    const fixer = new DocFixer();
    const results = await fixer.scanAndFix();
    
    console.log('\n📊 Results:');
    console.log(`Files scanned: ${results.totalFiles}`);
    console.log(`Issues found: ${results.issuesFound}`);
    console.log(`Fixes applied: ${results.fixesApplied}`);
    
    if (results.fixesApplied > 0) {
      console.log('\n✅ Documentation automatically fixed!');
    }
    
    if (results.issuesFound > 0) {
      console.log('\n⚠️ Some issues require manual attention. Check the fix report.');
    }
    
    console.log('\n🎉 Documentation fix scan complete!');
  })();
}
