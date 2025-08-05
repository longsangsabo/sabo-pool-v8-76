import React from 'react';
import { DisabledAdminComponent } from './DisabledAdminComponent';

const TournamentDashboard = () => {
  return (
    <DisabledAdminComponent
      title='Tournament Dashboard'
      description='Overview of tournament activities and statistics'
      reason='Tournament matches and match events tables are not available'
    />
  );
};

export default TournamentDashboard;
