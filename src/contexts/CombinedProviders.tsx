
import React, { memo } from 'react';
import { UserDataProvider } from './UserDataContext';
import { LanguageProvider } from './LanguageContext';
import { ResponsiveLayoutProvider } from './ResponsiveLayoutContext';
import { AppProviders } from './AppProviders';
import { AuthErrorBoundary } from '@/components/error/AuthErrorBoundary';
import { ThemeProvider } from '@/hooks/useTheme';

interface CombinedProvidersProps {
  children: React.ReactNode;
}

const CombinedProvidersComponent: React.FC<CombinedProvidersProps> = ({ children }) => {
  return (
    <AuthErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="sabo-ui-theme">
        <LanguageProvider>
          <ResponsiveLayoutProvider>
            <UserDataProvider>
              <AppProviders>
                {children}
              </AppProviders>
            </UserDataProvider>
          </ResponsiveLayoutProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthErrorBoundary>
  );
};

export const CombinedProviders = memo(CombinedProvidersComponent);
