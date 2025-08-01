import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminResponsiveLayout } from './layouts/AdminResponsiveLayout';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <AdminResponsiveLayout>{children || <Outlet />}</AdminResponsiveLayout>
  );
};

export default AdminLayout;
