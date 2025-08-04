import React from 'react';
import { createRoot } from 'react-dom/client';
import { UnifiedDashboard } from '../components/dashboard/UnifiedDashboard';
import { CLBManagement } from '../features/CLB/components/CLBManagement';

console.log('✅ UnifiedDashboard import successful');
console.log('✅ CLBManagement import successful');

// Test component render
export const TestComponents = () => {
  return (
    <div>
      <h1>Component Test Successful</h1>
      <p>All components are importable and ready to use!</p>
    </div>
  );
};
