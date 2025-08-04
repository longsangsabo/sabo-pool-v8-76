#!/bin/bash

# 🚀 DOC AUTOMATION SYSTEM INSTALLER
# Installs and configures the complete documentation automation system

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/docs/scripts"
DOCS_DIR="$PROJECT_ROOT/docs"

echo "🚀 Installing Documentation Automation System..."
echo "📁 Project Root: $PROJECT_ROOT"
echo "📁 Scripts Directory: $SCRIPTS_DIR"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd "$PROJECT_ROOT"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "📝 Creating package.json..."
    npm init -y
fi

# Install required dependencies
echo "📦 Installing automation dependencies..."
npm install --save-dev \
    chokidar \
    typescript \
    @types/node \
    glob \
    fs-extra \
    chalk \
    commander

# Install git-hooks
echo "🔗 Installing git hooks..."
"$SCRIPTS_DIR/git-hooks.sh" install

# Create necessary directories
echo "📁 Creating documentation directories..."
mkdir -p "$DOCS_DIR/auto-generated"
mkdir -p "$DOCS_DIR/templates"
mkdir -p "$DOCS_DIR/components"
mkdir -p "$DOCS_DIR/api"
mkdir -p "$DOCS_DIR/guides"

# Generate initial documentation
echo "📝 Generating initial documentation..."
node "$SCRIPTS_DIR/ast-parser.js" analyze > /dev/null 2>&1 || echo "⚠️  AST analysis will run after TypeScript files are found"
node "$SCRIPTS_DIR/template-generator.js" > /dev/null 2>&1 || echo "⚠️  Template generation will run after analysis data is available"

# Fix existing documentation
echo "🔧 Fixing existing documentation..."
node "$SCRIPTS_DIR/doc-fixer.js" > /dev/null 2>&1 || echo "⚠️  Doc fixing completed with warnings"

# Generate changelog from recent commits
echo "📄 Generating changelog..."
node "$SCRIPTS_DIR/update-changelog.js" > /dev/null 2>&1 || echo "⚠️  Changelog will be generated when git history is available"

# Add npm scripts to package.json
echo "📜 Adding npm scripts..."
node -e "
const fs = require('fs');
const path = require('path');
const packagePath = path.join('$PROJECT_ROOT', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (!package.scripts) package.scripts = {};

// Add documentation scripts
package.scripts['docs:watch'] = 'node docs/scripts/doc-watcher.js';
package.scripts['docs:generate'] = 'node docs/scripts/ast-parser.js analyze && node docs/scripts/template-generator.js';
package.scripts['docs:fix'] = 'node docs/scripts/doc-fixer.js';
package.scripts['docs:changelog'] = 'node docs/scripts/update-changelog.js';
package.scripts['docs:install'] = 'bash docs/scripts/install-automation.sh';
package.scripts['docs:dev'] = 'npm run docs:generate && npm run docs:watch';

fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));
console.log('✅ Added documentation scripts to package.json');
"

# Create VS Code tasks
echo "⚙️  Setting up VS Code tasks..."
mkdir -p "$PROJECT_ROOT/.vscode"
cat > "$PROJECT_ROOT/.vscode/tasks.json" << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Doc Watcher",
            "type": "shell",
            "command": "npm",
            "args": ["run", "docs:watch"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared",
                "showReuseMessage": true,
                "clear": false
            },
            "isBackground": true,
            "problemMatcher": {
                "pattern": {
                    "regexp": "^(.*):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$",
                    "file": 1,
                    "line": 2,
                    "column": 3,
                    "severity": 4,
                    "message": 5
                },
                "background": {
                    "activeOnStart": true,
                    "beginsPattern": "^🔍 Watching for file changes...",
                    "endsPattern": "^✅ Documentation watcher started"
                }
            }
        },
        {
            "label": "Generate Documentation",
            "type": "shell",
            "command": "npm",
            "args": ["run", "docs:generate"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Fix Documentation",
            "type": "shell",
            "command": "npm",
            "args": ["run", "docs:fix"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        }
    ]
}
EOF

# Create launch configuration for debugging
cat > "$PROJECT_ROOT/.vscode/launch.json" << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Doc Watcher",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/docs/scripts/doc-watcher.js",
            "console": "integratedTerminal",
            "skipFiles": ["<node_internals>/**"]
        },
        {
            "name": "Debug AST Parser",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/docs/scripts/ast-parser.js",
            "args": ["analyze"],
            "console": "integratedTerminal",
            "skipFiles": ["<node_internals>/**"]
        }
    ]
}
EOF

# Create documentation configuration
cat > "$DOCS_DIR/automation-config.json" << 'EOF'
{
  "enabled": true,
  "watchPaths": [
    "src/**/*.{ts,tsx,js,jsx}",
    "components/**/*.{ts,tsx,js,jsx}",
    "pages/**/*.{ts,tsx,js,jsx}",
    "lib/**/*.{ts,tsx,js,jsx}",
    "utils/**/*.{ts,tsx,js,jsx}"
  ],
  "outputPaths": {
    "api": "docs/auto-generated/api-reference.md",
    "components": "docs/auto-generated/component-library.md",
    "functions": "docs/auto-generated/function-reference.md",
    "changelog": "docs/auto-generated/auto-changelog.md"
  },
  "templates": {
    "api": "docs/templates/api-template.md",
    "component": "docs/templates/component-template.md",
    "function": "docs/templates/function-template.md"
  },
  "gitHooks": {
    "preCommit": true,
    "postCommit": true,
    "prePush": false
  },
  "autoFix": {
    "brokenLinks": true,
    "missingMetadata": true,
    "outdatedVersions": true,
    "duplicateHeaders": true
  }
}
EOF

echo ""
echo "✅ Documentation Automation System installed successfully!"
echo ""
echo "🎯 Available Commands:"
echo "  npm run docs:watch     - Start file watcher for real-time updates"
echo "  npm run docs:generate  - Generate documentation from code"
echo "  npm run docs:fix       - Fix existing documentation issues"
echo "  npm run docs:changelog - Generate changelog from git commits"
echo "  npm run docs:dev       - Generate docs and start watching"
echo ""
echo "🚀 VS Code Integration:"
echo "  - Press Ctrl+Shift+P → 'Tasks: Run Task' → 'Start Doc Watcher'"
echo "  - Use F5 to debug documentation scripts"
echo ""
echo "🔗 Git Hooks Installed:"
echo "  - Pre-commit: Validates documentation quality"
echo "  - Post-commit: Auto-generates changelog and updates docs"
echo ""
echo "📁 Documentation Structure:"
echo "  docs/auto-generated/   - Auto-generated documentation"
echo "  docs/templates/        - Documentation templates"
echo "  docs/scripts/          - Automation scripts"
echo ""
echo "🎉 Ready to use! The system will automatically maintain your documentation."
echo "💡 Start with: npm run docs:dev"
