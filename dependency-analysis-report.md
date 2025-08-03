# Dependency Analysis Report

Date: 2025-08-03T16:19:01.970Z

## Overview

- Total dependencies: 35
- Production dependencies: 18
- Development dependencies: 17
- Unused dependencies: 3
- Outdated dependencies: 5
- Security vulnerabilities: 2

## Unused Dependencies

- `web-vitals` - Can be safely removed
- `moment` - Can be safely removed (use date-fns instead which is already in the project)
- `framer-motion` - Can be safely removed

To remove unused dependencies, run:

```bash
npm uninstall web-vitals moment framer-motion
```

## Outdated Dependencies

| Package | Current | Wanted | Latest |
| ------- | ------- | ------ | ------ |
| @mui/material | 5.13.0 | 5.13.0 | 5.15.0 |
| @mui/icons-material | 5.11.16 | 5.11.16 | 5.15.0 |
| react-scripts | 5.0.1 | 5.0.1 | 5.0.1 |
| typescript | 4.9.5 | 4.9.5 | 5.2.2 |
| firebase | 9.22.0 | 9.22.0 | 10.1.0 |

To update dependencies to their wanted versions, run:

```bash
npm update
```

To update dependencies to their latest versions, run:

```bash
npx npm-check-updates -u && npm install
```

## Security Vulnerabilities

| Package | Severity | Via |
| ------- | -------- | --- |
| react-scripts | high | webpack-dev-middleware |
| firebase | medium | @firebase/auth |

To fix vulnerabilities, run:

```bash
npm audit fix
```

For a more aggressive fix that might include breaking changes, run:

```bash
npm audit fix --force
```

## Next Steps

1. Remove unused dependencies to reduce bundle size
2. Update outdated dependencies to benefit from bug fixes and new features
3. Address security vulnerabilities to improve application security
4. Consider setting up automated dependency management with tools like Dependabot or Renovate