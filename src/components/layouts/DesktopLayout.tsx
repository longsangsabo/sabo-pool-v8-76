import React from 'react';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto px-4 py-6'>{children}</div>
    </div>
  );
};
