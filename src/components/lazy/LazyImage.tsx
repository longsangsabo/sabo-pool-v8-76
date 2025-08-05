import React, { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export const LazyImage = memo<LazyImageProps>(
  ({
    src,
    alt,
    className,
    placeholder,
    onLoad,
    onError,
    priority = false,
    width,
    height,
    aspectRatio,
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      if (priority) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px 0px', // Start loading 50px before entering viewport
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    // Calculate container styles with fixed dimensions
    const containerStyle: React.CSSProperties = {};
    if (width && height) {
      containerStyle.width = `${width}px`;
      containerStyle.height = `${height}px`;
    } else if (aspectRatio) {
      containerStyle.aspectRatio = aspectRatio;
    }

    const defaultPlaceholder = (
      <Skeleton className={cn('absolute inset-0', className)} />
    );

    return (
      <div
        ref={imgRef}
        className={cn('relative overflow-hidden', className)}
        style={containerStyle}
      >
        {!isLoaded && !hasError && (placeholder || defaultPlaceholder)}

        {isInView && !hasError && (
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
          />
        )}

        {hasError && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm'
            )}
          >
            <span>Không thể tải ảnh</span>
          </div>
        )}
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';
