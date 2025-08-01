import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { RoleBasedLayout } from './layouts/RoleBasedLayout';

const MainLayout = () => {
  const location = useLocation();

  // Hide navigation on specific pages
  const hideNavPages = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
  ];
  const shouldHideNav = hideNavPages.includes(location.pathname);

  if (shouldHideNav) {
    return <Outlet />;
  }

  return (
    <RoleBasedLayout>
      <Outlet />
    </RoleBasedLayout>
  );
};

export default MainLayout;
