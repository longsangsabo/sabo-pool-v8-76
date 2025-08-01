import React from 'react';
import { DisabledAdminComponent } from '@/components/admin/DisabledAdminComponent';

export const ChallengeExpiryManager = () => {
  return (
    <DisabledAdminComponent
      title='Challenge Expiry Manager'
      description='Manage challenge expiration and auto-cleanup'
      reason='Database schema updates require type regeneration. Challenge expiry functionality will be available after types are updated.'
    />
  );
};
