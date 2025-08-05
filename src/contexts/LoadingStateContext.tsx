import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingStateContextType {
  // Global loading state
  globalLoading: boolean;

  // Module-specific loading states
  moduleLoading: Record<string, boolean>;

  // Actions
  setGlobalLoading: (loading: boolean) => void;
  setModuleLoading: (module: string, loading: boolean) => void;
  isModuleLoading: (module: string) => boolean;
  isAnyLoading: () => boolean;
  clearAllLoading: () => void;
}

const LoadingStateContext = createContext<LoadingStateContextType | undefined>(
  undefined
);

export const useLoadingState = () => {
  const context = useContext(LoadingStateContext);
  if (!context) {
    throw new Error('useLoadingState must be used within LoadingStateProvider');
  }
  return context;
};

// Convenience hook for specific modules
export const useModuleLoading = (moduleName: string) => {
  const { setModuleLoading, isModuleLoading } = useLoadingState();

  return {
    loading: isModuleLoading(moduleName),
    setLoading: (loading: boolean) => setModuleLoading(moduleName, loading),
  };
};

interface LoadingStateProviderProps {
  children: React.ReactNode;
}

export const LoadingStateProvider: React.FC<LoadingStateProviderProps> = ({
  children,
}) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [moduleLoading, setModuleLoadingState] = useState<
    Record<string, boolean>
  >({});

  const setModuleLoading = useCallback((module: string, loading: boolean) => {
    setModuleLoadingState(prev => ({
      ...prev,
      [module]: loading,
    }));
  }, []);

  const isModuleLoading = useCallback(
    (module: string) => {
      return moduleLoading[module] || false;
    },
    [moduleLoading]
  );

  const isAnyLoading = useCallback(() => {
    return (
      globalLoading || Object.values(moduleLoading).some(loading => loading)
    );
  }, [globalLoading, moduleLoading]);

  const clearAllLoading = useCallback(() => {
    setGlobalLoading(false);
    setModuleLoadingState({});
  }, []);

  const value: LoadingStateContextType = {
    globalLoading,
    moduleLoading,
    setGlobalLoading,
    setModuleLoading,
    isModuleLoading,
    isAnyLoading,
    clearAllLoading,
  };

  return (
    <LoadingStateContext.Provider value={value}>
      {children}
    </LoadingStateContext.Provider>
  );
};
