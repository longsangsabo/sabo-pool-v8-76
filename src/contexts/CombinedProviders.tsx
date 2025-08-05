import React, { memo } from 'react';
import { UserDataProvider } from './UserDataContext';
import { LanguageProvider } from './LanguageContext';
import { ResponsiveLayoutProvider } from './ResponsiveLayoutContext';
import { AppProviders } from './AppProviders';
import { AvatarProvider } from './AvatarContext';

import { AuthErrorBoundary } from '@/components/error/AuthErrorBoundary';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/hooks/useAuth';

interface CombinedProvidersProps {
  children: React.ReactNode;
}

const CombinedProvidersComponent: React.FC<CombinedProvidersProps> = ({
  children,
}) => {
  return (
    <AuthErrorBoundary>
      <ThemeProvider defaultTheme='system' storageKey='sabo-ui-theme'>
        <AuthProvider>
          <AvatarProvider>
            <LanguageProvider>
              <ResponsiveLayoutProvider>
                <UserDataProvider>
                  <AppProviders>{children}</AppProviders>
                </UserDataProvider>
              </ResponsiveLayoutProvider>
            </LanguageProvider>
          </AvatarProvider>
        </AuthProvider>
      </ThemeProvider>
    </AuthErrorBoundary>
  );
};

export const CombinedProviders = memo(CombinedProvidersComponent);
