#!/usr/bin/env node
/**
 * Translation Checker Script
 * Kiểm tra missing translation keys và hardcoded strings
 */

const fs = require('fs');
const path = require('path');

class TranslationChecker {
  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.localesDir = path.join(__dirname, '../src/locales');
    this.missingKeys = [];
    this.hardcodedStrings = [];
  }

  // Tìm tất cả hardcoded strings trong components
  findHardcodedStrings() {
    const files = this.getReactFiles(this.srcDir);
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Regex để tìm hardcoded strings trong JSX
      const hardcodedRegex = />([A-Z][a-zA-Z\s]{3,})</g;
      let match;
      
      while ((match = hardcodedRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if (this.isLikelyHardcodedText(text)) {
          this.hardcodedStrings.push({
            file: file.replace(this.srcDir, ''),
            text: text,
            line: this.getLineNumber(content, match.index)
          });
        }
      }
    });
  }

  // Kiểm tra missing translation keys
  checkMissingKeys() {
    const enKeys = this.getAllTranslationKeys('en');
    const viKeys = this.getAllTranslationKeys('vi');
    
    // Keys có trong EN nhưng không có trong VI
    const missingInVi = enKeys.filter(key => !viKeys.includes(key));
    
    // Keys có trong VI nhưng không có trong EN  
    const missingInEn = viKeys.filter(key => !enKeys.includes(key));
    
    this.missingKeys = {
      missingInVietnamese: missingInVi,
      missingInEnglish: missingInEn
    };
  }

  // Lấy tất cả translation keys từ namespace
  getAllTranslationKeys(lang) {
    const localeDir = path.join(this.localesDir, lang);
    const keys = [];
    
    if (fs.existsSync(localeDir)) {
      const files = fs.readdirSync(localeDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(localeDir, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const namespace = file.replace('.json', '');
          
          this.extractKeys(content, namespace, keys);
        }
      });
    }
    
    return keys;
  }

  // Trích xuất keys từ nested object
  extractKeys(obj, prefix, keys) {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.extractKeys(obj[key], fullKey, keys);
      } else {
        keys.push(fullKey);
      }
    });
  }

  // Lấy tất cả React files
  getReactFiles(dir) {
    let files = [];
    
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          files = files.concat(this.getReactFiles(itemPath));
        } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
          files.push(itemPath);
        }
      });
    }
    
    return files;
  }

  // Kiểm tra xem có phải hardcoded text không
  isLikelyHardcodedText(text) {
    // Bỏ qua một số trường hợp đặc biệt
    const excludePatterns = [
      /^\d+$/,  // Chỉ số
      /^[A-Z]{2,}$/,  // Acronyms như "API", "URL"
      /^[a-z_]+$/,  // Variables như "user_id"
      /^\w+\.\w+$/,  // Object properties như "user.name"
    ];
    
    return !excludePatterns.some(pattern => pattern.test(text)) && 
           text.length > 3 && 
           /[A-Z]/.test(text);
  }

  // Lấy line number của text
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  // Tạo báo cáo
  generateReport() {
    this.findHardcodedStrings();
    this.checkMissingKeys();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        hardcodedStrings: this.hardcodedStrings.length,
        missingInVietnamese: this.missingKeys.missingInVietnamese.length,
        missingInEnglish: this.missingKeys.missingInEnglish.length
      },
      details: {
        hardcodedStrings: this.hardcodedStrings,
        missingKeys: this.missingKeys
      }
    };
    
    return report;
  }

  // Lưu báo cáo
  saveReport() {
    const report = this.generateReport();
    const reportPath = path.join(__dirname, '../translation-report.json');
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('🔍 Translation Check Report');
    console.log('═'.repeat(50));
    console.log(`📊 Hardcoded Strings Found: ${report.summary.hardcodedStrings}`);
    console.log(`🇻🇳 Missing Vietnamese Keys: ${report.summary.missingInVietnamese}`);
    console.log(`🇺🇸 Missing English Keys: ${report.summary.missingInEnglish}`);
    console.log(`📄 Report saved to: ${reportPath}`);
    
    if (report.summary.hardcodedStrings > 0) {
      console.log('\n⚠️  Hardcoded Strings Detected:');
      report.details.hardcodedStrings.slice(0, 5).forEach(item => {
        console.log(`   ${item.file}:${item.line} - "${item.text}"`);
      });
    }
    
    if (report.summary.missingInVietnamese > 0) {
      console.log('\n🇻🇳 Missing Vietnamese Translations:');
      report.details.missingKeys.missingInVietnamese.slice(0, 5).forEach(key => {
        console.log(`   ${key}`);
      });
    }
    
    return report;
  }
}

// Chạy script
if (require.main === module) {
  const checker = new TranslationChecker();
  const report = checker.saveReport();
  
  // Exit with error code if issues found
  const hasIssues = report.summary.hardcodedStrings > 0 || 
                   report.summary.missingInVietnamese > 0;
  
  process.exit(hasIssues ? 1 : 0);
}

module.exports = TranslationChecker;
