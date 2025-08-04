import React from 'react';
import { DisabledAdminComponent } from '../../DisabledAdminComponent';

const AdminControlsStep = () => {
  return (
    <DisabledAdminComponent
      title='Admin Controls Step'
      description='Tournament workflow admin controls'
      reason='Tournament matches table and related functionality are not available'
    />
  );
};

export default AdminControlsStep;
