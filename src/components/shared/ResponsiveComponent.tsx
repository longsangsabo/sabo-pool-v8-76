import React from 'react';
import { responsiveClasses } from '@/hooks/useOptimizedResponsive';

interface ResponsiveComponentProps {
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
  className?: string;
}

export const ResponsiveComponent: React.FC<ResponsiveComponentProps> = ({
  mobile,
  tablet,
  desktop,
  className = '',
}) => {
  return (
    <div className={className}>
      {/* Mobile version */}
      {mobile && <div className={responsiveClasses.mobileOnly}>{mobile}</div>}

      {/* Tablet version */}
      {tablet && <div className={responsiveClasses.tabletOnly}>{tablet}</div>}

      {/* Desktop version */}
      {desktop && (
        <div className={responsiveClasses.desktopOnly}>{desktop}</div>
      )}
    </div>
  );
};
