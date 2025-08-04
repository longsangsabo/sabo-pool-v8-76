const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const ASTParser = require('./ast-parser');
const TemplateGenerator = require('./template-generator');

/**
 * 👁️ File Watcher System - Zero Manual Intervention Doc Updates
 * Monitors src/ changes và tự động regenerate docs
 */
class DocWatcher {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.docsPath = path.join(this.projectRoot, 'docs');
    this.autoGenPath = path.join(this.docsPath, 'auto-generated');
    
    this.parser = new ASTParser(this.projectRoot);
    this.generator = new TemplateGenerator(this.projectRoot);
    
    this.debounceTimer = null;
    this.debounceDelay = options.debounceDelay || 2000; // 2 seconds
    
    this.isProcessing = false;
    this.queuedChanges = new Set();
    
    console.log('🚀 Doc Watcher initialized');
    console.log(`📁 Watching: ${this.srcPath}`);
    console.log(`📝 Output: ${this.autoGenPath}`);
  }

  /**
   * Start watching file system
   */
  start() {
    console.log('👁️ Starting file watcher...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.autoGenPath)) {
      fs.mkdirSync(this.autoGenPath, { recursive: true });
    }

    // Watch TypeScript/JavaScript files in src
    this.watcher = chokidar.watch([
      path.join(this.srcPath, '**/*.{ts,tsx,js,jsx}'),
      path.join(this.projectRoot, 'package.json')
    ], {
      ignored: [
        '**/node_modules/**',
        '**/*.d.ts',
        '**/dist/**',
        '**/build/**'
      ],
      persistent: true,
      ignoreInitial: false // Process existing files on start
    });

    // Event handlers
    this.watcher
      .on('add', (filePath) => this.handleFileChange('add', filePath))
      .on('change', (filePath) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      .on('ready', () => {
        console.log('✅ File watcher ready');
        this.performFullRegeneration();
      })
      .on('error', error => console.error('❌ Watcher error:', error));

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down file watcher...');
      this.stop();
      process.exit(0);
    });

    return this;
  }

  /**
   * Stop watching
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log('🛑 File watcher stopped');
    }
  }

  /**
   * Handle file system changes
   */
  handleFileChange(event, filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    
    console.log(`📝 ${event.toUpperCase()}: ${relativePath}`);
    
    // Add to queue
    this.queuedChanges.add({ event, filePath, timestamp: Date.now() });
    
    // Debounce processing
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.processQueuedChanges();
    }, this.debounceDelay);
  }

  /**
   * Process queued file changes
   */
  async processQueuedChanges() {
    if (this.isProcessing) {
      console.log('⏳ Already processing, queuing changes...');
      return;
    }

    this.isProcessing = true;
    const changes = Array.from(this.queuedChanges);
    this.queuedChanges.clear();

    try {
      console.log(`\n🔄 Processing ${changes.length} file changes...`);
      
      // Categorize changes
      const hasTypeScriptChanges = changes.some(c => 
        c.filePath.match(/\.(ts|tsx)$/) && c.filePath.includes('/src/')
      );
      
      const hasPackageChange = changes.some(c => 
        c.filePath.endsWith('package.json')
      );

      // Generate docs based on changes
      if (hasTypeScriptChanges) {
        await this.regenerateAPIDocs();
      }
      
      if (hasPackageChange) {
        await this.updateVersionInfo();
      }

      // Always update changelog for code changes
      if (hasTypeScriptChanges) {
        await this.updateChangelog(changes);
      }

      console.log('✅ Documentation update complete\n');
      
    } catch (error) {
      console.error('❌ Error processing changes:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Perform full documentation regeneration
   */
  async performFullRegeneration() {
    console.log('\n🔄 Performing full documentation regeneration...');
    
    try {
      // Parse all TypeScript files
      await this.parser.parseProject();
      await this.parser.saveResults();
      
      // Generate all documentation
      await this.regenerateAPIDocs();
      await this.regenerateComponentDocs();
      await this.regenerateFunctionDocs();
      await this.updateVersionInfo();
      await this.generateDocIndex();
      
      console.log('✅ Full regeneration complete');
    } catch (error) {
      console.error('❌ Full regeneration failed:', error);
    }
  }

  /**
   * Regenerate API documentation
   */
  async regenerateAPIDocs() {
    console.log('📚 Regenerating API documentation...');
    
    try {
      const results = await this.parser.parseProject();
      
      // Generate API reference from interfaces and types
      const apiContent = this.generator.generateAPIReference(results);
      const apiPath = path.join(this.autoGenPath, 'api-reference.md');
      fs.writeFileSync(apiPath, apiContent);
      
      console.log(`✅ API reference updated: ${path.relative(this.projectRoot, apiPath)}`);
    } catch (error) {
      console.error('❌ API doc generation failed:', error);
    }
  }

  /**
   * Regenerate component documentation
   */
  async regenerateComponentDocs() {
    console.log('🧩 Regenerating component documentation...');
    
    try {
      const results = await this.parser.parseProject();
      
      // Generate component library docs
      const componentContent = this.generator.generateComponentLibrary(results);
      const componentPath = path.join(this.autoGenPath, 'component-library.md');
      fs.writeFileSync(componentPath, componentContent);
      
      console.log(`✅ Component library updated: ${path.relative(this.projectRoot, componentPath)}`);
    } catch (error) {
      console.error('❌ Component doc generation failed:', error);
    }
  }

  /**
   * Regenerate function documentation
   */
  async regenerateFunctionDocs() {
    console.log('⚙️ Regenerating function documentation...');
    
    try {
      const results = await this.parser.parseProject();
      
      // Generate function reference
      const functionContent = this.generator.generateFunctionReference(results);
      const functionPath = path.join(this.autoGenPath, 'function-reference.md');
      fs.writeFileSync(functionPath, functionContent);
      
      console.log(`✅ Function reference updated: ${path.relative(this.projectRoot, functionPath)}`);
    } catch (error) {
      console.error('❌ Function doc generation failed:', error);
    }
  }

  /**
   * Update version information
   */
  async updateVersionInfo() {
    console.log('📦 Updating version information...');
    
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const versionInfo = {
        version: packageJson.version,
        name: packageJson.name,
        description: packageJson.description,
        lastUpdated: new Date().toISOString(),
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {})
      };
      
      const versionPath = path.join(this.autoGenPath, 'version-info.json');
      fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
      
      console.log(`✅ Version info updated: v${packageJson.version}`);
    } catch (error) {
      console.error('❌ Version update failed:', error);
    }
  }

  /**
   * Update changelog based on file changes
   */
  async updateChangelog(changes) {
    console.log('📋 Updating changelog...');
    
    try {
      const changelogPath = path.join(this.autoGenPath, 'auto-changelog.md');
      
      // Read existing changelog or create new
      let existingContent = '';
      if (fs.existsSync(changelogPath)) {
        existingContent = fs.readFileSync(changelogPath, 'utf8');
      }
      
      // Generate new entry
      const timestamp = new Date().toISOString();
      const changeEntry = this.generator.generateChangelogEntry(changes, timestamp);
      
      // Prepend new entry to existing content
      const newContent = changeEntry + '\n\n' + existingContent;
      
      fs.writeFileSync(changelogPath, newContent);
      console.log('✅ Changelog updated');
    } catch (error) {
      console.error('❌ Changelog update failed:', error);
    }
  }

  /**
   * Generate documentation index
   */
  async generateDocIndex() {
    console.log('📑 Generating documentation index...');
    
    try {
      const indexContent = this.generator.generateAutoDocIndex();
      const indexPath = path.join(this.autoGenPath, 'index.md');
      fs.writeFileSync(indexPath, indexContent);
      
      console.log('✅ Documentation index generated');
    } catch (error) {
      console.error('❌ Index generation failed:', error);
    }
  }

  /**
   * Get watcher status
   */
  getStatus() {
    return {
      isWatching: !!this.watcher,
      isProcessing: this.isProcessing,
      queuedChanges: this.queuedChanges.size,
      watchedPaths: [this.srcPath]
    };
  }
}

module.exports = DocWatcher;

// CLI usage
if (require.main === module) {
  console.log('🚀 Starting Documentation Watcher...');
  
  const watcher = new DocWatcher({
    debounceDelay: 2000 // 2 second delay
  });
  
  watcher.start();
  
  console.log('\n📝 Watching for file changes...');
  console.log('Press Ctrl+C to stop\n');
}
