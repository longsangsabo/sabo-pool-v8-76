import React from 'react';
import { DisabledAdminComponent } from '../../DisabledAdminComponent';

const UserExperienceStep = () => {
  return (
    <DisabledAdminComponent
      title='User Experience Step'
      description='Tournament workflow user experience testing'
      reason='Tournament matches table and related functionality are not available'
    />
  );
};

export default UserExperienceStep;
