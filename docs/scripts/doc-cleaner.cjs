const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 🧹 Advanced Documentation Cleanup System
 * Automated cleanup, deduplication, and optimization
 */
class DocumentationCleaner {
  constructor(docsRoot = './docs') {
    this.docsRoot = path.resolve(docsRoot);
    this.cleanupReport = {
      timestamp: new Date().toISOString(),
      before: { files: 0, size: 0 },
      after: { files: 0, size: 0 },
      actions: [],
      duplicates: [],
      orphans: [],
      optimizations: [],
      errors: []
    };
    
    // File patterns to ignore
    this.ignorePatterns = [
      /node_modules/,
      /\.git/,
      /\.vscode/,
      /auto-generated/,
      /scripts/
    ];
    
    // File extensions to process
    this.docExtensions = ['.md', '.txt', '.rst', '.html'];
    this.imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    
    // Temporary/backup file patterns
    this.tempPatterns = [
      /\.bak$/,
      /\.tmp$/,
      /\.temp$/,
      /~$/,
      /\.swp$/,
      /#.*#$/,
      /\.DS_Store$/
    ];
  }

  /**
   * Main cleanup entry point
   */
  async performCleanup(options = {}) {
    console.log('🧹 Starting Advanced Documentation Cleanup...');
    
    try {
      await this.scanBeforeState();
      
      if (options.duplicates !== false) await this.removeDuplicates();
      if (options.orphans !== false) await this.cleanupOrphans();
      if (options.optimization !== false) await this.optimizeContent();
      if (options.maintenance !== false) await this.maintenanceCleanup();
      if (options.validation !== false) await this.validateAfterCleanup();
      
      await this.scanAfterState();
      await this.generateCleanupReport();
      
      console.log('✅ Documentation cleanup completed successfully!');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      this.cleanupReport.errors.push({
        phase: 'general',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 1. DUPLICATE DETECTION & REMOVAL
   */
  async removeDuplicates() {
    console.log('🔍 Phase 1: Detecting and removing duplicates...');
    
    const files = await this.getAllDocFiles();
    const contentHashes = new Map();
    const similarityGroups = [];
    
    // Step 1: Find exact duplicates by hash
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        if (contentHashes.has(hash)) {
          const existing = contentHashes.get(hash);
          this.cleanupReport.duplicates.push({
            type: 'exact',
            original: existing,
            duplicate: file,
            action: 'removed'
          });
          
          fs.unlinkSync(file);
          this.cleanupReport.actions.push(`Removed exact duplicate: ${file}`);
        } else {
          contentHashes.set(hash, file);
        }
      } catch (error) {
        this.cleanupReport.errors.push({
          phase: 'duplicates',
          file,
          error: error.message
        });
      }
    }
    
    // Step 2: Find similar content (>90% match)
    const remainingFiles = files.filter(f => fs.existsSync(f));
    await this.findSimilarContent(remainingFiles);
    
    // Step 3: Remove empty directories
    await this.removeEmptyDirectories();
    
    console.log(`✅ Removed ${this.cleanupReport.duplicates.length} duplicate files`);
  }

  /**
   * Find similar content using text similarity
   */
  async findSimilarContent(files) {
    const similarities = [];
    
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        try {
          const content1 = fs.readFileSync(files[i], 'utf8');
          const content2 = fs.readFileSync(files[j], 'utf8');
          
          const similarity = this.calculateSimilarity(content1, content2);
          
          if (similarity > 0.90) {
            similarities.push({
              file1: files[i],
              file2: files[j],
              similarity,
              action: 'merge_candidate'
            });
            
            // Auto-merge if one is clearly a subset/draft
            if (await this.shouldAutoMerge(files[i], files[j], content1, content2)) {
              await this.mergeFiles(files[i], files[j], content1, content2);
            }
          }
        } catch (error) {
          this.cleanupReport.errors.push({
            phase: 'similarity',
            files: [files[i], files[j]],
            error: error.message
          });
        }
      }
    }
    
    this.cleanupReport.duplicates.push(...similarities);
  }

  /**
   * Calculate text similarity using Jaccard similarity
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Determine if files should be auto-merged
   */
  async shouldAutoMerge(file1, file2, content1, content2) {
    // Check file names for draft/temp indicators
    const isDraft1 = /draft|temp|wip|backup/i.test(path.basename(file1));
    const isDraft2 = /draft|temp|wip|backup/i.test(path.basename(file2));
    
    // Check file sizes - smaller might be subset
    const size1 = content1.length;
    const size2 = content2.length;
    
    // Check modification dates
    const stat1 = fs.statSync(file1);
    const stat2 = fs.statSync(file2);
    
    // Auto-merge criteria
    if (isDraft1 && !isDraft2) return true;
    if (isDraft2 && !isDraft1) return true;
    if (Math.abs(size1 - size2) / Math.max(size1, size2) > 0.5) return true;
    if (Math.abs(stat1.mtime - stat2.mtime) > 30 * 24 * 60 * 60 * 1000) return true; // 30 days
    
    return false;
  }

  /**
   * Merge similar files
   */
  async mergeFiles(file1, file2, content1, content2) {
    try {
      // Keep the newer/larger file, merge unique content
      const stat1 = fs.statSync(file1);
      const stat2 = fs.statSync(file2);
      
      const [keepFile, removeFile] = stat1.mtime > stat2.mtime ? [file1, file2] : [file2, file1];
      const [keepContent, removeContent] = keepFile === file1 ? [content1, content2] : [content2, content1];
      
      // Extract unique sections from the file being removed
      const uniqueSections = this.extractUniqueSections(removeContent, keepContent);
      
      if (uniqueSections.length > 0) {
        const mergedContent = keepContent + '\n\n## Merged Content\n\n' + uniqueSections.join('\n\n');
        fs.writeFileSync(keepFile, mergedContent);
      }
      
      fs.unlinkSync(removeFile);
      
      this.cleanupReport.actions.push(`Merged ${removeFile} into ${keepFile}`);
      this.cleanupReport.duplicates.push({
        type: 'merged',
        kept: keepFile,
        removed: removeFile,
        action: 'merged'
      });
      
    } catch (error) {
      this.cleanupReport.errors.push({
        phase: 'merge',
        files: [file1, file2],
        error: error.message
      });
    }
  }

  /**
   * Extract unique sections from content
   */
  extractUniqueSections(sourceContent, targetContent) {
    const sourceParagraphs = sourceContent.split(/\n\s*\n/);
    const targetParagraphs = new Set(targetContent.split(/\n\s*\n/));
    
    return sourceParagraphs.filter(para => 
      para.trim().length > 50 && !targetParagraphs.has(para)
    );
  }

  /**
   * 2. ORPHANED CONTENT CLEANUP
   */
  async cleanupOrphans() {
    console.log('🔗 Phase 2: Cleaning up orphaned content...');
    
    await this.findOrphanedDocs();
    await this.findUnusedAssets();
    await this.cleanupDeadLinks();
    
    console.log(`✅ Cleaned ${this.cleanupReport.orphans.length} orphaned items`);
  }

  /**
   * Find documents with no incoming links
   */
  async findOrphanedDocs() {
    const allDocs = await this.getAllDocFiles();
    const allContent = await this.getAllDocContent();
    const linkedFiles = new Set();
    
    // Extract all internal links
    for (const [file, content] of allContent) {
      const links = this.extractInternalLinks(content, file);
      links.forEach(link => linkedFiles.add(link));
    }
    
    // Find orphaned files
    for (const file of allDocs) {
      const relativePath = path.relative(this.docsRoot, file);
      const isLinked = linkedFiles.has(relativePath) || 
                      linkedFiles.has(file) ||
                      this.isSpecialFile(file);
      
      if (!isLinked) {
        // Check if it's older than 30 days and small
        const stat = fs.statSync(file);
        const age = Date.now() - stat.mtime.getTime();
        const size = stat.size;
        
        if (age > 30 * 24 * 60 * 60 * 1000 && size < 1000) {
          // Archive small, old orphaned files
          await this.archiveFile(file, 'orphaned');
          this.cleanupReport.orphans.push({
            type: 'orphaned_doc',
            file: relativePath,
            action: 'archived',
            reason: 'No incoming links, old and small'
          });
        } else {
          this.cleanupReport.orphans.push({
            type: 'orphaned_doc',
            file: relativePath,
            action: 'flagged',
            reason: 'No incoming links'
          });
        }
      }
    }
  }

  /**
   * Extract internal links from content
   */
  extractInternalLinks(content, sourceFile) {
    const links = [];
    const sourceDir = path.dirname(sourceFile);
    
    // Markdown links: [text](path)
    const markdownLinks = content.match(/\[([^\]]*)\]\(([^)]+)\)/g) || [];
    
    for (const link of markdownLinks) {
      const match = link.match(/\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        const linkPath = match[2];
        
        // Skip external links
        if (linkPath.startsWith('http') || linkPath.includes('://')) continue;
        
        // Resolve relative path
        const resolvedPath = path.resolve(sourceDir, linkPath);
        if (resolvedPath.startsWith(this.docsRoot)) {
          links.push(path.relative(this.docsRoot, resolvedPath));
        }
      }
    }
    
    return links;
  }

  /**
   * Check if file should never be considered orphaned
   */
  isSpecialFile(file) {
    const basename = path.basename(file).toLowerCase();
    const specialFiles = [
      'readme.md',
      'index.md',
      'changelog.md',
      'license.md',
      'contributing.md'
    ];
    
    return specialFiles.includes(basename) || 
           file.includes('auto-generated') ||
           file.includes('scripts');
  }

  /**
   * Find unused image and asset files
   */
  async findUnusedAssets() {
    const allImages = await this.getAllImageFiles();
    const allContent = await this.getAllDocContent();
    const usedAssets = new Set();
    
    // Find all asset references in documentation
    for (const [file, content] of allContent) {
      const assetRefs = this.extractAssetReferences(content);
      assetRefs.forEach(ref => usedAssets.add(ref));
    }
    
    // Check each image file
    for (const image of allImages) {
      const relativePath = path.relative(this.docsRoot, image);
      const basename = path.basename(image);
      
      const isUsed = usedAssets.has(relativePath) || 
                     usedAssets.has(basename) ||
                     usedAssets.has(`./${basename}`);
      
      if (!isUsed) {
        // Move to archive instead of deleting
        await this.archiveFile(image, 'unused-assets');
        this.cleanupReport.orphans.push({
          type: 'unused_asset',
          file: relativePath,
          action: 'archived'
        });
      }
    }
  }

  /**
   * Extract asset references from content
   */
  extractAssetReferences(content) {
    const refs = [];
    
    // Markdown images: ![alt](path)
    const imgRefs = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
    imgRefs.forEach(ref => {
      const match = ref.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) refs.push(match[2]);
    });
    
    // HTML img tags
    const htmlImgs = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/g) || [];
    htmlImgs.forEach(tag => {
      const match = tag.match(/src=["']([^"']+)["']/);
      if (match) refs.push(match[1]);
    });
    
    return refs;
  }

  /**
   * Clean up dead internal links
   */
  async cleanupDeadLinks() {
    const allContent = await this.getAllDocContent();
    
    for (const [file, content] of allContent) {
      const links = this.extractInternalLinks(content, file);
      let updatedContent = content;
      let hasChanges = false;
      
      for (const link of links) {
        const fullPath = path.resolve(this.docsRoot, link);
        
        if (!fs.existsSync(fullPath)) {
          // Remove or comment out dead links
          const linkPattern = new RegExp(`\\[([^\\]]*)\\]\\(${this.escapeRegex(link)}\\)`, 'g');
          updatedContent = updatedContent.replace(linkPattern, '~~$1~~ *(broken link)*');
          hasChanges = true;
          
          this.cleanupReport.orphans.push({
            type: 'dead_link',
            file: path.relative(this.docsRoot, file),
            link,
            action: 'marked_broken'
          });
        }
      }
      
      if (hasChanges) {
        fs.writeFileSync(file, updatedContent);
        this.cleanupReport.actions.push(`Fixed dead links in: ${path.relative(this.docsRoot, file)}`);
      }
    }
  }

  /**
   * 3. OPTIMIZATION CLEANUP
   */
  async optimizeContent() {
    console.log('⚡ Phase 3: Optimizing content...');
    
    await this.splitLargeFiles();
    await this.optimizeImages();
    await this.standardizeFormatting();
    
    console.log(`✅ Applied ${this.cleanupReport.optimizations.length} optimizations`);
  }

  /**
   * Split large documentation files
   */
  async splitLargeFiles() {
    const files = await this.getAllDocFiles();
    
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        const content = fs.readFileSync(file, 'utf8');
        
        // Split files larger than 50KB
        if (stat.size > 50 * 1024) {
          const sections = this.splitIntoSections(content);
          
          if (sections.length > 1) {
            await this.createSectionFiles(file, sections);
            this.cleanupReport.optimizations.push({
              type: 'split_large_file',
              file: path.relative(this.docsRoot, file),
              sections: sections.length,
              action: 'split'
            });
          }
        }
      } catch (error) {
        this.cleanupReport.errors.push({
          phase: 'optimization',
          file,
          error: error.message
        });
      }
    }
  }

  /**
   * Split content into logical sections
   */
  splitIntoSections(content) {
    // Split by main headers (## )
    const sections = content.split(/(?=^## )/m);
    
    return sections.filter(section => section.trim().length > 500);
  }

  /**
   * Create separate files for each section
   */
  async createSectionFiles(originalFile, sections) {
    const basename = path.basename(originalFile, path.extname(originalFile));
    const dirname = path.dirname(originalFile);
    const sectionDir = path.join(dirname, basename);
    
    // Create section directory
    if (!fs.existsSync(sectionDir)) {
      fs.mkdirSync(sectionDir, { recursive: true });
    }
    
    // Create index file
    let indexContent = `# ${basename}\n\n`;
    
    sections.forEach((section, index) => {
      const sectionTitle = this.extractSectionTitle(section);
      const sectionFile = `${index + 1}-${this.slugify(sectionTitle)}.md`;
      const sectionPath = path.join(sectionDir, sectionFile);
      
      fs.writeFileSync(sectionPath, section);
      indexContent += `- [${sectionTitle}](./${basename}/${sectionFile})\n`;
    });
    
    // Replace original file with index
    fs.writeFileSync(originalFile, indexContent);
  }

  /**
   * Extract section title from content
   */
  extractSectionTitle(content) {
    const match = content.match(/^## (.+)$/m);
    return match ? match[1].trim() : 'Section';
  }

  /**
   * Create URL-friendly slug
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Optimize image files
   */
  async optimizeImages() {
    // Note: This would require additional dependencies for actual image optimization
    // For now, we'll just report large images
    
    const images = await this.getAllImageFiles();
    
    for (const image of images) {
      try {
        const stat = fs.statSync(image);
        
        if (stat.size > 1024 * 1024) { // 1MB
          this.cleanupReport.optimizations.push({
            type: 'large_image',
            file: path.relative(this.docsRoot, image),
            size: stat.size,
            action: 'flagged_for_optimization'
          });
        }
      } catch (error) {
        this.cleanupReport.errors.push({
          phase: 'image_optimization',
          file: image,
          error: error.message
        });
      }
    }
  }

  /**
   * Standardize formatting across all docs
   */
  async standardizeFormatting() {
    const files = await this.getAllDocFiles();
    
    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let hasChanges = false;
        
        // Remove excessive whitespace
        const originalLength = content.length;
        content = content
          .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
          .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
          .replace(/^[ \t]+/gm, (match) => match.replace(/\t/g, '  ')); // Convert tabs to spaces
        
        if (content.length !== originalLength) {
          fs.writeFileSync(file, content);
          hasChanges = true;
        }
        
        if (hasChanges) {
          this.cleanupReport.optimizations.push({
            type: 'formatting',
            file: path.relative(this.docsRoot, file),
            action: 'standardized'
          });
        }
      } catch (error) {
        this.cleanupReport.errors.push({
          phase: 'formatting',
          file,
          error: error.message
        });
      }
    }
  }

  /**
   * 4. MAINTENANCE CLEANUP
   */
  async maintenanceCleanup() {
    console.log('🗂️ Phase 4: Maintenance cleanup...');
    
    await this.archiveOldFiles();
    await this.cleanupTempFiles();
    await this.moveCompletedTasks();
    
    console.log('✅ Maintenance cleanup completed');
  }

  /**
   * Archive files older than 6 months without updates
   */
  async archiveOldFiles() {
    const files = await this.getAllDocFiles();
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        
        if (stat.mtime.getTime() < sixMonthsAgo && !this.isSpecialFile(file)) {
          await this.archiveFile(file, 'old-files');
          this.cleanupReport.actions.push(`Archived old file: ${path.relative(this.docsRoot, file)}`);
        }
      } catch (error) {
        this.cleanupReport.errors.push({
          phase: 'archive_old',
          file,
          error: error.message
        });
      }
    }
  }

  /**
   * Clean up temporary and backup files
   */
  async cleanupTempFiles() {
    const allFiles = await this.getAllFiles();
    
    for (const file of allFiles) {
      const basename = path.basename(file);
      const isTemp = this.tempPatterns.some(pattern => pattern.test(basename));
      
      if (isTemp) {
        try {
          fs.unlinkSync(file);
          this.cleanupReport.actions.push(`Removed temp file: ${path.relative(this.docsRoot, file)}`);
        } catch (error) {
          this.cleanupReport.errors.push({
            phase: 'temp_cleanup',
            file,
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Move completed task files to archive
   */
  async moveCompletedTasks() {
    const files = await this.getAllDocFiles();
    const completedPatterns = [
      /complete|done|finished|closed/i,
      /✅|✓|☑/,
      /status.*complete/i
    ];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const basename = path.basename(file);
        
        const isCompleted = completedPatterns.some(pattern => 
          pattern.test(basename) || pattern.test(content.substring(0, 1000))
        );
        
        if (isCompleted) {
          await this.archiveFile(file, 'completed-tasks');
          this.cleanupReport.actions.push(`Archived completed task: ${path.relative(this.docsRoot, file)}`);
        }
      } catch (error) {
        this.cleanupReport.errors.push({
          phase: 'completed_tasks',
          file,
          error: error.message
        });
      }
    }
  }

  /**
   * 5. POST-CLEANUP VALIDATION
   */
  async validateAfterCleanup() {
    console.log('🔍 Phase 5: Post-cleanup validation...');
    
    await this.validateLinks();
    await this.checkContentIntegrity();
    
    console.log('✅ Validation completed');
  }

  /**
   * Validate all remaining links
   */
  async validateLinks() {
    const allContent = await this.getAllDocContent();
    let validLinks = 0;
    let brokenLinks = 0;
    
    for (const [file, content] of allContent) {
      const links = this.extractInternalLinks(content, file);
      
      for (const link of links) {
        const fullPath = path.resolve(this.docsRoot, link);
        
        if (fs.existsSync(fullPath)) {
          validLinks++;
        } else {
          brokenLinks++;
          this.cleanupReport.errors.push({
            phase: 'validation',
            type: 'broken_link',
            file: path.relative(this.docsRoot, file),
            link
          });
        }
      }
    }
    
    this.cleanupReport.validation = {
      validLinks,
      brokenLinks,
      linkIntegrity: validLinks / (validLinks + brokenLinks) * 100
    };
  }

  /**
   * Check content integrity
   */
  async checkContentIntegrity() {
    const files = await this.getAllDocFiles();
    let validFiles = 0;
    let invalidFiles = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Basic integrity checks
        if (content.trim().length === 0) {
          this.cleanupReport.errors.push({
            phase: 'validation',
            type: 'empty_file',
            file: path.relative(this.docsRoot, file)
          });
          invalidFiles++;
        } else {
          validFiles++;
        }
      } catch (error) {
        invalidFiles++;
        this.cleanupReport.errors.push({
          phase: 'validation',
          type: 'read_error',
          file: path.relative(this.docsRoot, file),
          error: error.message
        });
      }
    }
    
    this.cleanupReport.validation = {
      ...this.cleanupReport.validation,
      validFiles,
      invalidFiles,
      fileIntegrity: validFiles / (validFiles + invalidFiles) * 100
    };
  }

  /**
   * UTILITY METHODS
   */

  async getAllDocFiles() {
    return this.getAllFilesByExtension(this.docExtensions);
  }

  async getAllImageFiles() {
    return this.getAllFilesByExtension(this.imageExtensions);
  }

  async getAllFiles() {
    const files = [];
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (this.shouldIgnore(fullPath)) continue;
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(this.docsRoot);
    return files;
  }

  async getAllFilesByExtension(extensions) {
    const allFiles = await this.getAllFiles();
    return allFiles.filter(file => 
      extensions.includes(path.extname(file).toLowerCase())
    );
  }

  async getAllDocContent() {
    const files = await this.getAllDocFiles();
    const content = new Map();
    
    for (const file of files) {
      try {
        const fileContent = fs.readFileSync(file, 'utf8');
        content.set(file, fileContent);
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return content;
  }

  shouldIgnore(filePath) {
    const relativePath = path.relative(this.docsRoot, filePath);
    return this.ignorePatterns.some(pattern => pattern.test(relativePath));
  }

  async archiveFile(filePath, category) {
    const archiveDir = path.join(this.docsRoot, 'archive', category);
    
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    const basename = path.basename(filePath);
    const archivePath = path.join(archiveDir, basename);
    
    // Handle name conflicts
    let counter = 1;
    let finalArchivePath = archivePath;
    
    while (fs.existsSync(finalArchivePath)) {
      const ext = path.extname(basename);
      const name = path.basename(basename, ext);
      finalArchivePath = path.join(archiveDir, `${name}-${counter}${ext}`);
      counter++;
    }
    
    fs.renameSync(filePath, finalArchivePath);
  }

  async removeEmptyDirectories() {
    const removeEmptyDirs = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          removeEmptyDirs(fullPath);
          
          // Check if directory is now empty
          if (fs.readdirSync(fullPath).length === 0) {
            fs.rmdirSync(fullPath);
            this.cleanupReport.actions.push(`Removed empty directory: ${path.relative(this.docsRoot, fullPath)}`);
          }
        }
      }
    };
    
    removeEmptyDirs(this.docsRoot);
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async scanBeforeState() {
    const files = await this.getAllFiles();
    let totalSize = 0;
    
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        totalSize += stat.size;
      } catch (error) {
        // Skip files that can't be accessed
      }
    }
    
    this.cleanupReport.before = {
      files: files.length,
      size: totalSize
    };
  }

  async scanAfterState() {
    const files = await this.getAllFiles();
    let totalSize = 0;
    
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        totalSize += stat.size;
      } catch (error) {
        // Skip files that can't be accessed
      }
    }
    
    this.cleanupReport.after = {
      files: files.length,
      size: totalSize
    };
  }

  async generateCleanupReport() {
    const reportPath = path.join(this.docsRoot, 'auto-generated', 'cleanup-report.md');
    
    const report = this.formatCleanupReport();
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    console.log(`📊 Cleanup report generated: ${reportPath}`);
  }

  formatCleanupReport() {
    const sizeBefore = (this.cleanupReport.before.size / 1024 / 1024).toFixed(2);
    const sizeAfter = (this.cleanupReport.after.size / 1024 / 1024).toFixed(2);
    const sizeReduction = ((this.cleanupReport.before.size - this.cleanupReport.after.size) / this.cleanupReport.before.size * 100).toFixed(1);
    const fileReduction = ((this.cleanupReport.before.files - this.cleanupReport.after.files) / this.cleanupReport.before.files * 100).toFixed(1);
    
    let report = `# 🧹 Documentation Cleanup Report

*Generated*: ${this.cleanupReport.timestamp}

## 📊 Summary

| Metric | Before | After | Reduction |
|--------|--------|--------|-----------|
| **Files** | ${this.cleanupReport.before.files} | ${this.cleanupReport.after.files} | ${fileReduction}% |
| **Size** | ${sizeBefore} MB | ${sizeAfter} MB | ${sizeReduction}% |

## 🎯 Cleanup Results

### Duplicates Removed
- **Exact duplicates**: ${this.cleanupReport.duplicates.filter(d => d.type === 'exact').length}
- **Similar content merged**: ${this.cleanupReport.duplicates.filter(d => d.type === 'merged').length}

### Orphaned Content
- **Orphaned documents**: ${this.cleanupReport.orphans.filter(o => o.type === 'orphaned_doc').length}
- **Unused assets**: ${this.cleanupReport.orphans.filter(o => o.type === 'unused_asset').length}
- **Dead links fixed**: ${this.cleanupReport.orphans.filter(o => o.type === 'dead_link').length}

### Optimizations
- **Large files split**: ${this.cleanupReport.optimizations.filter(o => o.type === 'split_large_file').length}
- **Formatting standardized**: ${this.cleanupReport.optimizations.filter(o => o.type === 'formatting').length}
- **Large images flagged**: ${this.cleanupReport.optimizations.filter(o => o.type === 'large_image').length}

## 📋 Detailed Actions

`;

    // Add detailed actions
    this.cleanupReport.actions.forEach(action => {
      report += `- ${action}\n`;
    });

    if (this.cleanupReport.validation) {
      report += `
## ✅ Validation Results

- **Link Integrity**: ${this.cleanupReport.validation.linkIntegrity?.toFixed(1)}%
- **File Integrity**: ${this.cleanupReport.validation.fileIntegrity?.toFixed(1)}%
- **Valid Links**: ${this.cleanupReport.validation.validLinks}
- **Broken Links**: ${this.cleanupReport.validation.brokenLinks}

`;
    }

    if (this.cleanupReport.errors.length > 0) {
      report += `
## ⚠️ Errors & Warnings

`;
      this.cleanupReport.errors.forEach(error => {
        report += `- **${error.phase}**: ${error.error} (${error.file || 'general'})\n`;
      });
    }

    report += `
## 🎉 Success!

Documentation cleanup completed successfully. Your docs are now lean, clean, and optimized!

---
*This report was generated automatically by the Documentation Cleanup System*
`;

    return report;
  }
}

module.exports = DocumentationCleaner;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const cleaner = new DocumentationCleaner();
  
  const options = {
    duplicates: !args.includes('--no-duplicates'),
    orphans: !args.includes('--no-orphans'),
    optimization: !args.includes('--no-optimization'),
    maintenance: !args.includes('--no-maintenance'),
    validation: !args.includes('--no-validation')
  };
  
  cleaner.performCleanup(options);
}
