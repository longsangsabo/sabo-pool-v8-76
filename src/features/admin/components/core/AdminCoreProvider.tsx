import React, { createContext, useContext, ReactNode } from 'react';
import { useAdminPermissions } from '../../../hooks/admin/useAdminPermissions';
import { useAdminNotifications } from '../../../hooks/admin/useAdminNotifications';
import { useAdminActions } from '../../../hooks/admin/useAdminActions';

interface AdminCoreContextType {
  permissions: any;
  notifications: any;
  actions: any;
  user: any;
}

const AdminCoreContext = createContext<AdminCoreContextType | null>(null);

interface AdminCoreProviderProps {
  children: ReactNode;
}

export function AdminCoreProvider({ children }: AdminCoreProviderProps) {
  const permissions = useAdminPermissions();
  const notifications = useAdminNotifications();
  const actions = useAdminActions();

  const value = {
    permissions,
    notifications,
    actions,
    user: permissions.user
  };

  return (
    <AdminCoreContext.Provider value={value}>
      {children}
    </AdminCoreContext.Provider>
  );
}

export function useAdminCore() {
  const context = useContext(AdminCoreContext);
  if (!context) {
    throw new Error('useAdminCore must be used within AdminCoreProvider');
  }
  return context;
}
