import React, { ReactNode } from 'react';
import { UserMobileLayout } from './UserMobileLayout';

interface MobileAppLayoutProps {
  children: ReactNode;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({
  children,
}) => {
  return <UserMobileLayout>{children}</UserMobileLayout>;
};
