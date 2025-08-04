import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

// Core providers
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';

// Feature providers
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ResponsiveLayoutProvider } from '@/contexts/ResponsiveLayoutContext';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { AvatarProvider } from '@/contexts/AvatarContext';

// State management providers
import { LoadingStateProvider } from '@/contexts/LoadingStateContext';
import { ErrorStateProvider } from '@/contexts/ErrorStateContext';
import { TournamentGlobalProvider } from '@/contexts/TournamentGlobalContext';

// Security and monitoring
import { CSRFProvider } from '@/components/security/CSRFProtection';
import { MonitoringProvider } from '@/contexts/MonitoringProvider';

// Error components
import { AppErrorBoundary } from '@/components/error/AppErrorBoundary';
import { AuthErrorBoundary } from '@/components/error/AuthErrorBoundary';

// Create a global query client with optimized settings
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface AppProviderProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

/**
 * AppProvider - Consolidated provider component for the entire application
 * 
 * Provider Hierarchy (outer to inner):
 * 1. AppErrorBoundary - Global error handling
 * 2. QueryClientProvider - React Query for server state
 * 3. HelmetProvider - Document head management
 * 4. ThemeProvider - Theme and dark mode
 * 5. AuthErrorBoundary - Authentication error handling
 * 6. AuthProvider - Authentication state
 * 7. CSRFProvider - CSRF protection
 * 8. MonitoringProvider - Performance monitoring
 * 9. ErrorStateProvider - Global error state
 * 10. LoadingStateProvider - Global loading state
 * 11. ResponsiveLayoutProvider - Responsive breakpoints
 * 12. LanguageProvider - Internationalization
 * 13. AvatarProvider - User avatar management
 * 14. UserDataProvider - User profile data
 * 15. TournamentGlobalProvider - Tournament global state
 * 
 * This ensures proper dependency order and optimal performance.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ 
  children,
  queryClient 
}) => {
  // Use provided query client or create a new one
  const client = React.useMemo(() => 
    queryClient || createQueryClient(), 
    [queryClient]
  );

  // Error fallback component
  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">
          Application Error
        </h1>
        <p className="text-muted-foreground">
          Something went wrong. Please try refreshing the page.
        </p>
        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
          {error.message}
        </pre>
        <button 
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('AppProvider Error:', error, errorInfo);
        // TODO: Send to error monitoring service
      }}
    >
      <QueryClientProvider client={client}>
        <HelmetProvider>
          <ThemeProvider defaultTheme="system" storageKey="sabo-ui-theme">
            <AuthErrorBoundary>
              <AuthProvider>
                <CSRFProvider>
                  <MonitoringProvider>
                    <ErrorStateProvider>
                      <LoadingStateProvider>
                        <ResponsiveLayoutProvider>
                          <LanguageProvider>
                            <AvatarProvider>
                              <UserDataProvider>
                                <TournamentGlobalProvider>
                                  {children}
                                </TournamentGlobalProvider>
                              </UserDataProvider>
                            </AvatarProvider>
                          </LanguageProvider>
                        </ResponsiveLayoutProvider>
                      </LoadingStateProvider>
                    </ErrorStateProvider>
                  </MonitoringProvider>
                </CSRFProvider>
              </AuthProvider>
            </AuthErrorBoundary>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

/**
 * Hook to access the query client from anywhere in the app
 */
export const useQueryClient = () => {
  const queryClient = React.useContext(QueryClientProvider as any);
  if (!queryClient) {
    throw new Error('useQueryClient must be used within AppProvider');
  }
  return queryClient;
};

export default AppProvider;
