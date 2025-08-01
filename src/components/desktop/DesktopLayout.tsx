import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { UserDesktopSidebar } from './UserDesktopSidebar';
import { UserDesktopHeader } from './UserDesktopHeader';

interface DesktopLayoutProps {
  children?: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className='flex min-h-screen bg-background'>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        <UserDesktopSidebar
          collapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col min-w-0'>
        <UserDesktopHeader
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={isSidebarCollapsed}
        />

        <main className='flex-1 p-6 overflow-auto'>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
