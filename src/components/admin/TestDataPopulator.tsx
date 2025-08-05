import React from 'react';
import { DisabledAdminComponent } from './DisabledAdminComponent';

const TestDataPopulator = () => {
  return (
    <DisabledAdminComponent
      title='Test Data Populator'
      description='Populate database with test data'
      reason='Match system table and related functionality are not available'
    />
  );
};

export default TestDataPopulator;
