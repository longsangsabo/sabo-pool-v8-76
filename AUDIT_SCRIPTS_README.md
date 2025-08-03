# Simple Audit Scripts

This repository contains a set of simplified audit scripts for analyzing React/TypeScript codebases. The scripts are designed to work with minimal dependencies, focusing on common patterns and issues in modern web applications.

## Available Scripts

| Script | Purpose | Output |
|--------|---------|--------|
| `simple-component-consolidation.js` | Analyzes and recommends component consolidation | `tournament-card-consolidation-report.md` |
| `simple-dependency-analyzer.js` | Detects unused and outdated dependencies | `dependency-analysis-report.md` |
| `simple-performance-analyzer.js` | Identifies React performance issues | `performance-analysis-report.md` |
| `simple-security-analyzer.js` | Detects security vulnerabilities and unsafe patterns | `security-analysis-report.md` |
| `simple-test-analyzer.js` | Analyzes test coverage and quality | `test-coverage-report.md` |
| `master-audit-orchestrator.js` | Runs all analyzers and combines results | `COMPREHENSIVE_AUDIT_REPORT.md` |
| `generate-demo-reports.js` | Creates demo reports for demonstration | All report files |

## Usage

### Basic Usage

1. Make sure the scripts are executable:
   ```bash
   chmod +x scripts/*.js
   ```

2. To run a specific analyzer:
   ```bash
   node scripts/simple-performance-analyzer.js
   ```

3. To run the comprehensive audit:
   ```bash
   node scripts/master-audit-orchestrator.js
   ```

4. To generate demo reports (if your project structure isn't complete):
   ```bash
   node scripts/generate-demo-reports.js
   ```

### Adding to package.json

You can add these scripts to your package.json for easier access:

```json
"scripts": {
  "audit:components": "node scripts/simple-component-consolidation.js",
  "audit:dependencies": "node scripts/simple-dependency-analyzer.js",
  "audit:performance": "node scripts/simple-performance-analyzer.js",
  "audit:security": "node scripts/simple-security-analyzer.js",
  "audit:tests": "node scripts/simple-test-analyzer.js",
  "audit:all": "node scripts/master-audit-orchestrator.js",
  "audit:demo": "node scripts/generate-demo-reports.js"
}
```

## Requirements

- Node.js 14+
- A React/TypeScript project with a standard structure
- For dependency analysis: npm installed

## Key Features

### Component Consolidation

- Finds similar component patterns that could be unified
- Focuses on tournament card components by default
- Provides migration instructions with code examples

### Dependency Analysis

- Detects unused dependencies
- Identifies outdated packages
- Flags security vulnerabilities
- Suggests commands for updates and fixes

### Performance Analysis

- Detects large components that should be broken down
- Identifies missing memoization
- Finds inline objects and functions in JSX
- Recommends performance best practices

### Security Analysis

- Scans for hardcoded secrets and credentials
- Detects unsafe React patterns like dangerouslySetInnerHTML
- Checks for vulnerable dependencies
- Finds unsafe data handling patterns

### Test Coverage Analysis

- Maps source files to test files
- Analyzes test quality and coverage
- Recommends testing strategies by file type
- Provides prioritized next steps for improving coverage

## Customization

These scripts are designed to be lightweight and adaptable. You can modify them to suit your project's specific needs:

- Change target directories
- Add or modify detection patterns
- Adjust severity thresholds
- Customize report formats

## Limitations

- These are lightweight analyzers, not full-featured analysis tools
- They rely on pattern matching rather than AST parsing
- Some checks may produce false positives or miss edge cases
- They're designed for common React/TypeScript patterns and may need adjustments for other frameworks

## License

MIT
