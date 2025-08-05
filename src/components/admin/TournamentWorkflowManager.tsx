import React from 'react';
import { DisabledAdminComponent } from './DisabledAdminComponent';

const TournamentWorkflowManager = () => {
  return (
    <DisabledAdminComponent
      title='Tournament Workflow Manager'
      description='Manage tournament registration workflows'
      reason='Missing status column on tournament_registrations table'
    />
  );
};

export default TournamentWorkflowManager;
