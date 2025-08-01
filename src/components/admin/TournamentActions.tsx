import React from 'react';
import { DisabledAdminComponent } from './DisabledAdminComponent';

export const TournamentActions = () => {
  return (
    <DisabledAdminComponent
      title='Tournament Actions'
      description='Manage tournament operations and bracket generation'
      reason='Tournament bracket generation functions are not available in current database schema'
    />
  );
};
