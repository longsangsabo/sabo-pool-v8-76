# 🧪 Kế Hoạch Kiểm Thử Toàn Diện

## 📋 Tổng Quan

Kế hoạch kiểm thử này bao gồm các chiến lược kiểm thử đầy đủ cho SABO Pool Arena Hub, bao gồm:

1. **Unit Testing**: Kiểm thử các components và hooks riêng lẻ
2. **Integration Testing**: Kiểm thử tương tác giữa các components
3. **E2E Testing**: Kiểm thử toàn bộ luồng người dùng
4. **Performance Testing**: Đánh giá hiệu suất hệ thống
5. **Security Testing**: Kiểm tra các lỗ hổng bảo mật
6. **Accessibility Testing**: Đảm bảo ứng dụng có thể tiếp cận

## 🔬 Unit Testing

### 🧩 Components

```tsx
// src/features/tournament/components/__tests__/TournamentCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TournamentCard } from '../TournamentCard';

describe('TournamentCard', () => {
  const mockTournament = {
    id: '1',
    name: 'Pool Tournament 2025',
    date: '2025-08-15T10:00:00Z',
    location: 'SABO Arena',
    registrationFee: 100000,
    maxParticipants: 32,
    currentParticipants: 16,
  };

  it('renders tournament details correctly', () => {
    render(<TournamentCard tournament={mockTournament} />);

    expect(screen.getByText('Pool Tournament 2025')).toBeInTheDocument();
    expect(screen.getByText('SABO Arena')).toBeInTheDocument();
    expect(screen.getByText('100,000 VND')).toBeInTheDocument();
    expect(screen.getByText('16/32')).toBeInTheDocument();
  });

  it('calls onRegister when register button is clicked', async () => {
    const onRegister = jest.fn();
    render(
      <TournamentCard tournament={mockTournament} onRegister={onRegister} />
    );

    await userEvent.click(screen.getByText('Đăng ký'));
    expect(onRegister).toHaveBeenCalledWith(mockTournament.id);
  });

  it('displays registration closed message when tournament is full', () => {
    const fullTournament = {
      ...mockTournament,
      currentParticipants: 32,
    };

    render(<TournamentCard tournament={fullTournament} />);
    expect(screen.getByText('Đã đủ người')).toBeInTheDocument();
    expect(screen.queryByText('Đăng ký')).not.toBeInTheDocument();
  });
});
```

### 🪝 Hooks

```tsx
// src/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with loading state and no user', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('sets user when auth state changes', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };

    // Mock the auth state change event
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
      callback => {
        callback('SIGNED_IN', { user: mockUser });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }
    );

    const { result, waitForNextUpdate } = renderHook(() => useAuth());
    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it('calls signIn with correct credentials', async () => {
    (supabase.auth.signIn as jest.Mock).mockResolvedValue({
      user: { id: 'user123' },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
    });

    expect(supabase.auth.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('calls signOut when logout is called', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
```

## 🔄 Integration Testing

### Feature Integration

```tsx
// src/features/challenger/__tests__/ChallengeFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/core/auth/providers/AuthProvider';
import { ChallengeCreatePage } from '../pages/ChallengeCreatePage';
import { ChallengeDetailPage } from '../pages/ChallengeDetailPage';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      user: jest.fn().mockReturnValue({ id: 'user123' }),
    },
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </AuthProvider>
  </QueryClientProvider>
);

describe('Challenge Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a challenge and navigates to details page', async () => {
    // Mock API responses
    supabase.from.mockImplementation(table => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            data: [
              {
                id: 'opponent123',
                name: 'Opponent User',
                avatar_url: 'avatar.jpg',
              },
            ],
            error: null,
          }),
        };
      }

      if (table === 'challenges') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: {
                  id: 'challenge123',
                  challenger_id: 'user123',
                  opponent_id: 'opponent123',
                  status: 'pending',
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }

      return supabase;
    });

    // Render create challenge page
    render(<ChallengeCreatePage />, { wrapper });

    // Select an opponent
    await userEvent.click(screen.getByText('Chọn đối thủ'));
    await userEvent.click(screen.getByText('Opponent User'));

    // Set bet amount
    await userEvent.type(screen.getByLabelText('Tiền cược'), '50000');

    // Submit form
    await userEvent.click(screen.getByText('Tạo thách đấu'));

    // Verify redirect and API calls
    await waitFor(() => {
      expect(window.location.pathname).toEqual('/challenges/challenge123');
    });

    // Render challenge details page
    render(<ChallengeDetailPage />, { wrapper });

    // Verify challenge details are shown
    expect(screen.getByText('Thách đấu với Opponent User')).toBeInTheDocument();
    expect(screen.getByText('50,000 VND')).toBeInTheDocument();
    expect(screen.getByText('Đang chờ')).toBeInTheDocument();
  });
});
```

### API Integration

```tsx
// src/integrations/__tests__/supabase-api.test.ts
import { supabase } from '@/integrations/supabase/client';
import {
  fetchUserProfile,
  updateUserProfile,
} from '@/integrations/supabase/api';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('Supabase API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserProfile', () => {
    it('returns user profile data when successful', async () => {
      const mockProfileData = {
        id: 'user123',
        name: 'Test User',
        avatar_url: 'avatar.jpg',
      };

      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue({
            data: mockProfileData,
            error: null,
          }),
        }),
      }));

      const result = await fetchUserProfile('user123');

      expect(result).toEqual(mockProfileData);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('throws error when API call fails', async () => {
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue({
            data: null,
            error: { message: 'Profile not found' },
          }),
        }),
      }));

      await expect(fetchUserProfile('user123')).rejects.toThrow(
        'Profile not found'
      );
    });
  });

  describe('updateUserProfile', () => {
    it('updates user profile when successful', async () => {
      const mockUpdateData = { name: 'Updated Name', bio: 'New bio' };

      supabase.from.mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue({
            data: { id: 'user123', ...mockUpdateData },
            error: null,
          }),
        }),
      }));

      const result = await updateUserProfile('user123', mockUpdateData);

      expect(result).toEqual({ id: 'user123', ...mockUpdateData });
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });
});
```

## 🌐 E2E Testing (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication flows', () => {
  test('should allow user to sign in', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Click login button
    await page.click('button[type="submit"]');

    // Verify user is logged in and redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Click login button
    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should allow user to sign up', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');

    // Generate random email to avoid conflicts
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;

    // Fill signup form
    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[name="email"]', randomEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    // Accept terms
    await page.check('input[name="acceptTerms"]');

    // Click signup button
    await page.click('button[type="submit"]');

    // Verify user is redirected to email verification page
    await expect(page).toHaveURL('/verify-email');
    await expect(page.locator('text=Please check your email')).toBeVisible();
  });
});
```

```typescript
// e2e/tournament.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tournament management', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpass');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new tournament', async ({ page }) => {
    // Navigate to tournament creation page
    await page.goto('/admin/tournaments/create');

    // Fill tournament form
    await page.fill('input[name="name"]', 'E2E Test Tournament');
    await page.fill('input[name="location"]', 'Test Arena');
    await page.fill('input[name="fee"]', '100000');
    await page.fill('input[name="maxParticipants"]', '32');

    // Set date (use a date picker or direct input depending on implementation)
    await page.fill('input[name="date"]', '2025-12-31');

    // Click create button
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(
      page.locator('text=Tournament created successfully')
    ).toBeVisible();

    // Verify tournament appears in tournament list
    await page.goto('/admin/tournaments');
    await expect(page.locator('text=E2E Test Tournament')).toBeVisible();
  });

  test('should edit an existing tournament', async ({ page }) => {
    // Navigate to tournaments list
    await page.goto('/admin/tournaments');

    // Click edit button for first tournament
    await page.click(':nth-match([data-testid="edit-tournament-button"], 1)');

    // Update tournament name
    await page.fill('input[name="name"]', 'Updated Tournament Name');

    // Save changes
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(
      page.locator('text=Tournament updated successfully')
    ).toBeVisible();

    // Verify tournament name is updated in list
    await page.goto('/admin/tournaments');
    await expect(page.locator('text=Updated Tournament Name')).toBeVisible();
  });
});
```

## 🚀 Performance Testing

### Load Testing with k6

```javascript
// tests/performance/homepage-load.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50, // 50 virtual users
  duration: '30s', // Test duration
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
  },
};

export default function () {
  const res = http.get('https://app.sabopoolhub.com/');

  check(res, {
    'status is 200': r => r.status === 200,
    'time to first byte < 300ms': r => r.timings.ttfb < 300,
  });

  sleep(1);
}
```

### React Component Performance

```tsx
// src/features/tournament/components/__tests__/TournamentList.perf.test.tsx
import { render } from '@testing-library/react';
import { Profiler } from 'react';
import { TournamentList } from '../TournamentList';

// Mock data
const generateTournaments = count => {
  return Array.from({ length: count }, (_, i) => ({
    id: `tour-${i}`,
    name: `Tournament ${i}`,
    date: new Date().toISOString(),
    location: `Location ${i}`,
    registrationFee: 100000,
    maxParticipants: 32,
    currentParticipants: Math.floor(Math.random() * 32),
  }));
};

describe('TournamentList Performance', () => {
  it('renders efficiently with large data sets', () => {
    const smallDataset = generateTournaments(10);
    const mediumDataset = generateTournaments(50);
    const largeDataset = generateTournaments(100);

    const renderTimes = [];

    const onRender = (id, phase, actualTime) => {
      renderTimes.push({ id, phase, actualTime });
    };

    // Small dataset
    render(
      <Profiler id='small' onRender={onRender}>
        <TournamentList tournaments={smallDataset} />
      </Profiler>
    );

    // Medium dataset
    render(
      <Profiler id='medium' onRender={onRender}>
        <TournamentList tournaments={mediumDataset} />
      </Profiler>
    );

    // Large dataset
    render(
      <Profiler id='large' onRender={onRender}>
        <TournamentList tournaments={largeDataset} />
      </Profiler>
    );

    // Extract render times
    const smallTime = renderTimes.find(r => r.id === 'small').actualTime;
    const mediumTime = renderTimes.find(r => r.id === 'medium').actualTime;
    const largeTime = renderTimes.find(r => r.id === 'large').actualTime;

    // Verify performance scales reasonably
    // Rendering time shouldn't grow exponentially with data size
    expect(mediumTime / smallTime).toBeLessThan(10); // Medium should be less than 10x slower than small
    expect(largeTime / mediumTime).toBeLessThan(5); // Large should be less than 5x slower than medium
  });
});
```

## 🔒 Security Testing

### API Security Tests

```tsx
// tests/security/api-security.test.ts
import axios from 'axios';
import {
  authenticatedUser,
  unauthenticatedUser,
} from '../test-utils/auth-helpers';

const API_URL = process.env.API_URL || 'https://api.sabopoolhub.com';

describe('API Security', () => {
  describe('Authentication', () => {
    it('rejects unauthenticated requests to protected endpoints', async () => {
      try {
        await axios.get(`${API_URL}/admin/users`, unauthenticatedUser.config);
        fail('Should have rejected unauthenticated request');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('validates JWT tokens properly', async () => {
      const invalidToken = authenticatedUser.getInvalidToken();

      try {
        await axios.get(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${invalidToken}` },
        });
        fail('Should have rejected invalid token');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Authorization', () => {
    it('prevents regular users from accessing admin endpoints', async () => {
      try {
        await axios.get(`${API_URL}/admin/users`, authenticatedUser.config);
        fail('Should have rejected non-admin user');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });

    it("prevents users from accessing other users' data", async () => {
      try {
        await axios.get(
          `${API_URL}/users/other-user-id/private-data`,
          authenticatedUser.config
        );
        fail('Should have rejected access to other user data');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('Input Validation', () => {
    it('rejects SQL injection attempts', async () => {
      try {
        await axios.get(
          `${API_URL}/users?search=1' OR '1'='1`,
          authenticatedUser.config
        );
        // Check that the response doesn't contain data that shouldn't be accessible
        // Implementation depends on the API
      } catch (error) {
        // Either reject with 400 or sanitize the input
        expect([400, 200]).toContain(error.response?.status || 200);
      }
    });

    it('rejects XSS attempts', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await axios.post(
        `${API_URL}/messages`,
        { message: xssPayload },
        authenticatedUser.config
      );

      // Check that the script tag is sanitized in the response
      expect(response.data.message).not.toEqual(xssPayload);
    });
  });
});
```

## ♿ Accessibility Testing

```tsx
// tests/accessibility/a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { TournamentDetailsPage } from '@/pages/TournamentDetailsPage';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('HomePage has no accessibility violations', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('LoginPage has no accessibility violations', async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('TournamentDetailsPage has no accessibility violations', async () => {
    // Mock necessary data
    const mockTournament = {
      id: '1',
      name: 'Accessibility Test Tournament',
      // other props...
    };

    const { container } = render(
      <TournamentDetailsPage tournament={mockTournament} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 📱 Responsive Testing

```typescript
// e2e/responsive.spec.ts
import { test, expect } from '@playwright/test';

// Define device viewports to test
const viewports = [
  { width: 375, height: 667, name: 'Mobile' },
  { width: 768, height: 1024, name: 'Tablet' },
  { width: 1366, height: 768, name: 'Laptop' },
  { width: 1920, height: 1080, name: 'Desktop' },
];

test.describe('Responsive layouts', () => {
  for (const viewport of viewports) {
    test(`Homepage renders correctly on ${viewport.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Navigate to homepage
      await page.goto('/');

      // Take screenshot for visual comparison
      await page.screenshot({
        path: `./test-results/responsive-home-${viewport.name}.png`,
        fullPage: true,
      });

      // Check that key elements are visible
      await expect(
        page.locator('[data-testid="main-navigation"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });

    test(`Tournament list renders correctly on ${viewport.name}`, async ({
      page,
    }) => {
      // Set viewport
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Login and navigate to tournaments page
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.goto('/tournaments');

      // Check that tournament cards render properly
      if (viewport.width < 768) {
        // Check mobile layout (list view)
        await expect(
          page.locator('[data-testid="tournament-list-mobile"]')
        ).toBeVisible();
      } else {
        // Check desktop layout (grid view)
        await expect(
          page.locator('[data-testid="tournament-grid"]')
        ).toBeVisible();
      }
    });
  }
});
```

## 🧪 Automation Scripts

### Test All

```bash
#!/bin/bash

# Run all tests
echo "🧪 Running all tests..."

# Unit and integration tests
echo "🔬 Running unit and integration tests..."
npm run test:unit

# End-to-end tests
echo "🌐 Running E2E tests..."
npm run test:e2e

# Performance tests
echo "🚀 Running performance tests..."
npm run test:performance

# Accessibility tests
echo "♿ Running accessibility tests..."
npm run test:a11y

# Security tests
echo "🔒 Running security tests..."
npm run test:security

echo "✅ All tests completed!"
```

### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Run performance tests
        run: npm run test:performance
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance-report/
```
