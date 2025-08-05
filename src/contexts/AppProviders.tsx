import React from 'react';
import { TournamentGlobalProvider } from './TournamentGlobalContext';
import { LoadingStateProvider } from './LoadingStateContext';
import { ErrorStateProvider } from './ErrorStateContext';

interface AppProvidersProps {
  children: React.ReactNode;
  clubId?: string;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  clubId,
}) => {
  return (
    <ErrorStateProvider>
      <LoadingStateProvider>
        <TournamentGlobalProvider clubId={clubId}>
          {children}
        </TournamentGlobalProvider>
      </LoadingStateProvider>
    </ErrorStateProvider>
  );
};
