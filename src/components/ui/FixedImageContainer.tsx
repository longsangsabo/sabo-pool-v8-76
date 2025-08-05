import React from 'react';
import { cn } from '@/lib/utils';

interface FixedImageContainerProps {
  width: number;
  height: number;
  className?: string;
  children: React.ReactNode;
  aspectRatio?: string;
}

/**
 * Fixed container that prevents layout shift by reserving exact space
 * Use this wrapper for any images that might cause layout shift
 */
export const FixedImageContainer: React.FC<FixedImageContainerProps> = ({
  width,
  height,
  className,
  children,
  aspectRatio,
}) => {
  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
  };

  if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
    // Remove explicit height when using aspect ratio
    delete containerStyle.height;
  }

  return (
    <div
      className={cn('relative overflow-hidden flex-shrink-0', className)}
      style={containerStyle}
    >
      {children}
    </div>
  );
};
