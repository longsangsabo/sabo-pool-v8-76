
import React from 'react';

interface AppOfflineWrapperProps {
  children: React.ReactNode;
}

export const AppOfflineWrapper: React.FC<AppOfflineWrapperProps> = ({ children }) => {
  return (
    <div className="app-offline-wrapper">
      {children}
    </div>
  );
};
