import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GlobalState, GlobalAction } from '@/core/types/global.types';

// Initial global state
const initialState: GlobalState = {
  // Authentication
  user: null,
  userProfile: null,
  isAuthenticated: false,
  authLoading: true,

  // Permissions
  roles: [],
  permissions: [],

  // UI State
  theme: 'system',
  language: 'vi',
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  // Responsive
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  breakpoint: 'desktop',

  // Loading states
  loading: {
    global: false,
    auth: true,
    profile: false,
    tournaments: false,
    clubs: false,
  },

  // Error states
  errors: {
    global: [],
    auth: [],
    profile: [],
    tournaments: [],
    clubs: [],
  },

  // Feature flags
  features: {
    tournaments: true,
    challenges: true,
    marketplace: true,
    analytics: true,
  },
};

// Global state reducer
const globalReducer = (state: GlobalState, action: GlobalAction): GlobalState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };

    case 'SET_USER_PROFILE':
      return {
        ...state,
        userProfile: action.payload,
      };

    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload,
      };

    case 'SET_AUTH_LOADING':
      return {
        ...state,
        authLoading: action.payload,
        loading: {
          ...state.loading,
          auth: action.payload,
        },
      };

    case 'SET_ROLES':
      return {
        ...state,
        roles: action.payload,
      };

    case 'SET_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload,
      };

    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
      };

    case 'SET_SIDEBAR_COLLAPSED':
      return {
        ...state,
        sidebarCollapsed: action.payload,
      };

    case 'SET_MOBILE_MENU_OPEN':
      return {
        ...state,
        mobileMenuOpen: action.payload,
      };

    case 'SET_RESPONSIVE':
      return {
        ...state,
        isMobile: action.payload.isMobile,
        isTablet: action.payload.isTablet,
        isDesktop: action.payload.isDesktop,
        breakpoint: action.payload.breakpoint,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: [
            ...(state.errors[action.payload.key] || []),
            action.payload.error,
          ],
        },
      };

    case 'REMOVE_ERROR':
      const errors = state.errors[action.payload.key] || [];
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.index !== undefined
            ? errors.filter((_, i) => i !== action.payload.index)
            : errors.slice(0, -1),
        },
      };

    case 'CLEAR_ERRORS':
      if (action.payload.key) {
        return {
          ...state,
          errors: {
            ...state.errors,
            [action.payload.key]: [],
          },
        };
      }
      return {
        ...state,
        errors: {
          global: [],
          auth: [],
          profile: [],
          tournaments: [],
          clubs: [],
        },
      };

    case 'SET_FEATURE':
      return {
        ...state,
        features: {
          ...state.features,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

// Context
interface GlobalContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  // Helper functions
  setUser: (user: GlobalState['user']) => void;
  setUserProfile: (profile: GlobalState['userProfile']) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  setRoles: (roles: GlobalState['roles']) => void;
  setPermissions: (permissions: GlobalState['permissions']) => void;
  setTheme: (theme: GlobalState['theme']) => void;
  setLanguage: (language: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setResponsive: (responsive: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    breakpoint: 'mobile' | 'tablet' | 'desktop';
  }) => void;
  setLoading: (key: string, value: boolean) => void;
  addError: (key: string, error: string) => void;
  removeError: (key: string, index?: number) => void;
  clearErrors: (key?: string) => void;
  setFeature: (key: string, value: boolean) => void;
  resetState: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Provider component
interface GlobalStateProviderProps {
  children: React.ReactNode;
  initialStateOverride?: Partial<GlobalState>;
}

export const GlobalStateProvider: React.FC<GlobalStateProviderProps> = ({
  children,
  initialStateOverride,
}) => {
  const [state, dispatch] = useReducer(
    globalReducer,
    { ...initialState, ...initialStateOverride }
  );

  // Helper functions
  const setUser = (user: GlobalState['user']) => 
    dispatch({ type: 'SET_USER', payload: user });

  const setUserProfile = (profile: GlobalState['userProfile']) => 
    dispatch({ type: 'SET_USER_PROFILE', payload: profile });

  const setAuthenticated = (isAuth: boolean) => 
    dispatch({ type: 'SET_AUTHENTICATED', payload: isAuth });

  const setAuthLoading = (loading: boolean) => 
    dispatch({ type: 'SET_AUTH_LOADING', payload: loading });

  const setRoles = (roles: GlobalState['roles']) => 
    dispatch({ type: 'SET_ROLES', payload: roles });

  const setPermissions = (permissions: GlobalState['permissions']) => 
    dispatch({ type: 'SET_PERMISSIONS', payload: permissions });

  const setTheme = (theme: GlobalState['theme']) => 
    dispatch({ type: 'SET_THEME', payload: theme });

  const setLanguage = (language: string) => 
    dispatch({ type: 'SET_LANGUAGE', payload: language });

  const setSidebarCollapsed = (collapsed: boolean) => 
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed });

  const setMobileMenuOpen = (open: boolean) => 
    dispatch({ type: 'SET_MOBILE_MENU_OPEN', payload: open });

  const setResponsive = (responsive: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    breakpoint: 'mobile' | 'tablet' | 'desktop';
  }) => dispatch({ type: 'SET_RESPONSIVE', payload: responsive });

  const setLoading = (key: string, value: boolean) => 
    dispatch({ type: 'SET_LOADING', payload: { key, value } });

  const addError = (key: string, error: string) => 
    dispatch({ type: 'ADD_ERROR', payload: { key, error } });

  const removeError = (key: string, index?: number) => 
    dispatch({ type: 'REMOVE_ERROR', payload: { key, index } });

  const clearErrors = (key?: string) => 
    dispatch({ type: 'CLEAR_ERRORS', payload: { key } });

  const setFeature = (key: string, value: boolean) => 
    dispatch({ type: 'SET_FEATURE', payload: { key, value } });

  const resetState = () => 
    dispatch({ type: 'RESET_STATE' });

  // Responsive breakpoint detection
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      let breakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (isMobile) breakpoint = 'mobile';
      else if (isTablet) breakpoint = 'tablet';

      setResponsive({ isMobile, isTablet, isDesktop, breakpoint });
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  const value: GlobalContextType = {
    state,
    dispatch,
    setUser,
    setUserProfile,
    setAuthenticated,
    setAuthLoading,
    setRoles,
    setPermissions,
    setTheme,
    setLanguage,
    setSidebarCollapsed,
    setMobileMenuOpen,
    setResponsive,
    setLoading,
    addError,
    removeError,
    clearErrors,
    setFeature,
    resetState,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

// Hook to use global state
export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

// Selector hooks for specific parts of state
export const useAuth = () => {
  const { state } = useGlobalState();
  return {
    user: state.user,
    userProfile: state.userProfile,
    isAuthenticated: state.isAuthenticated,
    authLoading: state.authLoading,
  };
};

export const usePermissions = () => {
  const { state } = useGlobalState();
  return {
    roles: state.roles,
    permissions: state.permissions,
  };
};

export const useUI = () => {
  const { state, setTheme, setLanguage, setSidebarCollapsed, setMobileMenuOpen } = useGlobalState();
  return {
    theme: state.theme,
    language: state.language,
    sidebarCollapsed: state.sidebarCollapsed,
    mobileMenuOpen: state.mobileMenuOpen,
    setTheme,
    setLanguage,
    setSidebarCollapsed,
    setMobileMenuOpen,
  };
};

export const useResponsive = () => {
  const { state } = useGlobalState();
  return {
    isMobile: state.isMobile,
    isTablet: state.isTablet,
    isDesktop: state.isDesktop,
    breakpoint: state.breakpoint,
  };
};

export const useLoading = () => {
  const { state, setLoading } = useGlobalState();
  return {
    loading: state.loading,
    setLoading,
  };
};

export const useErrors = () => {
  const { state, addError, removeError, clearErrors } = useGlobalState();
  return {
    errors: state.errors,
    addError,
    removeError,
    clearErrors,
  };
};

export const useFeatures = () => {
  const { state, setFeature } = useGlobalState();
  return {
    features: state.features,
    setFeature,
  };
};

export default GlobalStateProvider;
