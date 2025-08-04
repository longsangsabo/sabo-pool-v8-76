const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 📝 Template-based Documentation Generator
 * Generates docs from AST analysis using templates
 */
class TemplateGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.templatesPath = path.join(__dirname, 'templates');
    this.packageJson = this.loadPackageJson();
  }

  /**
   * Load package.json for version and project info
   */
  loadPackageJson() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Could not load package.json');
      return { name: 'Unknown Project', version: '1.0.0' };
    }
  }

  /**
   * Generate API Reference Documentation
   */
  generateAPIReference(astResults) {
    const { interfaces, types } = astResults;
    const timestamp = new Date().toISOString().split('T')[0];
    
    let content = `# 📚 API Reference

*Auto-generated on: ${timestamp}*
*Version: ${this.packageJson.version}*

This documentation is automatically generated from TypeScript interfaces and types in the codebase.

---

## 🎯 Overview

This API reference contains ${interfaces.length} interfaces and ${types.length} type definitions.

`;

    // Interfaces section
    if (interfaces.length > 0) {
      content += `## 📋 Interfaces\n\n`;
      
      interfaces
        .filter(iface => iface.exported) // Only exported interfaces
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(iface => {
          content += this.generateInterfaceDoc(iface);
        });
    }

    // Types section
    if (types.length > 0) {
      content += `## 🏷️ Type Definitions\n\n`;
      
      types
        .filter(type => type.exported)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(type => {
          content += this.generateTypeDoc(type);
        });
    }

    content += this.generateFooter('API Reference');
    return content;
  }

  /**
   * Generate Component Library Documentation
   */
  generateComponentLibrary(astResults) {
    const { components } = astResults;
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Group components by category
    const componentsByCategory = {};
    components.forEach(comp => {
      const category = comp.category || 'Other';
      if (!componentsByCategory[category]) {
        componentsByCategory[category] = [];
      }
      componentsByCategory[category].push(comp);
    });

    let content = `# 🧩 Component Library

*Auto-generated on: ${timestamp}*
*Version: ${this.packageJson.version}*

This documentation is automatically generated from React components in the codebase.

---

## 🎯 Overview

Total components: ${components.length}

### 📊 Components by Category
`;

    Object.entries(componentsByCategory).forEach(([category, comps]) => {
      content += `- **${category}**: ${comps.length} components\n`;
    });

    content += '\n---\n\n';

    // Generate docs for each category
    Object.entries(componentsByCategory)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, comps]) => {
        content += `## ${this.getCategoryEmoji(category)} ${category}\n\n`;
        
        comps
          .filter(comp => comp.exported)
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(comp => {
            content += this.generateComponentDoc(comp);
          });
      });

    content += this.generateFooter('Component Library');
    return content;
  }

  /**
   * Generate Function Reference Documentation
   */
  generateFunctionReference(astResults) {
    const { functions } = astResults;
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Group functions by file/module
    const functionsByModule = {};
    functions.forEach(func => {
      const module = path.dirname(func.filePath);
      if (!functionsByModule[module]) {
        functionsByModule[module] = [];
      }
      functionsByModule[module].push(func);
    });

    let content = `# ⚙️ Function Reference

*Auto-generated on: ${timestamp}*
*Version: ${this.packageJson.version}*

This documentation is automatically generated from function declarations in the codebase.

---

## 🎯 Overview

Total functions: ${functions.length}

### 📁 Functions by Module
`;

    Object.entries(functionsByModule).forEach(([module, funcs]) => {
      content += `- **${module}**: ${funcs.length} functions\n`;
    });

    content += '\n---\n\n';

    // Generate docs for each module
    Object.entries(functionsByModule)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([module, funcs]) => {
        content += `## 📁 ${module}\n\n`;
        
        funcs
          .filter(func => func.exported)
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(func => {
            content += this.generateFunctionDoc(func);
          });
      });

    content += this.generateFooter('Function Reference');
    return content;
  }

  /**
   * Generate individual interface documentation
   */
  generateInterfaceDoc(iface) {
    let doc = `### \`${iface.name}\`\n\n`;
    
    if (iface.description) {
      doc += `${iface.description}\n\n`;
    }
    
    doc += `**File**: \`${iface.filePath}\`\n\n`;
    
    if (iface.properties.length > 0) {
      doc += `#### Properties\n\n`;
      doc += `| Property | Type | Optional | Description |\n`;
      doc += `|----------|------|----------|-------------|\n`;
      
      iface.properties.forEach(prop => {
        const optional = prop.optional ? '✅' : '❌';
        const description = prop.description || '-';
        doc += `| \`${prop.name}\` | \`${prop.type}\` | ${optional} | ${description} |\n`;
      });
      
      doc += '\n';
    }
    
    doc += '---\n\n';
    return doc;
  }

  /**
   * Generate individual type documentation
   */
  generateTypeDoc(type) {
    let doc = `### \`${type.name}\`\n\n`;
    
    if (type.description) {
      doc += `${type.description}\n\n`;
    }
    
    doc += `**File**: \`${type.filePath}\`\n\n`;
    doc += `**Definition**: \`${type.definition}\`\n\n`;
    doc += '---\n\n';
    
    return doc;
  }

  /**
   * Generate individual component documentation
   */
  generateComponentDoc(comp) {
    let doc = `### \`${comp.name}\`\n\n`;
    
    if (comp.description) {
      doc += `${comp.description}\n\n`;
    }
    
    doc += `**File**: \`${comp.filePath}\`\n`;
    doc += `**Type**: ${comp.isHook ? 'Custom Hook' : 'React Component'}\n\n`;
    
    if (comp.props.length > 0) {
      doc += `#### Props\n\n`;
      doc += `| Prop | Type | Optional | Description |\n`;
      doc += `|------|------|----------|-------------|\n`;
      
      comp.props.forEach(prop => {
        const optional = prop.optional ? '✅' : '❌';
        const description = prop.description || '-';
        doc += `| \`${prop.name}\` | \`${prop.type}\` | ${optional} | ${description} |\n`;
      });
      
      doc += '\n';
    }
    
    doc += `#### Usage\n\n`;
    doc += `\`\`\`tsx\n`;
    doc += `import { ${comp.name} } from '${this.getImportPath(comp.filePath)}';\n\n`;
    
    if (comp.isHook) {
      doc += `const result = ${comp.name}();\n`;
    } else {
      doc += `<${comp.name}`;
      if (comp.props.length > 0) {
        doc += `\n`;
        comp.props.slice(0, 3).forEach(prop => {
          doc += `  ${prop.name}={${this.getExampleValue(prop.type)}}\n`;
        });
        if (comp.props.length > 3) {
          doc += `  // ... other props\n`;
        }
      }
      doc += ` />\n`;
    }
    
    doc += `\`\`\`\n\n`;
    doc += '---\n\n';
    
    return doc;
  }

  /**
   * Generate individual function documentation
   */
  generateFunctionDoc(func) {
    let doc = `### \`${func.name}\`\n\n`;
    
    if (func.description) {
      doc += `${func.description}\n\n`;
    }
    
    doc += `**File**: \`${func.filePath}\`\n`;
    doc += `**Returns**: \`${func.returnType}\`\n`;
    if (func.async) {
      doc += `**Async**: ✅\n`;
    }
    doc += '\n';
    
    if (func.parameters.length > 0) {
      doc += `#### Parameters\n\n`;
      doc += `| Parameter | Type | Optional | Description |\n`;
      doc += `|-----------|------|----------|-------------|\n`;
      
      func.parameters.forEach(param => {
        const optional = param.optional ? '✅' : '❌';
        doc += `| \`${param.name}\` | \`${param.type}\` | ${optional} | - |\n`;
      });
      
      doc += '\n';
    }
    
    doc += `#### Usage\n\n`;
    doc += `\`\`\`typescript\n`;
    doc += `import { ${func.name} } from '${this.getImportPath(func.filePath)}';\n\n`;
    
    const params = func.parameters.map(p => p.name).join(', ');
    if (func.async) {
      doc += `const result = await ${func.name}(${params});\n`;
    } else {
      doc += `const result = ${func.name}(${params});\n`;
    }
    
    doc += `\`\`\`\n\n`;
    doc += '---\n\n';
    
    return doc;
  }

  /**
   * Generate changelog entry
   */
  generateChangelogEntry(changes, timestamp) {
    const date = new Date(timestamp).toISOString().split('T')[0];
    const time = new Date(timestamp).toTimeString().split(' ')[0];
    
    let entry = `## 📝 Auto-Generated Changes - ${date} ${time}\n\n`;
    
    const changesByType = {
      add: changes.filter(c => c.event === 'add'),
      change: changes.filter(c => c.event === 'change'),
      unlink: changes.filter(c => c.event === 'unlink')
    };
    
    if (changesByType.add.length > 0) {
      entry += `### ➕ Added Files\n`;
      changesByType.add.forEach(change => {
        const relativePath = path.relative(this.projectRoot, change.filePath);
        entry += `- \`${relativePath}\`\n`;
      });
      entry += '\n';
    }
    
    if (changesByType.change.length > 0) {
      entry += `### 📝 Modified Files\n`;
      changesByType.change.forEach(change => {
        const relativePath = path.relative(this.projectRoot, change.filePath);
        entry += `- \`${relativePath}\`\n`;
      });
      entry += '\n';
    }
    
    if (changesByType.unlink.length > 0) {
      entry += `### ❌ Removed Files\n`;
      changesByType.unlink.forEach(change => {
        const relativePath = path.relative(this.projectRoot, change.filePath);
        entry += `- \`${relativePath}\`\n`;
      });
      entry += '\n';
    }
    
    return entry;
  }

  /**
   * Generate auto-generated documentation index
   */
  generateAutoDocIndex() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `# 🤖 Auto-Generated Documentation

*Generated on: ${timestamp}*
*Version: ${this.packageJson.version}*

This folder contains automatically generated documentation that stays in sync with the codebase.

## 📚 Available Documentation

### 📋 API Reference
- **[API Reference](./api-reference.md)** - TypeScript interfaces and types
- Auto-updates when interfaces change
- Includes property descriptions and types

### 🧩 Component Library
- **[Component Library](./component-library.md)** - React components documentation
- Auto-updates when components change
- Includes props and usage examples

### ⚙️ Function Reference
- **[Function Reference](./function-reference.md)** - Utility functions and methods
- Auto-updates when functions change
- Includes parameters and return types

### 📝 Change Log
- **[Auto Changelog](./auto-changelog.md)** - Automated change tracking
- Updates on every file modification
- Tracks additions, modifications, and deletions

### 📦 Version Info
- **[Version Info](./version-info.json)** - Project version and dependencies
- Updates when package.json changes
- Machine-readable format

## 🔄 How It Works

1. **File Watcher** monitors \`src/\` directory
2. **AST Parser** extracts code structure
3. **Template Generator** creates formatted docs
4. **Auto-updater** keeps everything in sync

## ⚠️ Important Notes

- **Do not manually edit** files in this folder
- All content is automatically regenerated
- Changes will be overwritten on next update
- For manual documentation, use the main \`docs/\` folder

---

**Last Updated**: ${timestamp}  
**Generator**: Automated Documentation System  
**Status**: ✅ Active
`;
  }

  /**
   * Helper methods
   */
  getCategoryEmoji(category) {
    const emojiMap = {
      'UI Components': '🎨',
      'Form Components': '📝',
      'Layout Components': '📐',
      'Components': '🧩',
      'Custom Hooks': '🪝',
      'Page Components': '📄',
      'Feature Components': '⚡',
      'Other': '📦'
    };
    return emojiMap[category] || '📦';
  }

  getImportPath(filePath) {
    // Convert file path to import path
    const withoutExtension = filePath.replace(/\.(ts|tsx|js|jsx)$/, '');
    return `@/${withoutExtension}`;
  }

  getExampleValue(type) {
    const typeMap = {
      'string': '"example"',
      'number': '42',
      'boolean': 'true',
      'Date': 'new Date()',
      'Function': '() => {}',
      'object': '{}',
      'array': '[]'
    };
    
    return typeMap[type] || '/* value */';
  }

  generateFooter(docType) {
    const timestamp = new Date().toISOString();
    return `\n---\n\n**Auto-generated**: ${timestamp}  \n**Type**: ${docType}  \n**Version**: ${this.packageJson.version}  \n**Status**: ✅ Current\n`;
  }
}

module.exports = TemplateGenerator;
