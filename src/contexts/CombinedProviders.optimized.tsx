import React, { memo, useState, useEffect } from 'react';
import { UserDataProvider } from './UserDataContext';
import { LanguageProvider } from './LanguageContext';
import { ResponsiveLayoutProvider } from './ResponsiveLayoutContext';
import { AuthErrorBoundary } from '@/components/error/AuthErrorBoundary';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/hooks/useAuth';

// ✅ Defer heavy contexts
let AppProviders: any = null;

interface CombinedProvidersProps {
  children: React.ReactNode;
}

const CombinedProvidersComponent: React.FC<CombinedProvidersProps> = ({
  children,
}) => {
  const [isAdvancedLoaded, setIsAdvancedLoaded] = useState(false);

  // ✅ Load heavy contexts only after auth is established
  useEffect(() => {
    const loadAdvanced = async () => {
      try {
        const { AppProviders: AP } = await import('./AppProviders');
        AppProviders = AP;
        setIsAdvancedLoaded(true);
      } catch (error) {
        console.error('Failed to load AppProviders:', error);
        // Fallback - set as loaded anyway to prevent blocking
        setIsAdvancedLoaded(true);
      }
    };

    // Load after a short delay to prioritize initial render
    const timeoutId = setTimeout(loadAdvanced, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  // ✅ Essential providers first, defer advanced ones
  if (!isAdvancedLoaded || !AppProviders) {
    return (
      <AuthErrorBoundary>
        <ThemeProvider defaultTheme='system' storageKey='sabo-ui-theme'>
          <AuthProvider>
            <LanguageProvider>
              <ResponsiveLayoutProvider>
                <UserDataProvider>{children}</UserDataProvider>
              </ResponsiveLayoutProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </AuthErrorBoundary>
    );
  }

  return (
    <AuthErrorBoundary>
      <ThemeProvider defaultTheme='system' storageKey='sabo-ui-theme'>
        <AuthProvider>
          <LanguageProvider>
            <ResponsiveLayoutProvider>
              <UserDataProvider>
                <AppProviders>{children}</AppProviders>
              </UserDataProvider>
            </ResponsiveLayoutProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </AuthErrorBoundary>
  );
};

export const CombinedProviders = memo(CombinedProvidersComponent);
