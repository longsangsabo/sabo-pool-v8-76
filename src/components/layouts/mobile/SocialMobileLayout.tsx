import React from 'react';

interface SocialMobileLayoutProps {
  children: React.ReactNode;
}

export const SocialMobileLayout: React.FC<SocialMobileLayoutProps> = ({
  children,
}) => {
  return (
    <div className='min-h-screen bg-background'>
      <div className='px-4 py-6'>{children}</div>
    </div>
  );
};
