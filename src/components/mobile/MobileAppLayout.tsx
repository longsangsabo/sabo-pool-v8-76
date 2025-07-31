
import React, { ReactNode } from 'react';
import { SocialMobileLayout } from './SocialMobileLayout';

interface MobileAppLayoutProps {
  children: ReactNode;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({ children }) => {
  return (
    <SocialMobileLayout>
      {children}
    </SocialMobileLayout>
  );
};
