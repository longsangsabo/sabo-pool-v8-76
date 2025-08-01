import React from 'react';
import { SectionErrorBoundary } from './SectionErrorBoundary';

interface SectionWrapperProps {
  children: React.ReactNode;
}

// Tournament Section Wrapper
export const TournamentSection: React.FC<SectionWrapperProps> = ({
  children,
}) => {
  const handleError = (error: Error) => {
    console.error('[Tournament Section] Error:', error);
  };

  return (
    <SectionErrorBoundary section='Tournament' onError={handleError}>
      {children}
    </SectionErrorBoundary>
  );
};

// Challenge Section Wrapper
export const ChallengeSection: React.FC<SectionWrapperProps> = ({
  children,
}) => {
  const handleError = (error: Error) => {
    console.error('[Challenge Section] Error:', error);
  };

  return (
    <SectionErrorBoundary section='Challenge' onError={handleError}>
      {children}
    </SectionErrorBoundary>
  );
};

// Profile Section Wrapper
export const ProfileSection: React.FC<SectionWrapperProps> = ({ children }) => {
  const handleError = (error: Error) => {
    console.error('[Profile Section] Error:', error);
  };

  return (
    <SectionErrorBoundary section='Profile' onError={handleError}>
      {children}
    </SectionErrorBoundary>
  );
};

// Club Section Wrapper
export const ClubSection: React.FC<SectionWrapperProps> = ({ children }) => {
  const handleError = (error: Error) => {
    console.error('[Club Section] Error:', error);
  };

  return (
    <SectionErrorBoundary section='Club' onError={handleError}>
      {children}
    </SectionErrorBoundary>
  );
};
