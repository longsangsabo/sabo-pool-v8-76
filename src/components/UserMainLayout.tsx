import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import UserNavigation from './UserNavigation';

const UserMainLayout = () => {
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
    <div className="min-h-screen bg-background">
      <UserNavigation />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default UserMainLayout;
