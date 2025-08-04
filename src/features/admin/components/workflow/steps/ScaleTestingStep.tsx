import React from 'react';
import { DisabledAdminComponent } from '../../DisabledAdminComponent';

const ScaleTestingStep = () => {
  return (
    <DisabledAdminComponent
      title='Scale Testing Step'
      description='Tournament workflow scale testing'
      reason='Tournament matches table and related functionality are not available'
    />
  );
};

export default ScaleTestingStep;
