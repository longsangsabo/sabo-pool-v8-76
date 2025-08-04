const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 📝 Auto Changelog Generator
 * Generates changelog entries from git commits
 */
class ChangelogGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.changelogPath = path.join(projectRoot, 'docs', 'auto-generated', 'auto-changelog.md');
  }

  /**
   * Generate changelog entry for specific commit
   */
  generateFromCommit(commitHash) {
    try {
      const commitInfo = this.getCommitInfo(commitHash);
      const changedFiles = this.getChangedFiles(commitHash);
      
      const entry = this.formatChangelogEntry(commitInfo, changedFiles);
      this.prependToChangelog(entry);
      
      console.log(`✅ Changelog updated for commit: ${commitHash.substring(0, 7)}`);
    } catch (error) {
      console.error('❌ Changelog generation failed:', error.message);
    }
  }

  /**
   * Generate changelog from recent commits
   */
  generateFromRecentCommits(count = 10) {
    try {
      const commits = this.getRecentCommits(count);
      let changelog = this.getChangelogHeader();
      
      commits.forEach(commit => {
        const changedFiles = this.getChangedFiles(commit.hash);
        const entry = this.formatChangelogEntry(commit, changedFiles);
        changelog += entry + '\n';
      });
      
      fs.writeFileSync(this.changelogPath, changelog);
      console.log(`✅ Changelog generated from ${commits.length} recent commits`);
    } catch (error) {
      console.error('❌ Changelog generation failed:', error.message);
    }
  }

  /**
   * Get commit information
   */
  getCommitInfo(commitHash) {
    const format = '--pretty=format:%H|%an|%ae|%ad|%s|%b';
    const output = execSync(`git show ${commitHash} ${format} --no-patch`, {
      cwd: this.projectRoot,
      encoding: 'utf8'
    }).trim();

    const [hash, author, email, date, subject, body] = output.split('|');
    
    return {
      hash,
      author,
      email,
      date: new Date(date),
      subject,
      body: body || '',
      type: this.getCommitType(subject),
      scope: this.getCommitScope(subject)
    };
  }

  /**
   * Get changed files for commit
   */
  getChangedFiles(commitHash) {
    const output = execSync(`git show ${commitHash} --name-status --pretty=format:`, {
      cwd: this.projectRoot,
      encoding: 'utf8'
    }).trim();

    const files = output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [status, ...pathParts] = line.split('\t');
        const filePath = pathParts.join('\t');
        return {
          status: this.getFileStatus(status),
          path: filePath,
          type: this.getFileType(filePath)
        };
      });

    return files;
  }

  /**
   * Get recent commits
   */
  getRecentCommits(count) {
    const format = '--pretty=format:%H|%an|%ae|%ad|%s';
    const output = execSync(`git log -${count} ${format}`, {
      cwd: this.projectRoot,
      encoding: 'utf8'
    }).trim();

    return output.split('\n').map(line => {
      const [hash, author, email, date, subject] = line.split('|');
      return {
        hash,
        author,
        email,
        date: new Date(date),
        subject,
        type: this.getCommitType(subject),
        scope: this.getCommitScope(subject)
      };
    });
  }

  /**
   * Format changelog entry
   */
  formatChangelogEntry(commit, changedFiles) {
    const date = commit.date.toISOString().split('T')[0];
    const time = commit.date.toTimeString().split(' ')[0];
    const shortHash = commit.hash.substring(0, 7);
    
    let entry = `## ${this.getCommitTypeEmoji(commit.type)} ${commit.subject}\n\n`;
    entry += `**Date**: ${date} ${time}  \n`;
    entry += `**Commit**: \`${shortHash}\`  \n`;
    entry += `**Author**: ${commit.author}  \n`;
    
    if (commit.scope) {
      entry += `**Scope**: ${commit.scope}  \n`;
    }
    
    entry += '\n';

    if (commit.body && commit.body.trim()) {
      entry += `### Description\n\n${commit.body.trim()}\n\n`;
    }

    // Group files by type
    const filesByType = {};
    changedFiles.forEach(file => {
      if (!filesByType[file.type]) {
        filesByType[file.type] = { added: [], modified: [], deleted: [] };
      }
      
      if (file.status === 'added') {
        filesByType[file.type].added.push(file.path);
      } else if (file.status === 'deleted') {
        filesByType[file.type].deleted.push(file.path);
      } else {
        filesByType[file.type].modified.push(file.path);
      }
    });

    // Add files section
    if (Object.keys(filesByType).length > 0) {
      entry += `### 📁 Files Changed\n\n`;
      
      Object.entries(filesByType).forEach(([type, files]) => {
        if (files.added.length + files.modified.length + files.deleted.length > 0) {
          entry += `#### ${this.getFileTypeEmoji(type)} ${type}\n\n`;
          
          if (files.added.length > 0) {
            entry += `**Added**:\n`;
            files.added.forEach(file => entry += `- ➕ \`${file}\`\n`);
            entry += '\n';
          }
          
          if (files.modified.length > 0) {
            entry += `**Modified**:\n`;
            files.modified.forEach(file => entry += `- 📝 \`${file}\`\n`);
            entry += '\n';
          }
          
          if (files.deleted.length > 0) {
            entry += `**Deleted**:\n`;
            files.deleted.forEach(file => entry += `- ❌ \`${file}\`\n`);
            entry += '\n';
          }
        }
      });
    }

    entry += '---\n';
    return entry;
  }

  /**
   * Prepend entry to existing changelog
   */
  prependToChangelog(entry) {
    let existingContent = '';
    
    if (fs.existsSync(this.changelogPath)) {
      existingContent = fs.readFileSync(this.changelogPath, 'utf8');
      
      // Remove header from existing content if it exists
      const headerEnd = existingContent.indexOf('---\n\n');
      if (headerEnd !== -1) {
        existingContent = existingContent.substring(headerEnd + 5);
      }
    }

    const newContent = this.getChangelogHeader() + entry + '\n\n' + existingContent;
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(this.changelogPath), { recursive: true });
    fs.writeFileSync(this.changelogPath, newContent);
  }

  /**
   * Get changelog header
   */
  getChangelogHeader() {
    const packageJson = this.getPackageInfo();
    const timestamp = new Date().toISOString();
    
    return `# 📝 Auto-Generated Changelog

*Project*: ${packageJson.name}  
*Version*: ${packageJson.version}  
*Generated*: ${timestamp}

This changelog is automatically generated from git commits and file changes.

---

`;
  }

  /**
   * Helper methods
   */
  getCommitType(subject) {
    const patterns = {
      feat: /^feat(\([^)]+\))?:/,
      fix: /^fix(\([^)]+\))?:/,
      docs: /^docs(\([^)]+\))?:/,
      style: /^style(\([^)]+\))?:/,
      refactor: /^refactor(\([^)]+\))?:/,
      test: /^test(\([^)]+\))?:/,
      chore: /^chore(\([^)]+\))?:/,
      build: /^build(\([^)]+\))?:/,
      ci: /^ci(\([^)]+\))?:/,
      perf: /^perf(\([^)]+\))?:/,
      revert: /^revert(\([^)]+\))?:/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(subject)) {
        return type;
      }
    }

    return 'other';
  }

  getCommitScope(subject) {
    const match = subject.match(/^\w+\(([^)]+)\):/);
    return match ? match[1] : null;
  }

  getCommitTypeEmoji(type) {
    const emojiMap = {
      feat: '✨',
      fix: '🐛',
      docs: '📚',
      style: '💄',
      refactor: '♻️',
      test: '✅',
      chore: '🔧',
      build: '📦',
      ci: '👷',
      perf: '⚡',
      revert: '⏪',
      other: '📝'
    };
    return emojiMap[type] || '📝';
  }

  getFileStatus(status) {
    const statusMap = {
      'A': 'added',
      'M': 'modified',
      'D': 'deleted',
      'R': 'renamed',
      'C': 'copied',
      'U': 'unmerged'
    };
    return statusMap[status] || 'modified';
  }

  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const pathSegments = filePath.toLowerCase().split('/');
    
    // Check by file extension
    if (['.ts', '.tsx'].includes(ext)) return 'TypeScript';
    if (['.js', '.jsx'].includes(ext)) return 'JavaScript';
    if (ext === '.md') return 'Documentation';
    if (ext === '.json') return 'Configuration';
    if (['.css', '.scss', '.sass'].includes(ext)) return 'Styles';
    if (['.html', '.htm'].includes(ext)) return 'HTML';
    if (['.test.ts', '.test.js', '.spec.ts', '.spec.js'].some(test => filePath.includes(test))) return 'Tests';
    
    // Check by path
    if (pathSegments.includes('docs')) return 'Documentation';
    if (pathSegments.includes('test') || pathSegments.includes('tests')) return 'Tests';
    if (pathSegments.includes('src')) return 'Source Code';
    if (pathSegments.includes('config') || pathSegments.includes('configs')) return 'Configuration';
    
    return 'Other';
  }

  getFileTypeEmoji(type) {
    const emojiMap = {
      'TypeScript': '📘',
      'JavaScript': '📙',
      'Documentation': '📝',
      'Configuration': '⚙️',
      'Styles': '🎨',
      'HTML': '🌐',
      'Tests': '🧪',
      'Source Code': '💻',
      'Other': '📄'
    };
    return emojiMap[type] || '📄';
  }

  getPackageInfo() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch (error) {
      return { name: 'Unknown Project', version: '1.0.0' };
    }
  }
}

module.exports = ChangelogGenerator;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const generator = new ChangelogGenerator();
  
  if (args[0]) {
    // Generate for specific commit
    generator.generateFromCommit(args[0]);
  } else {
    // Generate from recent commits
    generator.generateFromRecentCommits(20);
  }
}
