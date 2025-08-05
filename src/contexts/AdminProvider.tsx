import React, { createContext, useContext, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './LanguageContext';

// Admin-specific QueryClient with different defaults
const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes for admin data
      retry: 2,
      refetchOnWindowFocus: true, // Admin needs fresh data
      refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    },
  },
});

interface AdminContextValue {
  isAdminMode: boolean;
}

const AdminContext = createContext<AdminContextValue>({
  isAdminMode: true,
});

export const useAdminContext = () => useContext(AdminContext);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={adminQueryClient}>
      <AdminContext.Provider value={{ isAdminMode: true }}>
        <LanguageProvider>{children}</LanguageProvider>
      </AdminContext.Provider>
    </QueryClientProvider>
  );
};
