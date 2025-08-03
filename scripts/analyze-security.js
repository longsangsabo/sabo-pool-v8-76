#!/usr/bin/env node

/**
 * Security Analysis Script
 * 
 * This script scans the codebase for common security issues:
 * 1. Potential XSS vulnerabilities
 * 2. Insecure data handling
 * 3. Authentication and authorization flaws
 * 4. Injection risks
 * 5. Environment variable usage and secret handling
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(process.cwd(), 'src');
const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('🔒 Running security analysis...');

// Function to scan for potential XSS vulnerabilities
function scanForXssVulnerabilities() {
  console.log('Scanning for potential XSS vulnerabilities...');
  
  const vulnerabilities = [];
  
  try {
    // Look for dangerouslySetInnerHTML usage
    const grepInnerHTML = `find ${SRC_DIR} -type f -name "*.tsx" -o -name "*.jsx" | xargs grep -l "dangerouslySetInnerHTML"`;
    
    try {
      const output = execSync(grepInnerHTML, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const componentName = path.basename(file, path.extname(file));
        
        // Check if there's sanitization
        const hasSanitization = content.includes('DOMPurify') || content.includes('sanitize') || content.includes('sanitizeHtml');
        
        vulnerabilities.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Use of dangerouslySetInnerHTML',
          sanitized: hasSanitization
        });
      });
    } catch (error) {
      // No matches found
    }
    
    // Look for direct DOM manipulation
    const grepDomManipulation = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "document\\.write\\|innerHTML\\|outerHTML"`;
    
    try {
      const output = execSync(grepDomManipulation, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const componentName = path.basename(file, path.extname(file));
        
        // Check if there's sanitization
        const hasSanitization = content.includes('DOMPurify') || content.includes('sanitize') || content.includes('sanitizeHtml');
        
        vulnerabilities.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Direct DOM manipulation',
          sanitized: hasSanitization
        });
      });
    } catch (error) {
      // No matches found
    }
    
    // Look for href with javascript: URLs
    const grepJavascriptUrls = `find ${SRC_DIR} -type f -name "*.tsx" -o -name "*.jsx" | xargs grep -l "href=.*javascript:"`;
    
    try {
      const output = execSync(grepJavascriptUrls, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const componentName = path.basename(file, path.extname(file));
        
        vulnerabilities.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Use of javascript: URLs',
          sanitized: false
        });
      });
    } catch (error) {
      // No matches found
    }
    
    return vulnerabilities;
  } catch (error) {
    console.error('Error scanning for XSS vulnerabilities:', error);
    return vulnerabilities;
  }
}

// Function to scan for insecure data handling
function scanForInsecureDataHandling() {
  console.log('Scanning for insecure data handling...');
  
  const issues = [];
  
  try {
    // Look for localStorage/sessionStorage usage
    const grepStorage = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "localStorage\\|sessionStorage"`;
    
    try {
      const output = execSync(grepStorage, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const componentName = path.basename(file, path.extname(file));
        
        // Check if storing sensitive data
        const sensitivePattern = /localStorage\s*\.\s*setItem\s*\(\s*(['"`])(?:token|password|auth|jwt|secret|key|credential).*\1/i;
        const storingCredentials = sensitivePattern.test(content);
        
        issues.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Use of browser storage',
          critical: storingCredentials,
          details: storingCredentials ? 'Potentially storing sensitive data' : 'General usage'
        });
      });
    } catch (error) {
      // No matches found
    }
    
    // Look for console.log with sensitive data
    const grepConsoleSensitive = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "console\\.log.*\\(.*password\\|console\\.log.*\\(.*token\\|console\\.log.*\\(.*auth"`;
    
    try {
      const output = execSync(grepConsoleSensitive, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const componentName = path.basename(file, path.extname(file));
        
        issues.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Logging sensitive data',
          critical: true,
          details: 'Credentials or tokens may be exposed in logs'
        });
      });
    } catch (error) {
      // No matches found
    }
    
    return issues;
  } catch (error) {
    console.error('Error scanning for insecure data handling:', error);
    return issues;
  }
}

// Function to scan for authentication/authorization issues
function scanForAuthIssues() {
  console.log('Scanning for authentication/authorization issues...');
  
  const issues = [];
  
  try {
    // Look for hardcoded credentials
    const grepHardcodedAuth = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "password\\s*=\\s*['\\\"]\\|apiKey\\s*=\\s*['\\\"]\\|token\\s*=\\s*['\\\"]"`;
    
    try {
      const output = execSync(grepHardcodedAuth, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const componentName = path.basename(file, path.extname(file));
        
        issues.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Potentially hardcoded credentials',
          critical: true
        });
      });
    } catch (error) {
      // No matches found
    }
    
    // Look for inconsistent auth checks
    const authFiles = [];
    try {
      const grepAuthFiles = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "isAuthenticated\\|isLoggedIn\\|isAuth\\|hasPermission\\|canAccess"`;
      const output = execSync(grepAuthFiles, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      authFiles.push(...files);
    } catch (error) {
      // No matches found
    }
    
    // Analyze auth patterns for consistency
    const authPatterns = {};
    authFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const componentName = path.basename(file, path.extname(file));
      
      // Extract auth check patterns
      const authCheckRegex = /(isAuthenticated|isLoggedIn|isAuth|hasPermission|canAccess)(\s*\(\s*\)|\s*\(.*\)|\s*\?\s*)/g;
      let match;
      const patterns = [];
      
      while ((match = authCheckRegex.exec(content)) !== null) {
        patterns.push(match[1]);
      }
      
      if (patterns.length > 0) {
        authPatterns[componentName] = patterns;
      }
    });
    
    // Find inconsistent auth checks
    const authChecks = Object.values(authPatterns).flat();
    const uniqueChecks = [...new Set(authChecks)];
    
    if (uniqueChecks.length > 1) {
      issues.push({
        component: 'Multiple files',
        file: 'Multiple files',
        issue: 'Inconsistent auth check mechanisms',
        critical: false,
        details: `Found ${uniqueChecks.length} different auth check patterns: ${uniqueChecks.join(', ')}`
      });
    }
    
    return issues;
  } catch (error) {
    console.error('Error scanning for auth issues:', error);
    return issues;
  }
}

// Function to scan for injection risks
function scanForInjectionRisks() {
  console.log('Scanning for injection risks...');
  
  const issues = [];
  
  try {
    // Look for dynamic SQL or NoSQL queries
    const grepDynamicQueries = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "query(.*\\\\+.*)"`;
    
    try {
      const output = execSync(grepDynamicQueries, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const componentName = path.basename(file, path.extname(file));
        
        // Check if there's parameterization or sanitization
        const hasSanitization = content.includes('prepared') || content.includes('parameterize') || content.includes('sanitize');
        
        issues.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Dynamic query construction',
          critical: !hasSanitization,
          details: hasSanitization ? 'Has sanitization or parameterization' : 'No apparent sanitization'
        });
      });
    } catch (error) {
      // No matches found
    }
    
    // Look for eval or Function constructor
    const grepEval = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "eval(\\|new Function("`;
    
    try {
      const output = execSync(grepEval, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const componentName = path.basename(file, path.extname(file));
        
        issues.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Use of eval() or Function constructor',
          critical: true,
          details: 'High risk of code injection'
        });
      });
    } catch (error) {
      // No matches found
    }
    
    return issues;
  } catch (error) {
    console.error('Error scanning for injection risks:', error);
    return issues;
  }
}

// Function to scan for environment variable issues
function scanForEnvIssues() {
  console.log('Scanning for environment variable issues...');
  
  const issues = [];
  
  try {
    // Look for direct process.env access
    const grepProcessEnv = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "process\\.env"`;
    
    try {
      const output = execSync(grepProcessEnv, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      // Find .env files
      let envVarNames = [];
      try {
        const envFiles = ['.env.example', '.env.development', '.env.production', '.env'];
        
        for (const envFile of envFiles) {
          const envPath = path.join(process.cwd(), envFile);
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const varRegex = /^([A-Za-z0-9_]+)=/gm;
            let match;
            
            while ((match = varRegex.exec(envContent)) !== null) {
              envVarNames.push(match[1]);
            }
          }
        }
        
        // Remove duplicates
        envVarNames = [...new Set(envVarNames)];
      } catch (error) {
        // Failed to read env files
      }
      
      const sensitiveEnvPatterns = [
        'KEY', 'SECRET', 'PASSWORD', 'PASS', 'TOKEN', 'AUTH', 'CREDENTIAL', 'PRIVATE'
      ];
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const componentName = path.basename(file, path.extname(file));
        
        // Check if accessing sensitive env vars
        let accessingSensitiveVars = false;
        let sensitiveVars = [];
        
        for (const varName of envVarNames) {
          if (content.includes(`process.env.${varName}`)) {
            const isSensitive = sensitiveEnvPatterns.some(pattern => varName.includes(pattern));
            if (isSensitive) {
              accessingSensitiveVars = true;
              sensitiveVars.push(varName);
            }
          }
        }
        
        // Check if leaking env vars to frontend
        const isClientSide = file.includes('/pages/') || file.includes('/components/');
        const leakingToClient = isClientSide && accessingSensitiveVars;
        
        issues.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: 'Direct environment variable access',
          critical: leakingToClient,
          details: leakingToClient ? 
            `Potentially exposing sensitive env vars (${sensitiveVars.join(', ')}) in client-side code` : 
            accessingSensitiveVars ? `Accessing sensitive env vars (${sensitiveVars.join(', ')})` : 'General env var usage'
        });
      });
    } catch (error) {
      // No matches found
    }
    
    return issues;
  } catch (error) {
    console.error('Error scanning for env issues:', error);
    return issues;
  }
}

// Function to generate report
function generateReport(xssVulnerabilities, insecureDataIssues, authIssues, injectionRisks, envIssues) {
  let report = `# Security Analysis Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  // Summary
  const criticalXss = xssVulnerabilities.filter(v => !v.sanitized).length;
  const criticalData = insecureDataIssues.filter(i => i.critical).length;
  const criticalAuth = authIssues.filter(i => i.critical).length;
  const criticalInjection = injectionRisks.filter(i => i.critical).length;
  const criticalEnv = envIssues.filter(i => i.critical).length;
  
  const totalCritical = criticalXss + criticalData + criticalAuth + criticalInjection + criticalEnv;
  
  report += `## Summary\n\n`;
  report += `Found ${totalCritical} critical security issues that should be addressed immediately.\n\n`;
  report += `| Category | Issues | Critical |\n`;
  report += `| -------- | ------ | -------- |\n`;
  report += `| XSS Vulnerabilities | ${xssVulnerabilities.length} | ${criticalXss} |\n`;
  report += `| Insecure Data Handling | ${insecureDataIssues.length} | ${criticalData} |\n`;
  report += `| Authentication/Authorization | ${authIssues.length} | ${criticalAuth} |\n`;
  report += `| Injection Risks | ${injectionRisks.length} | ${criticalInjection} |\n`;
  report += `| Environment Variables | ${envIssues.length} | ${criticalEnv} |\n\n`;
  
  // XSS vulnerabilities
  report += `## XSS Vulnerabilities\n\n`;
  
  if (xssVulnerabilities.length > 0) {
    const unsanitized = xssVulnerabilities.filter(v => !v.sanitized);
    
    if (unsanitized.length > 0) {
      report += `### Unsanitized Content (${unsanitized.length})\n\n`;
      report += `These instances have no apparent sanitization and are at high risk for XSS attacks:\n\n`;
      
      unsanitized.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}\n`;
      });
      report += '\n';
    }
    
    const sanitized = xssVulnerabilities.filter(v => v.sanitized);
    if (sanitized.length > 0) {
      report += `### Sanitized Content (${sanitized.length})\n\n`;
      report += `These instances appear to use sanitization but should be double-checked:\n\n`;
      
      sanitized.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}\n`;
      });
      report += '\n';
    }
  } else {
    report += `No XSS vulnerabilities detected.\n\n`;
  }
  
  // Insecure data handling
  report += `## Insecure Data Handling\n\n`;
  
  if (insecureDataIssues.length > 0) {
    const critical = insecureDataIssues.filter(i => i.critical);
    
    if (critical.length > 0) {
      report += `### Critical Data Issues (${critical.length})\n\n`;
      
      critical.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}${item.details ? ` - ${item.details}` : ''}\n`;
      });
      report += '\n';
    }
    
    const nonCritical = insecureDataIssues.filter(i => !i.critical);
    if (nonCritical.length > 0) {
      report += `### Other Data Issues (${nonCritical.length})\n\n`;
      
      nonCritical.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}${item.details ? ` - ${item.details}` : ''}\n`;
      });
      report += '\n';
    }
  } else {
    report += `No insecure data handling issues detected.\n\n`;
  }
  
  // Auth issues
  report += `## Authentication/Authorization Issues\n\n`;
  
  if (authIssues.length > 0) {
    const critical = authIssues.filter(i => i.critical);
    
    if (critical.length > 0) {
      report += `### Critical Auth Issues (${critical.length})\n\n`;
      
      critical.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}${item.details ? ` - ${item.details}` : ''}\n`;
      });
      report += '\n';
    }
    
    const nonCritical = authIssues.filter(i => !i.critical);
    if (nonCritical.length > 0) {
      report += `### Other Auth Issues (${nonCritical.length})\n\n`;
      
      nonCritical.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}${item.details ? ` - ${item.details}` : ''}\n`;
      });
      report += '\n';
    }
  } else {
    report += `No authentication/authorization issues detected.\n\n`;
  }
  
  // Injection risks
  report += `## Injection Risks\n\n`;
  
  if (injectionRisks.length > 0) {
    const critical = injectionRisks.filter(i => i.critical);
    
    if (critical.length > 0) {
      report += `### Critical Injection Risks (${critical.length})\n\n`;
      
      critical.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}${item.details ? ` - ${item.details}` : ''}\n`;
      });
      report += '\n';
    }
    
    const nonCritical = injectionRisks.filter(i => !i.critical);
    if (nonCritical.length > 0) {
      report += `### Other Injection Concerns (${nonCritical.length})\n\n`;
      
      nonCritical.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}${item.details ? ` - ${item.details}` : ''}\n`;
      });
      report += '\n';
    }
  } else {
    report += `No injection risks detected.\n\n`;
  }
  
  // Env issues
  report += `## Environment Variable Issues\n\n`;
  
  if (envIssues.length > 0) {
    const critical = envIssues.filter(i => i.critical);
    
    if (critical.length > 0) {
      report += `### Critical Environment Issues (${critical.length})\n\n`;
      
      critical.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}${item.details ? ` - ${item.details}` : ''}\n`;
      });
      report += '\n';
    }
    
    const nonCritical = envIssues.filter(i => !i.critical);
    if (nonCritical.length > 0) {
      report += `### Other Environment Concerns (${nonCritical.length})\n\n`;
      
      nonCritical.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}${item.details ? ` - ${item.details}` : ''}\n`;
      });
      report += '\n';
    }
  } else {
    report += `No environment variable issues detected.\n\n`;
  }
  
  // Recommendations
  report += `## Security Recommendations\n\n`;
  
  if (criticalXss > 0) {
    report += `### XSS Prevention\n\n`;
    report += `1. Use DOMPurify to sanitize any HTML content before rendering\n`;
    report += `2. Avoid \`dangerouslySetInnerHTML\` whenever possible\n`;
    report += `3. Consider a Content Security Policy (CSP) to restrict script execution\n\n`;
  }
  
  if (criticalData > 0) {
    report += `### Secure Data Handling\n\n`;
    report += `1. Never store sensitive information in localStorage or sessionStorage\n`;
    report += `2. Remove all console logs containing sensitive data\n`;
    report += `3. Use secure cookies with HttpOnly, Secure, and SameSite flags\n\n`;
  }
  
  if (criticalAuth > 0) {
    report += `### Authentication Best Practices\n\n`;
    report += `1. Remove all hardcoded credentials from the codebase\n`;
    report += `2. Standardize on a single auth check mechanism throughout the app\n`;
    report += `3. Consider implementing role-based access control (RBAC)\n\n`;
  }
  
  if (criticalInjection > 0) {
    report += `### Injection Prevention\n\n`;
    report += `1. Use parameterized queries or prepared statements for database operations\n`;
    report += `2. Never use eval() or the Function constructor with user input\n`;
    report += `3. Validate and sanitize all user inputs\n\n`;
  }
  
  if (criticalEnv > 0) {
    report += `### Environment Variable Security\n\n`;
    report += `1. Never expose sensitive environment variables to client-side code\n`;
    report += `2. Use server-side APIs to proxy sensitive operations\n`;
    report += `3. Prefix client-side env vars with NEXT_PUBLIC_ or VITE_ to make their exposure explicit\n\n`;
  }
  
  return report;
}

// Main function
async function analyzeSecurity() {
  // Run analyses
  const xssVulnerabilities = scanForXssVulnerabilities();
  const insecureDataIssues = scanForInsecureDataHandling();
  const authIssues = scanForAuthIssues();
  const injectionRisks = scanForInjectionRisks();
  const envIssues = scanForEnvIssues();
  
  // Generate report
  const report = generateReport(xssVulnerabilities, insecureDataIssues, authIssues, injectionRisks, envIssues);
  const reportPath = path.join(REPORTS_DIR, 'security-analysis.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Security analysis complete! Report saved to: ${reportPath}`);
  
  // Return results
  return {
    xssVulnerabilities,
    insecureDataIssues,
    authIssues,
    injectionRisks,
    envIssues,
    reportPath
  };
}

analyzeSecurity().catch(error => {
  console.error('Error running security analysis:', error);
  process.exit(1);
});
