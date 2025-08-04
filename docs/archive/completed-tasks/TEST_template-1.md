# 🧪 [Test Document Title]

*#tags: test, testing, [specific-feature], template*

**Last Updated**: [YYYY-MM-DD]
**Status**: [Draft|Review|Approved]
**Owner**: [Your Name/Team]
**Dependencies**: [Related test docs, DEV_ docs]

**Purpose**: Describe the testing scope and objectives for [specific feature/system]

---

## 🎯 Testing Overview

### 📋 Test Scope
- **Feature**: [Feature being tested]
- **Test Types**: [Unit|Integration|E2E|Performance|Security]
- **Environment**: [Development|Staging|Production]
- **Coverage Target**: [X%]

### 🎨 Test Strategy
Brief description of overall testing approach and methodology.

---

## 🚀 Quick Test Execution

### ⚡ Run All Tests
```bash
# Run complete test suite
npm test

# Run specific test category
npm run test:[unit|integration|e2e]

# Run with coverage
npm run test:coverage
```

### 🔍 Fast Feedback Loop
```bash
# Watch mode for development
npm run test:watch

# Test specific file
npm test [filename]

# Debug mode
npm run test:debug
```

---

## 📚 Detailed Test Plan

### 🧪 Unit Tests
**Location**: `tests/unit/[feature]/`
**Framework**: [Jest|Vitest|Other]
**Coverage**: [Target percentage]

```javascript
// Example unit test structure
describe('[FeatureName]', () => {
  beforeEach(() => {
    // Setup
  });

  test('should [expected behavior]', () => {
    // Arrange
    // Act  
    // Assert
  });
});
```

### 🔗 Integration Tests
**Location**: `tests/integration/[feature]/`
**Framework**: [Testing framework]
**Database**: [Test database setup]

```javascript
// Example integration test
describe('[Feature] Integration', () => {
  beforeAll(async () => {
    // Database setup
  });

  test('should [integration behavior]', async () => {
    // Test database interactions
  });
});
```

### 🌐 End-to-End Tests
**Location**: `e2e/[feature]/`
**Framework**: [Playwright|Cypress|Other]
**Browser**: [Chrome|Firefox|Safari]

```javascript
// Example E2E test
test('[User journey description]', async ({ page }) => {
  // Navigate to page
  // Perform user actions
  // Verify expected outcomes
});
```

---

## 🔧 Test Configuration

### ⚙️ Test Environment Setup
```bash
# Environment variables
TEST_DATABASE_URL=postgresql://localhost:5432/test_db
TEST_API_URL=http://localhost:3001
TEST_TIMEOUT=30000
```

### 📊 Coverage Configuration
```javascript
// jest.config.js or vitest.config.js
export default {
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 🗄️ Test Data Management
```javascript
// Test data setup
const testData = {
  users: [
    { id: 1, name: 'Test User', email: 'test@example.com' }
  ],
  tournaments: [
    { id: 1, name: 'Test Tournament', players: 8 }
  ]
};
```

---

## 📋 Test Checklist

### ✅ Pre-Test Setup
- [ ] Test environment is clean
- [ ] Test data is prepared
- [ ] Dependencies are mocked appropriately
- [ ] Configuration is correct

### 🧪 Test Execution
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests meet criteria
- [ ] Security tests pass

### 📊 Post-Test Validation
- [ ] Coverage meets minimum threshold
- [ ] No flaky test failures
- [ ] Test reports are generated
- [ ] Failed tests are documented

---

## 🚨 Troubleshooting

### 🔧 Common Issues

**Test timeouts**
```bash
# Increase timeout
jest --testTimeout=10000

# Check for hanging promises
npm run test:detect-open-handles
```

**Database connection issues**
```bash
# Reset test database
npm run test:db:reset

# Check database connection
npm run test:db:ping
```

**Flaky tests**
```bash
# Run tests multiple times
npm run test:stress [test-name]

# Isolate problematic test
npm test -- --testNamePattern="[specific test]"
```

### 🐛 Debug Mode
```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest [test-file]

# Verbose output
npm test -- --verbose

# Watch single file
npm test -- --watch [test-file]
```

---

## 📈 Performance Testing

### ⚡ Load Testing
```javascript
// Example load test configuration
const loadTest = {
  scenarios: {
    normal_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '5m', target: 100 },
        { duration: '10m', target: 100 },
        { duration: '5m', target: 0 },
      ],
    },
  },
};
```

### 📊 Performance Criteria
- **Response Time**: <200ms for 95% of requests
- **Throughput**: >1000 requests/second
- **Error Rate**: <0.1%
- **Memory Usage**: <500MB during peak load

---

## 🔒 Security Testing

### 🛡️ Security Test Cases
- [ ] Authentication bypass attempts
- [ ] Authorization validation
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF token validation

### 🔍 Security Tools
```bash
# Run security scan
npm run security:scan

# Check dependencies
npm audit

# OWASP ZAP scan
npm run security:zap
```

---

## 📖 References

### 🔗 Related Documentation
- `DEV_complete-guide.md` - Development guidelines
- `SETUP_complete-guide.md` - Environment setup
- `DEPLOY_production-checklist.md` - Deployment testing

### 📚 Testing Resources
- [Testing Framework Documentation]
- [Best Practices Guide]
- [Team Testing Standards]

### 🛠️ Tools and Libraries
- **Test Runner**: [Jest|Vitest]
- **E2E Framework**: [Playwright|Cypress]
- **Mocking**: [MSW|Jest mocks]
- **Coverage**: [Istanbul|c8]

---

**Template Version**: 1.0  
**Last Updated**: August 2025  
**Status**: ✅ Template Ready  

---

## 📝 Template Usage Instructions

1. **Copy this template**: `cp docs/templates/TEST_template.md docs/TEST_your-feature.md`
2. **Replace placeholders**: Update all `[bracketed]` content
3. **Add specific content**: Fill in test cases and configurations
4. **Update metadata**: Set correct tags, owner, dependencies
5. **Review and approve**: Follow team review process
