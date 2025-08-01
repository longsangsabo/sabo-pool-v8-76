import React from 'react';
import { DisabledAdminComponent } from '../../DisabledAdminComponent';

const MatchReportingStep = () => {
  return (
    <DisabledAdminComponent
      title='Match Reporting Step'
      description='Tournament workflow match reporting'
      reason='Tournament matches table and advancement functions are not available'
    />
  );
};

export default MatchReportingStep;
