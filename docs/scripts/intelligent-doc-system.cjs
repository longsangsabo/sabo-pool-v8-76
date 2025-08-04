const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🚀 PHASE 3 - INTELLIGENT DOCUMENTATION SYSTEM
 * Advanced automation with smart content generation and cross-linking
 */
class IntelligentDocSystem {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.docsRoot = path.join(projectRoot, 'docs');
    this.configPath = path.join(this.docsRoot, 'intelligent-config.json');
    
    this.config = this.loadConfig();
    this.analysisData = new Map();
    this.contentGraph = new Map();
    this.smartTemplates = new Map();
    
    // Initialize AI-like content analysis
    this.contentAnalyzer = new ContentAnalyzer();
    this.linkBuilder = new SmartLinkBuilder();
    this.templateEngine = new IntelligentTemplateEngine();
  }

  /**
   * Phase 3 Main Entry Point
   */
  async executePhase3() {
    console.log('🚀 PHASE 3: Intelligent Documentation System Starting...');
    
    try {
      await this.initializeIntelligentSystem();
      await this.performContentAnalysis();
      await this.buildKnowledgeGraph();
      await this.generateSmartDocumentation();
      await this.createCrossLinkNetwork();
      await this.implementContextualNavigation();
      await this.setupAdaptiveMaintenance();
      await this.generateIntelligenceReport();
      
      console.log('✅ PHASE 3: Intelligent Documentation System Complete!');
      
    } catch (error) {
      console.error('❌ Phase 3 failed:', error.message);
      throw error;
    }
  }

  /**
   * 1. INTELLIGENT CONTENT ANALYSIS
   */
  async performContentAnalysis() {
    console.log('🧠 Phase 3.1: Performing intelligent content analysis...');
    
    // Analyze all documentation content
    const allDocs = await this.getAllDocuments();
    
    for (const [filePath, content] of allDocs) {
      const analysis = await this.contentAnalyzer.analyzeDocument(filePath, content);
      this.analysisData.set(filePath, analysis);
    }
    
    // Analyze code-to-docs relationships
    await this.analyzeCodeDocRelationships();
    
    // Identify content gaps
    await this.identifyContentGaps();
    
    // Classify document types and purposes
    await this.classifyDocuments();
    
    console.log(`✅ Analyzed ${this.analysisData.size} documents`);
  }

  /**
   * 2. BUILD KNOWLEDGE GRAPH
   */
  async buildKnowledgeGraph() {
    console.log('🕸️ Phase 3.2: Building knowledge graph...');
    
    // Create nodes for each document and code entity
    await this.createDocumentNodes();
    await this.createCodeNodes();
    
    // Build relationships between entities
    await this.buildDocumentRelationships();
    await this.buildCodeDocRelationships();
    await this.buildTopicClusters();
    
    // Calculate importance scores
    await this.calculateImportanceScores();
    
    console.log(`✅ Built knowledge graph with ${this.contentGraph.size} nodes`);
  }

  /**
   * 3. GENERATE SMART DOCUMENTATION
   */
  async generateSmartDocumentation() {
    console.log('📝 Phase 3.3: Generating smart documentation...');
    
    // Generate contextual API documentation
    await this.generateContextualAPIDocs();
    
    // Create intelligent tutorials
    await this.generateIntelligentTutorials();
    
    // Build adaptive user guides
    await this.generateAdaptiveGuides();
    
    // Create smart FAQs
    await this.generateSmartFAQs();
    
    // Generate troubleshooting guides
    await this.generateTroubleshootingGuides();
    
    console.log('✅ Smart documentation generated');
  }

  /**
   * 4. CREATE CROSS-LINK NETWORK
   */
  async createCrossLinkNetwork() {
    console.log('🔗 Phase 3.4: Creating intelligent cross-link network...');
    
    // Build semantic relationships
    await this.buildSemanticLinks();
    
    // Create contextual suggestions
    await this.createContextualSuggestions();
    
    // Generate "See Also" sections
    await this.generateSeeAlsoSections();
    
    // Build breadcrumb navigation
    await this.buildBreadcrumbNavigation();
    
    console.log('✅ Cross-link network created');
  }

  /**
   * 5. IMPLEMENT CONTEXTUAL NAVIGATION
   */
  async implementContextualNavigation() {
    console.log('🧭 Phase 3.5: Implementing contextual navigation...');
    
    // Generate dynamic table of contents
    await this.generateDynamicTOC();
    
    // Create smart search index
    await this.createSmartSearchIndex();
    
    // Build topic-based navigation
    await this.buildTopicNavigation();
    
    // Generate user journey maps
    await this.generateUserJourneyMaps();
    
    console.log('✅ Contextual navigation implemented');
  }

  /**
   * 6. SETUP ADAPTIVE MAINTENANCE
   */
  async setupAdaptiveMaintenance() {
    console.log('🔧 Phase 3.6: Setting up adaptive maintenance...');
    
    // Monitor content freshness
    await this.setupContentFreshnessMonitoring();
    
    // Detect documentation drift
    await this.setupDriftDetection();
    
    // Auto-update related documents
    await this.setupRelatedDocUpdates();
    
    // Monitor user interaction patterns
    await this.setupUsageAnalytics();
    
    console.log('✅ Adaptive maintenance configured');
  }

  /**
   * CONTENT ANALYZER CLASS
   */
}

class ContentAnalyzer {
  constructor() {
    this.patterns = {
      headings: /^#{1,6}\s+(.+)$/gm,
      codeBlocks: /```[\s\S]*?```/g,
      links: /\[([^\]]*)\]\(([^)]+)\)/g,
      images: /!\[([^\]]*)\]\(([^)]+)\)/g,
      lists: /^[\s]*[-*+]\s+(.+)$/gm,
      tables: /\|.*\|/g,
      emphasis: /\*\*([^*]+)\*\*|\*([^*]+)\*/g
    };
    
    this.topics = new Map();
    this.complexity = new Map();
    this.readability = new Map();
  }

  async analyzeDocument(filePath, content) {
    const analysis = {
      filePath,
      metadata: this.extractMetadata(content),
      structure: this.analyzeStructure(content),
      topics: this.extractTopics(content),
      complexity: this.calculateComplexity(content),
      readability: this.calculateReadability(content),
      codeReferences: this.extractCodeReferences(content),
      relationships: this.identifyRelationships(content),
      quality: this.assessQuality(content),
      gaps: this.identifyGaps(content)
    };
    
    return analysis;
  }

  extractMetadata(content) {
    const lines = content.split('\n');
    const metadata = {
      title: this.extractTitle(content),
      description: this.extractDescription(content),
      tags: this.extractTags(content),
      lastModified: new Date(),
      wordCount: content.split(/\s+/).length,
      readingTime: Math.ceil(content.split(/\s+/).length / 200) // 200 words per minute
    };
    
    return metadata;
  }

  extractTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : 'Untitled';
  }

  extractDescription(content) {
    // Look for description in first paragraph after title
    const lines = content.split('\n');
    let descStart = 0;
    
    // Skip title and empty lines
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^#\s+/)) {
        descStart = i + 1;
        break;
      }
    }
    
    // Find first non-empty line for description
    for (let i = descStart; i < lines.length; i++) {
      if (lines[i].trim() && !lines[i].startsWith('#')) {
        return lines[i].trim().substring(0, 200);
      }
    }
    
    return '';
  }

  extractTags(content) {
    const tags = new Set();
    
    // Extract from headings
    const headings = content.match(this.patterns.headings);
    if (headings) {
      headings.forEach(heading => {
        const words = heading.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) tags.add(word);
        });
      });
    }
    
    // Extract from code blocks
    const codeBlocks = content.match(this.patterns.codeBlocks);
    if (codeBlocks) {
      codeBlocks.forEach(block => {
        const lang = block.match(/```(\w+)/);
        if (lang) tags.add(lang[1]);
      });
    }
    
    return Array.from(tags).slice(0, 10); // Limit to 10 most relevant tags
  }

  analyzeStructure(content) {
    const structure = {
      headingLevels: [],
      sections: [],
      codeBlocks: 0,
      images: 0,
      links: 0,
      tables: 0,
      lists: 0
    };
    
    // Analyze headings
    const headings = content.match(this.patterns.headings);
    if (headings) {
      headings.forEach(heading => {
        const level = (heading.match(/^#+/) || [''])[0].length;
        const text = heading.replace(/^#+\s*/, '');
        
        structure.headingLevels.push(level);
        structure.sections.push({ level, text });
      });
    }
    
    // Count elements
    structure.codeBlocks = (content.match(this.patterns.codeBlocks) || []).length;
    structure.images = (content.match(this.patterns.images) || []).length;
    structure.links = (content.match(this.patterns.links) || []).length;
    structure.tables = (content.match(this.patterns.tables) || []).length;
    structure.lists = (content.match(this.patterns.lists) || []).length;
    
    return structure;
  }

  extractTopics(content) {
    const topics = new Map();
    
    // Technical topics
    const techTerms = [
      'api', 'function', 'class', 'interface', 'component', 'service',
      'database', 'auth', 'authentication', 'authorization', 'security',
      'deployment', 'testing', 'configuration', 'installation', 'setup',
      'tutorial', 'guide', 'documentation', 'example', 'usage'
    ];
    
    const contentLower = content.toLowerCase();
    
    techTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = contentLower.match(regex);
      if (matches) {
        topics.set(term, matches.length);
      }
    });
    
    return topics;
  }

  calculateComplexity(content) {
    let score = 0;
    
    // Word complexity
    const words = content.split(/\s+/);
    const longWords = words.filter(word => word.length > 10).length;
    score += longWords * 0.1;
    
    // Sentence complexity
    const sentences = content.split(/[.!?]+/);
    const avgWordsPerSentence = words.length / sentences.length;
    if (avgWordsPerSentence > 20) score += 0.2;
    
    // Technical density
    const codeBlocks = (content.match(this.patterns.codeBlocks) || []).length;
    score += codeBlocks * 0.3;
    
    // Structure complexity
    const headings = (content.match(this.patterns.headings) || []).length;
    const depth = Math.max(...(content.match(/^#+/gm) || ['']).map(h => h.length));
    if (depth > 4) score += 0.2;
    
    return Math.min(score, 1); // Cap at 1.0
  }

  calculateReadability(content) {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const syllables = this.countSyllables(content);
    
    // Flesch Reading Ease Score
    const flesch = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    
    return {
      fleschScore: Math.max(0, Math.min(100, flesch)),
      level: this.getReadingLevel(flesch),
      avgWordsPerSentence: words / sentences,
      avgSyllablesPerWord: syllables / words
    };
  }

  countSyllables(text) {
    // Simple syllable counting approximation
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]{2,}/g, 'a')
      .replace(/[^aeiou]/g, '')
      .length || 1;
  }

  getReadingLevel(fleschScore) {
    if (fleschScore >= 90) return 'Very Easy';
    if (fleschScore >= 80) return 'Easy';
    if (fleschScore >= 70) return 'Fairly Easy';
    if (fleschScore >= 60) return 'Standard';
    if (fleschScore >= 50) return 'Fairly Difficult';
    if (fleschScore >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  extractCodeReferences(content) {
    const references = {
      functions: [],
      classes: [],
      interfaces: [],
      components: [],
      files: []
    };
    
    // Extract from code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    codeBlocks.forEach(block => {
      // Function references
      const functions = block.match(/function\s+(\w+)/g) || [];
      functions.forEach(fn => {
        const name = fn.replace('function ', '');
        if (!references.functions.includes(name)) {
          references.functions.push(name);
        }
      });
      
      // Class references
      const classes = block.match(/class\s+(\w+)/g) || [];
      classes.forEach(cls => {
        const name = cls.replace('class ', '');
        if (!references.classes.includes(name)) {
          references.classes.push(name);
        }
      });
    });
    
    // Extract from inline code
    const inlineCode = content.match(/`([^`]+)`/g) || [];
    inlineCode.forEach(code => {
      const clean = code.replace(/`/g, '');
      if (clean.includes('.')) {
        references.files.push(clean);
      }
    });
    
    return references;
  }

  identifyRelationships(content) {
    const relationships = [];
    
    // Extract explicit links
    const links = content.match(this.patterns.links) || [];
    links.forEach(link => {
      const match = link.match(/\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        relationships.push({
          type: 'explicit_link',
          target: match[2],
          context: match[1]
        });
      }
    });
    
    // Identify implicit relationships through shared topics
    const topics = this.extractTopics(content);
    topics.forEach((count, topic) => {
      if (count > 2) { // Significant topic presence
        relationships.push({
          type: 'topic_relationship',
          topic,
          strength: count
        });
      }
    });
    
    return relationships;
  }

  assessQuality(content) {
    const quality = {
      score: 0,
      issues: [],
      suggestions: []
    };
    
    const structure = this.analyzeStructure(content);
    const metadata = this.extractMetadata(content);
    
    // Check for title
    if (metadata.title === 'Untitled') {
      quality.issues.push('Missing clear title');
      quality.score -= 0.2;
    } else {
      quality.score += 0.1;
    }
    
    // Check for description
    if (!metadata.description) {
      quality.issues.push('Missing description');
      quality.score -= 0.1;
    } else {
      quality.score += 0.1;
    }
    
    // Check structure
    if (structure.sections.length === 0) {
      quality.issues.push('No clear structure (no headings)');
      quality.score -= 0.2;
    } else {
      quality.score += 0.1;
    }
    
    // Check content length
    if (metadata.wordCount < 50) {
      quality.issues.push('Very short content');
      quality.score -= 0.1;
    } else if (metadata.wordCount > 2000) {
      quality.suggestions.push('Consider splitting long content');
    }
    
    // Check for examples
    if (structure.codeBlocks > 0) {
      quality.score += 0.2;
    } else {
      quality.suggestions.push('Consider adding code examples');
    }
    
    quality.score = Math.max(0, Math.min(1, quality.score + 0.5)); // Base score of 0.5
    
    return quality;
  }

  identifyGaps(content) {
    const gaps = [];
    const structure = this.analyzeStructure(content);
    const metadata = this.extractMetadata(content);
    
    // Missing examples
    if (structure.codeBlocks === 0 && content.includes('function') || content.includes('API')) {
      gaps.push({
        type: 'missing_examples',
        description: 'Document mentions code but lacks examples'
      });
    }
    
    // Missing getting started
    if (metadata.title.toLowerCase().includes('api') && !content.toLowerCase().includes('getting started')) {
      gaps.push({
        type: 'missing_getting_started',
        description: 'API documentation should include getting started section'
      });
    }
    
    // Missing troubleshooting
    if (metadata.wordCount > 500 && !content.toLowerCase().includes('troubleshoot')) {
      gaps.push({
        type: 'missing_troubleshooting',
        description: 'Long documentation should include troubleshooting'
      });
    }
    
    return gaps;
  }
}

/**
 * SMART LINK BUILDER CLASS
 */
class SmartLinkBuilder {
  constructor() {
    this.semanticGraph = new Map();
    this.linkStrengths = new Map();
  }

  async buildSemanticLinks(analysisData) {
    console.log('🔗 Building semantic link network...');
    
    const documents = Array.from(analysisData.entries());
    
    // Build topic similarity matrix
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const [path1, analysis1] = documents[i];
        const [path2, analysis2] = documents[j];
        
        const similarity = this.calculateTopicSimilarity(analysis1.topics, analysis2.topics);
        
        if (similarity > 0.3) { // Significant similarity threshold
          this.addSemanticLink(path1, path2, similarity);
        }
      }
    }
    
    // Build code-doc relationships
    documents.forEach(([path, analysis]) => {
      analysis.codeReferences.functions.forEach(fn => {
        this.addCodeDocLink(path, 'function', fn);
      });
      
      analysis.codeReferences.classes.forEach(cls => {
        this.addCodeDocLink(path, 'class', cls);
      });
    });
  }

  calculateTopicSimilarity(topics1, topics2) {
    const allTopics = new Set([...topics1.keys(), ...topics2.keys()]);
    let similarity = 0;
    let totalWeight = 0;
    
    allTopics.forEach(topic => {
      const weight1 = topics1.get(topic) || 0;
      const weight2 = topics2.get(topic) || 0;
      
      if (weight1 > 0 && weight2 > 0) {
        similarity += Math.min(weight1, weight2);
      }
      totalWeight += Math.max(weight1, weight2);
    });
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  addSemanticLink(path1, path2, strength) {
    if (!this.semanticGraph.has(path1)) {
      this.semanticGraph.set(path1, new Map());
    }
    if (!this.semanticGraph.has(path2)) {
      this.semanticGraph.set(path2, new Map());
    }
    
    this.semanticGraph.get(path1).set(path2, strength);
    this.semanticGraph.get(path2).set(path1, strength);
  }

  addCodeDocLink(docPath, codeType, codeName) {
    const linkKey = `${docPath}->${codeType}:${codeName}`;
    this.linkStrengths.set(linkKey, 0.8); // High strength for code references
  }

  generateSuggestedLinks(filePath, analysis) {
    const suggestions = [];
    
    // Get semantic links
    const semanticLinks = this.semanticGraph.get(filePath) || new Map();
    
    // Sort by strength and take top 5
    const topLinks = Array.from(semanticLinks.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    topLinks.forEach(([targetPath, strength]) => {
      suggestions.push({
        type: 'semantic',
        target: targetPath,
        strength,
        reason: `Related content (${Math.round(strength * 100)}% similarity)`
      });
    });
    
    return suggestions;
  }
}

/**
 * INTELLIGENT TEMPLATE ENGINE CLASS
 */
class IntelligentTemplateEngine {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // API Documentation Template
    this.templates.set('api', {
      structure: [
        '# {{title}}',
        '',
        '{{description}}',
        '',
        '## Quick Start',
        '{{quickStart}}',
        '',
        '## API Reference',
        '{{apiReference}}',
        '',
        '## Examples',
        '{{examples}}',
        '',
        '## Error Handling',
        '{{errorHandling}}',
        '',
        '## Related',
        '{{relatedLinks}}'
      ],
      variables: ['title', 'description', 'quickStart', 'apiReference', 'examples', 'errorHandling', 'relatedLinks']
    });
    
    // Tutorial Template
    this.templates.set('tutorial', {
      structure: [
        '# {{title}}',
        '',
        '{{description}}',
        '',
        '## Prerequisites',
        '{{prerequisites}}',
        '',
        '## Step-by-Step Guide',
        '{{steps}}',
        '',
        '## Troubleshooting',
        '{{troubleshooting}}',
        '',
        '## Next Steps',
        '{{nextSteps}}'
      ],
      variables: ['title', 'description', 'prerequisites', 'steps', 'troubleshooting', 'nextSteps']
    });
    
    // Component Documentation Template
    this.templates.set('component', {
      structure: [
        '# {{componentName}}',
        '',
        '{{description}}',
        '',
        '## Props',
        '{{props}}',
        '',
        '## Usage',
        '{{usage}}',
        '',
        '## Examples',
        '{{examples}}',
        '',
        '## Styling',
        '{{styling}}',
        '',
        '## Related Components',
        '{{relatedComponents}}'
      ],
      variables: ['componentName', 'description', 'props', 'usage', 'examples', 'styling', 'relatedComponents']
    });
  }

  generateSmartContent(templateType, data, context = {}) {
    const template = this.templates.get(templateType);
    if (!template) {
      throw new Error(`Template '${templateType}' not found`);
    }
    
    let content = template.structure.join('\n');
    
    // Replace variables with intelligent content
    template.variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      const value = this.generateVariableContent(variable, data, context);
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return content;
  }

  generateVariableContent(variable, data, context) {
    switch (variable) {
      case 'title':
        return data.title || 'Untitled';
        
      case 'description':
        return data.description || this.generateDescription(data, context);
        
      case 'quickStart':
        return this.generateQuickStart(data, context);
        
      case 'examples':
        return this.generateExamples(data, context);
        
      case 'relatedLinks':
        return this.generateRelatedLinks(data, context);
        
      case 'troubleshooting':
        return this.generateTroubleshooting(data, context);
        
      default:
        return `*${variable} content will be generated here*`;
    }
  }

  generateDescription(data, context) {
    if (data.type === 'function') {
      return `This function ${data.name} ${data.purpose || 'performs a specific operation'}.`;
    }
    if (data.type === 'component') {
      return `The ${data.name} component ${data.purpose || 'provides functionality for the application'}.`;
    }
    return 'This documentation provides comprehensive information about the topic.';
  }

  generateQuickStart(data, context) {
    let quickStart = '```bash\n';
    
    if (data.type === 'api') {
      quickStart += '# Install dependencies\nnpm install\n\n';
      quickStart += '# Basic usage\nconst api = new API();\n';
      quickStart += 'const result = await api.method();\n';
    } else if (data.type === 'component') {
      quickStart += 'import { ' + data.name + ' } from "./components";\n\n';
      quickStart += 'function App() {\n';
      quickStart += '  return <' + data.name + ' />;\n';
      quickStart += '}\n';
    }
    
    quickStart += '```';
    return quickStart;
  }

  generateExamples(data, context) {
    const examples = [];
    
    if (data.functions && data.functions.length > 0) {
      data.functions.forEach(fn => {
        examples.push(`### ${fn.name}`);
        examples.push('```typescript');
        examples.push(`${fn.signature || `function ${fn.name}() {}`}`);
        examples.push('```');
        examples.push('');
      });
    } else {
      examples.push('### Basic Example');
      examples.push('```typescript');
      examples.push('// Example code will be added here');
      examples.push('```');
    }
    
    return examples.join('\n');
  }

  generateRelatedLinks(data, context) {
    const links = [];
    
    if (context.relatedDocs && context.relatedDocs.length > 0) {
      context.relatedDocs.forEach(doc => {
        links.push(`- [${doc.title}](${doc.path})`);
      });
    } else {
      links.push('- Related documentation links will be added automatically');
    }
    
    return links.join('\n');
  }

  generateTroubleshooting(data, context) {
    const troubleshooting = [];
    
    troubleshooting.push('### Common Issues');
    troubleshooting.push('');
    
    if (data.type === 'api') {
      troubleshooting.push('**Issue**: API returns 404 error');
      troubleshooting.push('**Solution**: Check the endpoint URL and ensure the service is running.');
      troubleshooting.push('');
      troubleshooting.push('**Issue**: Authentication failed');
      troubleshooting.push('**Solution**: Verify your API key and permissions.');
    } else {
      troubleshooting.push('**Issue**: Feature not working as expected');
      troubleshooting.push('**Solution**: Check the console for error messages and verify the setup.');
    }
    
    return troubleshooting.join('\n');
  }
}

module.exports = IntelligentDocSystem;

// CLI usage
if (require.main === module) {
  const system = new IntelligentDocSystem();
  system.executePhase3().catch(console.error);
}
