import React from 'react';
import { DisabledAdminComponent } from '../../DisabledAdminComponent';

const TournamentSelectionStep = () => {
  return (
    <DisabledAdminComponent
      title='Tournament Selection Step'
      description='Tournament workflow selection and bracket generation'
      reason='Tournament matches table and bracket generation functions are not available'
    />
  );
};

export default TournamentSelectionStep;
