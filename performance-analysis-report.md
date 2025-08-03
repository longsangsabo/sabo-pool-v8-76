# Performance Analysis Report

Date: 2025-08-03T16:19:01.970Z

## Overview

- Analyzed 15 components
- Found 12 potential performance issues
- 7 components have performance issues

## Bundle Size Issues

### Large dependency: moment

- **Severity:** medium
- **Recommendation:** Consider using date-fns or dayjs which are much smaller alternatives

### Large dependency: lodash

- **Severity:** medium
- **Recommendation:** Consider importing only needed parts or replacing with a lighter alternative

## Component Performance Issues

### TournamentList

- **File:** /workspaces/sabo-pool-v8-76/src/components/tournament/TournamentList.tsx
- **Lines of Code:** 178
- **Issues Found:** 3

#### Detected Issues:

- **Large component (178 lines)**
  - Severity: medium
  - Recommendation: Consider breaking into smaller components
- **Missing memoization**
  - Severity: low
  - Recommendation: Wrap TournamentList with React.memo() to prevent unnecessary rerenders
- **5 inline functions created in JSX**
  - Severity: medium
  - Recommendation: Use useCallback for event handlers to prevent recreation on each render

### TournamentDetail

- **File:** /workspaces/sabo-pool-v8-76/src/components/tournament/TournamentDetail.tsx
- **Lines of Code:** 247
- **Issues Found:** 4

#### Detected Issues:

- **Large component (247 lines)**
  - Severity: medium
  - Recommendation: Consider breaking into smaller components
- **8 inline objects created in JSX**
  - Severity: medium
  - Recommendation: Move object creation outside of render to prevent recreation on each render
- **6 inline functions created in JSX**
  - Severity: medium
  - Recommendation: Use useCallback for event handlers to prevent recreation on each render
- **6 useEffect hooks**
  - Severity: medium
  - Recommendation: Consider consolidating related effects or using custom hooks

## Performance Best Practices

1. **Memoize components** - Use React.memo for components that render often but with the same props
2. **Use useCallback and useMemo** - Prevent recreation of functions and values on each render
3. **Virtualize long lists** - Use react-window or react-virtualized for long lists
4. **Code-split with dynamic imports** - Reduce initial bundle size
5. **Optimize Context usage** - Split contexts and use selectors to prevent unnecessary rerenders
6. **Avoid inline object creation in JSX** - Move object creation outside render functions
7. **Lazy load images and components** - Use React.lazy and Suspense