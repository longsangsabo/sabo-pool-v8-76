import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

interface FeatureFlags {
  optimizedResponsive: boolean;
  mobileEnhancements: boolean;
  tabletOptimizations: boolean;
  performanceMonitoring: boolean;
  responsiveAnalytics: boolean;
  experimentalLayouts: boolean;
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
  enableFlag: (flag: keyof FeatureFlags) => void;
  disableFlag: (flag: keyof FeatureFlags) => void;
  rolloutPercentage: number;
  userGroup: 'control' | 'treatment';
  environment: 'development' | 'staging' | 'production';
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(
  undefined
);

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
};

interface FeatureFlagsProviderProps {
  children: ReactNode;
  environment?: 'development' | 'staging' | 'production';
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
  environment = 'development',
}) => {
  // Default feature flags configuration
  const [flags, setFlags] = useState<FeatureFlags>({
    optimizedResponsive: true, // Always enabled - core feature
    mobileEnhancements: true, // Mobile optimizations
    tabletOptimizations: true, // Tablet-specific features
    performanceMonitoring: environment !== 'production', // Development only by default
    responsiveAnalytics: false, // Opt-in for production
    experimentalLayouts: environment === 'development', // Development only
  });

  const [rolloutPercentage, setRolloutPercentage] = useState(100);
  const [userGroup, setUserGroup] = useState<'control' | 'treatment'>(
    'treatment'
  );

  // Generate consistent user group based on session
  useEffect(() => {
    const userId = localStorage.getItem('userId') || generateUserId();
    const hash = simpleHash(userId);
    const percentage = hash % 100;

    setUserGroup(percentage < rolloutPercentage ? 'treatment' : 'control');

    // Load feature flags from server/localStorage for production
    if (environment === 'production') {
      loadProductionFlags();
    }
  }, [rolloutPercentage, environment]);

  const generateUserId = (): string => {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', id);
    return id;
  };

  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  const loadProductionFlags = async () => {
    try {
      // In production, load from API
      // const response = await fetch('/api/feature-flags');
      // const productionFlags = await response.json();

      // For demo, load from localStorage
      const savedFlags = localStorage.getItem('featureFlags');
      if (savedFlags) {
        setFlags(JSON.parse(savedFlags));
      }
    } catch (error) {
      console.error('Failed to load production feature flags:', error);
    }
  };

  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    // Core responsive system is always enabled
    if (flag === 'optimizedResponsive') return true;

    // Check user group for gradual rollouts
    if (userGroup === 'control') {
      return ['mobileEnhancements', 'tabletOptimizations'].includes(flag)
        ? false
        : flags[flag];
    }

    return flags[flag];
  };

  const enableFlag = (flag: keyof FeatureFlags) => {
    const newFlags = { ...flags, [flag]: true };
    setFlags(newFlags);

    if (environment === 'production') {
      localStorage.setItem('featureFlags', JSON.stringify(newFlags));
    }

    console.log(`🚀 Feature flag enabled: ${flag}`);
  };

  const disableFlag = (flag: keyof FeatureFlags) => {
    const newFlags = { ...flags, [flag]: false };
    setFlags(newFlags);

    if (environment === 'production') {
      localStorage.setItem('featureFlags', JSON.stringify(newFlags));
    }

    console.log(`🔒 Feature flag disabled: ${flag}`);
  };

  const contextValue: FeatureFlagsContextType = {
    flags,
    isEnabled,
    enableFlag,
    disableFlag,
    rolloutPercentage,
    userGroup,
    environment,
  };

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// HOC for feature flag gated components
export const withFeatureFlag = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  flag: keyof FeatureFlags,
  fallback?: React.ComponentType<P>
) => {
  return (props: P) => {
    const { isEnabled } = useFeatureFlags();

    if (isEnabled(flag)) {
      return <WrappedComponent {...props} />;
    }

    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }

    return null;
  };
};

// Hook for A/B testing
export const useABTest = (testName: string) => {
  const { userGroup, environment } = useFeatureFlags();

  useEffect(() => {
    // Track A/B test exposure
    if (environment === 'production') {
      // Send to analytics
      console.log(`📊 A/B Test Exposure: ${testName} - Group: ${userGroup}`);
    }
  }, [testName, userGroup, environment]);

  return {
    group: userGroup,
    isControl: userGroup === 'control',
    isTreatment: userGroup === 'treatment',
  };
};
