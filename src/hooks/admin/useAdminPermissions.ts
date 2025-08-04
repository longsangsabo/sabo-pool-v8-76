import { useState, useEffect } from 'react';

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageClubs: boolean;
  canManageTournaments: boolean;
  canManageTransactions: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  user: any;
}

export function useAdminPermissions(): AdminPermissions {
  const [permissions, setPermissions] = useState<AdminPermissions>({
    canManageUsers: false,
    canManageClubs: false,
    canManageTournaments: false,
    canManageTransactions: false,
    canViewAnalytics: false,
    canManageSettings: false,
    user: null
  });

  useEffect(() => {
    // TODO: Fetch từ API hoặc context
    // Tạm thời set full permissions cho development
    setPermissions({
      canManageUsers: true,
      canManageClubs: true,
      canManageTournaments: true,
      canManageTransactions: true,
      canViewAnalytics: true,
      canManageSettings: true,
      user: { id: 1, name: 'Admin', role: 'admin' }
    });
  }, []);

  return permissions;
}
