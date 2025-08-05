/**
 * Auto-fix Tool cho Relationship Issues
 * Tự động sửa các vấn đề về foreign key relationships
 */

import {
  autoFixRelationships,
  buildSelectWithRelationships,
} from './relationshipMapper';
import { validateProject } from './relationshipValidator';

export interface FixResult {
  file: string;
  originalContent: string;
  fixedContent: string;
  changesApplied: number;
  issues: string[];
}

export interface AutoFixReport {
  totalFiles: number;
  filesFixed: number;
  totalChanges: number;
  results: FixResult[];
  success: boolean;
}

/**
 * Auto-fix patterns cho các loại lỗi khác nhau
 */
const FIX_PATTERNS = [
  // Fix deprecated foreign key formats
  {
    pattern: /profiles!challenges_challenger_id_fkey/g,
    replacement: 'profiles!challenger_id',
    description: 'Fixed deprecated challenger relationship',
  },
  {
    pattern: /profiles!challenges_opponent_id_fkey/g,
    replacement: 'profiles!opponent_id',
    description: 'Fixed deprecated opponent relationship',
  },
  {
    pattern: /user_profiles!challenges_challenger_id_fkey/g,
    replacement: 'profiles!challenger_id',
    description: 'Fixed incorrect table reference for challenger',
  },
  {
    pattern: /user_profiles!challenges_opponent_id_fkey/g,
    replacement: 'profiles!opponent_id',
    description: 'Fixed incorrect table reference for opponent',
  },

  // Fix table references
  {
    pattern: /user_profiles!/g,
    replacement: 'profiles!',
    description: 'Fixed table name from user_profiles to profiles',
  },
  {
    pattern: /clubs!/g,
    replacement: 'club_profiles!',
    description: 'Fixed table name from clubs to club_profiles',
  },

  // Fix common query patterns
  {
    pattern: /clubs\(/g,
    replacement: 'club_profiles(',
    description: 'Fixed club table reference in query',
  },
  {
    pattern: /name(?=[\s,\)])/g,
    replacement: 'club_name',
    description: 'Fixed club name field reference',
    context: 'club_profiles', // Only apply when in club context
  },
];

/**
 * Apply auto-fixes to a single file
 */
export function autoFixFile(filePath: string, content: string): FixResult {
  let fixedContent = content;
  const issues: string[] = [];
  let changesApplied = 0;

  // Apply each fix pattern
  FIX_PATTERNS.forEach(({ pattern, replacement, description, context }) => {
    const originalContent = fixedContent;

    // Check context if specified
    if (context && !fixedContent.includes(context)) {
      return;
    }

    fixedContent = fixedContent.replace(pattern, replacement);

    // Count changes
    const matches = originalContent.match(pattern);
    if (matches && matches.length > 0) {
      changesApplied += matches.length;
      issues.push(`${description} (${matches.length} occurrences)`);
    }
  });

  // Additional smart fixes
  fixedContent = applySmartFixes(fixedContent);

  return {
    file: filePath,
    originalContent: content,
    fixedContent,
    changesApplied,
    issues,
  };
}

/**
 * Apply smarter context-aware fixes
 */
function applySmartFixes(content: string): string {
  let fixed = content;

  // Fix query selections for challenges
  const challengeSelectPattern =
    /\.select\(\s*`[\s\S]*?challenger_profile:profiles![^(]*\([\s\S]*?\)[\s\S]*?challenged_profile:profiles![^(]*\([\s\S]*?\)[\s\S]*?club:[^(]*\([\s\S]*?\)/g;

  fixed = fixed.replace(challengeSelectPattern, match => {
    // Ensure consistent field names
    let fixedMatch = match;

    // Fix club fields within club_profiles context
    if (fixedMatch.includes('club_profiles')) {
      fixedMatch = fixedMatch.replace(/(\s+)name([\s,\)])/g, '$1club_name$2');
    }

    return fixedMatch;
  });

  return fixed;
}

/**
 * Auto-fix multiple files
 */
export function autoFixProject(
  files: Array<{ path: string; content: string }>
): AutoFixReport {
  const results: FixResult[] = [];
  let totalChanges = 0;
  let filesFixed = 0;

  files.forEach(file => {
    // Only process relevant files
    if (!/\.(ts|tsx|js|jsx)$/.test(file.path)) {
      return;
    }

    const result = autoFixFile(file.path, file.content);

    if (result.changesApplied > 0) {
      results.push(result);
      totalChanges += result.changesApplied;
      filesFixed++;
    }
  });

  return {
    totalFiles: files.length,
    filesFixed,
    totalChanges,
    results,
    success: true,
  };
}

/**
 * Preview changes without applying them
 */
export function previewFixes(
  files: Array<{ path: string; content: string }>
): string {
  const report = autoFixProject(files);

  let output = '\n=== AUTO-FIX PREVIEW ===\n\n';

  output += `📊 Summary:\n`;
  output += `  Total files: ${report.totalFiles}\n`;
  output += `  Files to be fixed: ${report.filesFixed}\n`;
  output += `  Total changes: ${report.totalChanges}\n\n`;

  if (report.results.length === 0) {
    output += '✅ No fixes needed!\n';
    return output;
  }

  output += '📋 Changes Preview:\n\n';

  report.results.forEach(result => {
    output += `📁 ${result.file}\n`;
    output += `   Changes: ${result.changesApplied}\n`;

    result.issues.forEach(issue => {
      output += `   ✅ ${issue}\n`;
    });

    output += '\n';
  });

  return output;
}

/**
 * Apply fixes and save files (mock implementation)
 */
export function applyFixes(
  files: Array<{ path: string; content: string }>
): Promise<AutoFixReport> {
  return new Promise(resolve => {
    const report = autoFixProject(files);

    // In real implementation, this would write files to disk

    report.results.forEach(result => {
      // fs.writeFileSync(result.file, result.fixedContent);
    });

    resolve(report);
  });
}

/**
 * CLI command để chạy auto-fix
 */
export async function runAutoFix(preview: boolean = false) {
  // Mock files - in real implementation would scan project
  const mockFiles = [
    { path: 'src/hooks/useChallenges.tsx', content: '/* mock content */' },
  ];

  if (preview) {
    const previewText = previewFixes(mockFiles);
  } else {
    const report = await applyFixes(mockFiles);

    if (report.success) {
    } else {
      process.exit(1);
    }
  }
}
