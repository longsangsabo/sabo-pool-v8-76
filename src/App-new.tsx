import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/shared/components/ui/sonner';

// Core infrastructure
import { AppProvider } from '@/core/providers/AppProvider';
import { GlobalStateProvider } from '@/core/state/GlobalStateProvider';
import { AppRouter } from '@/core/router/AppRouter';

// Error boundary and loading components
import { AppErrorBoundary } from '@/components/error/AppErrorBoundary';

/**
 * App - Main application component with new core infrastructure
 * 
 * Structure:
 * 1. AppErrorBoundary - Global error handling
 * 2. Router - React Router for navigation
 * 3. AppProvider - All context providers consolidated
 * 4. GlobalStateProvider - Global state management
 * 5. AppRouter - Unified routing system
 * 6. Toaster - Global notifications
 */
const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <Router>
        <AppProvider>
          <GlobalStateProvider>
            <div className="min-h-screen bg-background">
              <AppRouter />
            </div>
            <Toaster />
          </GlobalStateProvider>
        </AppProvider>
      </Router>
    </AppErrorBoundary>
  );
};

export default App;
