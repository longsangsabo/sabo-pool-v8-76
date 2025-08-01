import React from 'react';
import { SystemResetPanel } from '@/components/admin/SystemResetPanel';

const AdminSystemReset: React.FC = () => {
  return (
    <div className='container mx-auto p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>System Reset</h1>
        <p className='text-muted-foreground'>
          Manage system-wide data resets and cleanup operations.
        </p>
      </div>

      <div className='flex justify-center'>
        <SystemResetPanel />
      </div>
    </div>
  );
};

export default AdminSystemReset;
