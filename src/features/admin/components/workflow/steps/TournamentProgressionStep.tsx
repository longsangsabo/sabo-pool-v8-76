import React from 'react';
import { DisabledAdminComponent } from '../../DisabledAdminComponent';

const TournamentProgressionStep = () => {
  return (
    <DisabledAdminComponent
      title='Tournament Progression Step'
      description='Tournament workflow progression management'
      reason='Tournament matches table and related functionality are not available'
    />
  );
};

export default TournamentProgressionStep;
