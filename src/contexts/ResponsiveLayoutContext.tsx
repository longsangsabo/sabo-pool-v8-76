import React, { createContext, useContext, useEffect, useState } from 'react';

interface ResponsiveLayoutContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

const ResponsiveLayoutContext = createContext<
  ResponsiveLayoutContextType | undefined
>(undefined);

export const useResponsiveLayout = () => {
  const context = useContext(ResponsiveLayoutContext);
  if (!context) {
    throw new Error(
      'useResponsiveLayout must be used within ResponsiveLayoutProvider'
    );
  }
  return context;
};

export const ResponsiveLayoutProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [layoutState, setLayoutState] = useState<ResponsiveLayoutContextType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: 'desktop',
  });

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setLayoutState({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return (
    <ResponsiveLayoutContext.Provider value={layoutState}>
      {children}
    </ResponsiveLayoutContext.Provider>
  );
};
