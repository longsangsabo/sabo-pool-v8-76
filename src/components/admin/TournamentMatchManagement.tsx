import React from 'react';
import { DisabledAdminComponent } from './DisabledAdminComponent';

const TournamentMatchManagement = () => {
  return (
    <DisabledAdminComponent
      title='Tournament Match Management'
      description='Manage tournament matches and rounds'
      reason='Tournament round generation functions are not available in current database schema'
    />
  );
};

export default TournamentMatchManagement;
