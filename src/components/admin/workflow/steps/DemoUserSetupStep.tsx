import React from 'react';
import { DisabledAdminComponent } from '../../DisabledAdminComponent';

const DemoUserSetupStep = () => {
  return (
    <DisabledAdminComponent
      title='Demo User Setup Step'
      description='Tournament workflow demo user setup'
      reason='Demo user functions are not available in current database schema'
    />
  );
};

export default DemoUserSetupStep;
