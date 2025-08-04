const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const glob = require('glob');

/**
 * 🤖 AST Parser & Documentation Extractor
 * Extracts TypeScript interfaces, functions, and React components for auto-doc generation
 */
class ASTParser {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
    this.results = {
      interfaces: [],
      functions: [],
      components: [],
      types: [],
      constants: []
    };
  }

  /**
   * Parse all TypeScript files in src directory
   */
  async parseProject() {
    console.log('🔍 Scanning TypeScript files...');
    
    const pattern = path.join(this.srcPath, '**/*.{ts,tsx}').replace(/\\/g, '/');
    const files = glob.sync(pattern, { ignore: ['**/*.d.ts', '**/node_modules/**'] });
    
    console.log(`Found ${files.length} TypeScript files`);

    for (const filePath of files) {
      await this.parseFile(filePath);
    }

    return this.results;
  }

  /**
   * Parse individual TypeScript file
   */
  async parseFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const relativePath = path.relative(this.srcPath, filePath);
      
      this.visitNode(sourceFile, relativePath, content);
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
    }
  }

  /**
   * Visit AST nodes recursively
   */
  visitNode(node, filePath, content) {
    switch (node.kind) {
      case ts.SyntaxKind.InterfaceDeclaration:
        this.extractInterface(node, filePath, content);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        this.extractFunction(node, filePath, content);
        break;
      case ts.SyntaxKind.TypeAliasDeclaration:
        this.extractType(node, filePath, content);
        break;
      case ts.SyntaxKind.VariableStatement:
        this.extractConstants(node, filePath, content);
        break;
    }

    // Check for React components
    if (this.isReactComponent(node, content)) {
      this.extractComponent(node, filePath, content);
    }

    ts.forEachChild(node, child => this.visitNode(child, filePath, content));
  }

  /**
   * Extract interface definitions
   */
  extractInterface(node, filePath, content) {
    const name = node.name?.text;
    if (!name) return;

    const jsDoc = this.extractJSDoc(node, content);
    const properties = [];

    node.members?.forEach(member => {
      if (ts.isPropertySignature(member)) {
        const propName = member.name?.getText();
        const propType = member.type?.getText() || 'any';
        const optional = !!member.questionToken;
        const propDoc = this.extractJSDoc(member, content);

        properties.push({
          name: propName,
          type: propType,
          optional,
          description: propDoc.description
        });
      }
    });

    this.results.interfaces.push({
      name,
      filePath,
      description: jsDoc.description,
      properties,
      exported: this.isExported(node),
      line: this.getLineNumber(node, content)
    });
  }

  /**
   * Extract function declarations
   */
  extractFunction(node, filePath, content) {
    const name = node.name?.text;
    if (!name) return;

    const jsDoc = this.extractJSDoc(node, content);
    const parameters = [];
    const returnType = node.type?.getText() || 'void';

    node.parameters?.forEach(param => {
      const paramName = param.name?.getText();
      const paramType = param.type?.getText() || 'any';
      const optional = !!param.questionToken;

      parameters.push({
        name: paramName,
        type: paramType,
        optional
      });
    });

    this.results.functions.push({
      name,
      filePath,
      description: jsDoc.description,
      parameters,
      returnType,
      exported: this.isExported(node),
      async: this.isAsync(node),
      line: this.getLineNumber(node, content),
      tags: jsDoc.tags
    });
  }

  /**
   * Extract React components
   */
  extractComponent(node, filePath, content) {
    const name = this.getComponentName(node);
    if (!name) return;

    const jsDoc = this.extractJSDoc(node, content);
    const props = this.extractComponentProps(node, content);

    this.results.components.push({
      name,
      filePath,
      description: jsDoc.description,
      props,
      exported: this.isExported(node),
      line: this.getLineNumber(node, content),
      isHook: name.startsWith('use'),
      category: this.categorizeComponent(filePath)
    });
  }

  /**
   * Extract type aliases
   */
  extractType(node, filePath, content) {
    const name = node.name?.text;
    if (!name) return;

    const jsDoc = this.extractJSDoc(node, content);
    const typeDefinition = node.type?.getText() || 'unknown';

    this.results.types.push({
      name,
      filePath,
      description: jsDoc.description,
      definition: typeDefinition,
      exported: this.isExported(node),
      line: this.getLineNumber(node, content)
    });
  }

  /**
   * Extract constants and enums
   */
  extractConstants(node, filePath, content) {
    node.declarationList?.declarations?.forEach(declaration => {
      const name = declaration.name?.getText();
      if (!name) return;

      const jsDoc = this.extractJSDoc(node, content);
      const value = declaration.initializer?.getText();
      const type = declaration.type?.getText();

      this.results.constants.push({
        name,
        filePath,
        description: jsDoc.description,
        value,
        type,
        exported: this.isExported(node),
        line: this.getLineNumber(node, content)
      });
    });
  }

  /**
   * Check if node is a React component
   */
  isReactComponent(node, content) {
    // Function component
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
      const name = this.getComponentName(node);
      return name && /^[A-Z]/.test(name) && this.hasJSXReturn(node, content);
    }

    // Variable component (const Component = () => {})
    if (ts.isVariableDeclaration(node)) {
      const name = node.name?.getText();
      return name && /^[A-Z]/.test(name) && this.hasJSXReturn(node, content);
    }

    return false;
  }

  /**
   * Extract JSDoc comments
   */
  extractJSDoc(node, content) {
    const jsDoc = { description: '', tags: {} };
    
    if (node.jsDoc) {
      const comment = node.jsDoc[0];
      if (comment.comment) {
        jsDoc.description = comment.comment;
      }
      
      comment.tags?.forEach(tag => {
        const tagName = tag.tagName?.text;
        const tagText = tag.comment || '';
        jsDoc.tags[tagName] = tagText;
      });
    }

    return jsDoc;
  }

  /**
   * Helper methods
   */
  isExported(node) {
    return node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
  }

  isAsync(node) {
    return node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword);
  }

  getLineNumber(node, content) {
    const sourceFile = ts.createSourceFile('temp.ts', content, ts.ScriptTarget.Latest);
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return line + 1;
  }

  getComponentName(node) {
    if (ts.isFunctionDeclaration(node)) {
      return node.name?.text;
    }
    if (ts.isVariableDeclaration(node)) {
      return node.name?.getText();
    }
    return null;
  }

  hasJSXReturn(node, content) {
    const nodeText = node.getText();
    return nodeText.includes('jsx') || nodeText.includes('tsx') || nodeText.includes('<');
  }

  extractComponentProps(node, content) {
    const props = [];
    
    // Extract from function parameters
    if (node.parameters?.[0]) {
      const propsParam = node.parameters[0];
      if (propsParam.type && ts.isTypeLiteralNode(propsParam.type)) {
        propsParam.type.members.forEach(member => {
          if (ts.isPropertySignature(member)) {
            const name = member.name?.getText();
            const type = member.type?.getText() || 'any';
            const optional = !!member.questionToken;
            const description = this.extractJSDoc(member, content).description;

            props.push({ name, type, optional, description });
          }
        });
      }
    }

    return props;
  }

  categorizeComponent(filePath) {
    const pathSegments = filePath.split('/');
    
    if (pathSegments.includes('components')) {
      if (pathSegments.includes('ui')) return 'UI Components';
      if (pathSegments.includes('forms')) return 'Form Components';
      if (pathSegments.includes('layout')) return 'Layout Components';
      return 'Components';
    }
    
    if (pathSegments.includes('hooks')) return 'Custom Hooks';
    if (pathSegments.includes('pages')) return 'Page Components';
    if (pathSegments.includes('features')) return 'Feature Components';
    
    return 'Other';
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    const summary = {
      totalFiles: new Set([
        ...this.results.interfaces.map(i => i.filePath),
        ...this.results.functions.map(f => f.filePath),
        ...this.results.components.map(c => c.filePath),
        ...this.results.types.map(t => t.filePath),
        ...this.results.constants.map(c => c.filePath)
      ]).size,
      interfaces: this.results.interfaces.length,
      functions: this.results.functions.length,
      components: this.results.components.length,
      types: this.results.types.length,
      constants: this.results.constants.length,
      componentsByCategory: {}
    };

    // Group components by category
    this.results.components.forEach(comp => {
      const category = comp.category;
      summary.componentsByCategory[category] = (summary.componentsByCategory[category] || 0) + 1;
    });

    return summary;
  }

  /**
   * Save results to JSON for other scripts
   */
  async saveResults(outputPath = './docs/auto-generated/ast-analysis.json') {
    const results = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      data: this.results
    };

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`✅ AST analysis saved to: ${outputPath}`);
    
    return results;
  }
}

module.exports = ASTParser;

// CLI usage
if (require.main === module) {
  (async () => {
    console.log('🚀 Starting AST Parser...');
    
    const parser = new ASTParser();
    await parser.parseProject();
    
    const summary = parser.generateSummary();
    console.log('\n📊 Summary:');
    console.log(`Files analyzed: ${summary.totalFiles}`);
    console.log(`Interfaces: ${summary.interfaces}`);
    console.log(`Functions: ${summary.functions}`);
    console.log(`Components: ${summary.components}`);
    console.log(`Types: ${summary.types}`);
    console.log(`Constants: ${summary.constants}`);
    
    await parser.saveResults();
    console.log('\n✅ AST parsing complete!');
  })();
}
