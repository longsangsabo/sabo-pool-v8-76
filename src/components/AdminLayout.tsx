import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminDesktopLayout } from './layouts/AdminDesktopLayout';
import { AdminMobileLayout } from './layouts/AdminMobileLayout';
import { AdminTabletLayout } from './layouts/AdminTabletLayout';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const renderLayout = () => {
    const content = children || <Outlet />;
    
    switch (screenSize) {
      case 'mobile':
        return <AdminMobileLayout>{content}</AdminMobileLayout>;
      case 'tablet':
        return <AdminTabletLayout>{content}</AdminTabletLayout>;
      default:
        return <AdminDesktopLayout>{content}</AdminDesktopLayout>;
    }
  };

  return renderLayout();
};

export default AdminLayout;
