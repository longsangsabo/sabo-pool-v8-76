import React from 'react';
import { DisabledAdminComponent } from '../../DisabledAdminComponent';

const DataCleanupStep = () => {
  return (
    <DisabledAdminComponent
      title='Data Cleanup Step'
      description='Tournament workflow data cleanup'
      reason='Tournament matches table and related functionality are not available'
    />
  );
};

export default DataCleanupStep;
