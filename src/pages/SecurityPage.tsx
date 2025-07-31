import React from 'react';
import { SecuritySettings } from '@/components/security/SecuritySettings';

const SecurityPage: React.FC = () => {
  const handleSaveSettings = (settings: any) => {
    // ...removed console.log('Security settings saved:', settings)
    // Handle saving security settings
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 py-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Bảo mật</h1>
          <p className='text-gray-600 mt-1'>
            Quản lý cài đặt bảo mật tài khoản
          </p>
        </div>

        <SecuritySettings onSave={handleSaveSettings} isLoading={false} />
      </div>
    </div>
  );
};

export default SecurityPage;
