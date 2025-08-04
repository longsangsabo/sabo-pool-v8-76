import React from 'react';
import { DisabledAdminComponent } from './DisabledAdminComponent';

const SystemMonitoring = () => {
  return (
    <DisabledAdminComponent
      title='System Monitoring'
      description='Monitor system health and performance metrics'
      reason='Missing columns on challenges table (updated_at) and other monitoring infrastructure'
    />
  );
};

export default SystemMonitoring;
