/**
 * Validation Script cho Relationship Consistency
 * Tự động kiểm tra và báo cáo các vấn đề về foreign key relationships
 */

import {
  RELATIONSHIP_MAPPINGS,
  validateRelationships,
} from './relationshipMapper';

export interface ValidationResult {
  file: string;
  issues: Array<{
    line: number;
    issue: string;
    suggestion: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export interface ValidationReport {
  totalFiles: number;
  filesWithIssues: number;
  totalIssues: number;
  results: ValidationResult[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Patterns phổ biến cần kiểm tra
 */
const VALIDATION_PATTERNS = [
  {
    pattern: /profiles!challenges_\w+_fkey/g,
    severity: 'error' as const,
    message: 'Deprecated foreign key format detected',
    suggestion: 'Use simplified format: profiles!column_name',
  },
  {
    pattern: /user_profiles!/g,
    severity: 'error' as const,
    message: 'Incorrect table reference',
    suggestion: 'Use "profiles!" instead of "user_profiles!"',
  },
  {
    pattern: /clubs!/g,
    severity: 'warning' as const,
    message: 'Deprecated table reference',
    suggestion: 'Use "club_profiles!" instead of "clubs!"',
  },
  {
    pattern: /\.select\(\s*['"`][\s\S]*?['"`]\s*\)/g,
    severity: 'info' as const,
    message: 'Complex select query detected',
    suggestion: 'Consider using buildSelectWithRelationships() utility',
  },
];

/**
 * Validate một file TypeScript/JavaScript
 */
export function validateFile(
  filePath: string,
  content: string
): ValidationResult {
  const issues: ValidationResult['issues'] = [];
  const lines = content.split('\n');

  // Kiểm tra từng pattern
  VALIDATION_PATTERNS.forEach(({ pattern, severity, message, suggestion }) => {
    const globalPattern = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = globalPattern.exec(content)) !== null) {
      // Tìm line number của match
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      issues.push({
        line: lineNumber,
        issue: message,
        suggestion,
        severity,
      });
    }
  });

  // Validate relationships using existing function
  const relationshipIssues = validateRelationships(content);
  relationshipIssues.forEach(issue => {
    issues.push({
      ...issue,
      severity: 'error',
    });
  });

  return {
    file: filePath,
    issues,
  };
}

/**
 * Batch validate nhiều files
 */
export function validateProject(
  files: Array<{ path: string; content: string }>
): ValidationReport {
  const results: ValidationResult[] = [];
  let totalIssues = 0;
  let errors = 0;
  let warnings = 0;
  let info = 0;

  files.forEach(file => {
    // Chỉ validate các file TypeScript/JavaScript/JSX/TSX
    if (!/\.(ts|tsx|js|jsx)$/.test(file.path)) {
      return;
    }

    const result = validateFile(file.path, file.content);

    if (result.issues.length > 0) {
      results.push(result);
      totalIssues += result.issues.length;

      result.issues.forEach(issue => {
        switch (issue.severity) {
          case 'error':
            errors++;
            break;
          case 'warning':
            warnings++;
            break;
          case 'info':
            info++;
            break;
        }
      });
    }
  });

  return {
    totalFiles: files.length,
    filesWithIssues: results.length,
    totalIssues,
    results,
    summary: { errors, warnings, info },
  };
}

/**
 * Generate báo cáo validation dạng text
 */
export function generateReport(report: ValidationReport): string {
  let output = '\n=== RELATIONSHIP VALIDATION REPORT ===\n\n';

  output += `📊 Summary:\n`;
  output += `  Total files scanned: ${report.totalFiles}\n`;
  output += `  Files with issues: ${report.filesWithIssues}\n`;
  output += `  Total issues: ${report.totalIssues}\n`;
  output += `  Errors: ${report.summary.errors}\n`;
  output += `  Warnings: ${report.summary.warnings}\n`;
  output += `  Info: ${report.summary.info}\n\n`;

  if (report.results.length === 0) {
    output += '✅ No issues found!\n';
    return output;
  }

  output += '📋 Detailed Results:\n\n';

  report.results.forEach(result => {
    output += `📁 ${result.file}\n`;

    result.issues.forEach(issue => {
      const icon =
        issue.severity === 'error'
          ? '❌'
          : issue.severity === 'warning'
            ? '⚠️'
            : 'ℹ️';

      output += `  ${icon} Line ${issue.line}: ${issue.issue}\n`;
      output += `     💡 ${issue.suggestion}\n`;
    });

    output += '\n';
  });

  return output;
}

/**
 * CLI command để chạy validation
 */
export function runValidation() {
  console.log('🔍 Starting relationship validation...');

  // Trong thực tế, đây sẽ scan tất cả files trong project
  // Hiện tại chỉ là mock để demo
  const mockFiles = [
    { path: 'src/hooks/useChallenges.tsx', content: '/* mock content */' },
    {
      path: 'src/components/ChallengesList.tsx',
      content: '/* mock content */',
    },
  ];

  const report = validateProject(mockFiles);
  const reportText = generateReport(report);

  console.log(reportText);

  // Exit with error code if có issues
  if (report.summary.errors > 0) {
    process.exit(1);
  }
}
