import React, { createContext, useContext, useState, useCallback } from 'react';

interface ErrorStateContextType {
  // Error states by module
  errors: Record<string, string[]>;

  // Actions
  addError: (module: string, error: string) => void;
  removeError: (module: string, errorIndex?: number) => void;
  clearErrors: (module?: string) => void;
  hasErrors: (module?: string) => boolean;
  getErrors: (module: string) => string[];
  getAllErrors: () => string[];
}

const ErrorStateContext = createContext<ErrorStateContextType | undefined>(
  undefined
);

export const useErrorState = () => {
  const context = useContext(ErrorStateContext);
  if (!context) {
    throw new Error('useErrorState must be used within ErrorStateProvider');
  }
  return context;
};

// Convenience hook for specific modules
export const useModuleError = (moduleName: string) => {
  const { addError, removeError, clearErrors, hasErrors, getErrors } =
    useErrorState();

  return {
    errors: getErrors(moduleName),
    hasErrors: hasErrors(moduleName),
    addError: (error: string) => addError(moduleName, error),
    removeError: (errorIndex?: number) => removeError(moduleName, errorIndex),
    clearErrors: () => clearErrors(moduleName),
  };
};

interface ErrorStateProviderProps {
  children: React.ReactNode;
}

export const ErrorStateProvider: React.FC<ErrorStateProviderProps> = ({
  children,
}) => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const addError = useCallback((module: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [module]: [...(prev[module] || []), error],
    }));
  }, []);

  const removeError = useCallback((module: string, errorIndex?: number) => {
    setErrors(prev => {
      const moduleErrors = prev[module] || [];
      if (errorIndex === undefined) {
        // Remove all errors for this module
        const newErrors = { ...prev };
        delete newErrors[module];
        return newErrors;
      } else {
        // Remove specific error by index
        const newModuleErrors = moduleErrors.filter(
          (_, index) => index !== errorIndex
        );
        return {
          ...prev,
          [module]: newModuleErrors.length > 0 ? newModuleErrors : undefined,
        };
      }
    });
  }, []);

  const clearErrors = useCallback((module?: string) => {
    if (module) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[module];
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  const hasErrors = useCallback(
    (module?: string) => {
      if (module) {
        return (errors[module] || []).length > 0;
      }
      return Object.values(errors).some(
        moduleErrors => moduleErrors.length > 0
      );
    },
    [errors]
  );

  const getErrors = useCallback(
    (module: string) => {
      return errors[module] || [];
    },
    [errors]
  );

  const getAllErrors = useCallback(() => {
    return Object.values(errors).flat();
  }, [errors]);

  const value: ErrorStateContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
    getErrors,
    getAllErrors,
  };

  return (
    <ErrorStateContext.Provider value={value}>
      {children}
    </ErrorStateContext.Provider>
  );
};
