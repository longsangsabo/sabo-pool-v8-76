import React from 'react';
import { DisabledAdminComponent } from './DisabledAdminComponent';

const UserManagementDashboard = () => {
  return (
    <DisabledAdminComponent
      title='User Management Dashboard'
      description='Comprehensive user management interface'
      reason='Missing ban_status column on profiles table and admin_management table not available'
    />
  );
};

export default UserManagementDashboard;
