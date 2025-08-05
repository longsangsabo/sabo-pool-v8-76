/**
 * Image optimization utilities and components
 * Provides progressive loading and responsive images
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

// Progressive image component with lazy loading
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className,
  placeholderSrc,
  loading = 'lazy',
  sizes,
  priority = false,
  width,
  height,
  aspectRatio,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Generate responsive image sources
  const generateSrcSet = useCallback((baseSrc: string) => {
    const sizes = [400, 800, 1200, 1600];
    return sizes.map(size => `${baseSrc}?w=${size}&q=80 ${size}w`).join(', ');
  }, []);

  // Calculate container styles with fixed dimensions
  const containerStyle: React.CSSProperties = {};
  if (width && height) {
    containerStyle.width = `${width}px`;
    containerStyle.height = `${height}px`;
  } else if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
  }

  if (error) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground text-sm',
          className
        )}
        style={containerStyle}
      >
        Không thể tải ảnh
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={containerStyle}
    >
      {/* Placeholder */}
      {(!isLoaded || !isInView) && (
        <div
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            placeholderSrc && 'bg-cover bg-center'
          )}
          style={
            placeholderSrc
              ? { backgroundImage: `url(${placeholderSrc})` }
              : undefined
          }
        />
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          srcSet={generateSrcSet(src)}
          sizes={
            sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          }
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
};

// Optimized avatar component
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}) => {
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const sizePx = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  };

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const fallbackText = fallback || alt.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{
        width: `${sizePx[size].width}px`,
        height: `${sizePx[size].height}px`,
      }}
    >
      {/* Skeleton placeholder */}
      {src && !isLoaded && !error && (
        <div className='absolute inset-0 bg-muted animate-pulse rounded-full' />
      )}

      {src && !error ? (
        <img
          src={src}
          alt={alt}
          width={sizePx[size].width}
          height={sizePx[size].height}
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            'absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-200',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading='lazy'
        />
      ) : (
        <span className='text-sm font-medium text-muted-foreground absolute inset-0 flex items-center justify-center'>
          {fallbackText}
        </span>
      )}
    </div>
  );
};

// Image preloader utility
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(
      url =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        })
    )
  );
};

// Hook for image optimization
export const useImageOptimization = () => {
  const preloadCriticalImages = useCallback((images: string[]) => {
    if (typeof window !== 'undefined') {
      images.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });
    }
  }, []);

  const optimizeImageUrl = useCallback(
    (src: string, width?: number, quality = 80) => {
      if (!src) return '';

      // Add optimization parameters if URL supports it
      const url = new URL(src, window.location.origin);
      if (width) url.searchParams.set('w', width.toString());
      url.searchParams.set('q', quality.toString());

      return url.toString();
    },
    []
  );

  return {
    preloadCriticalImages,
    optimizeImageUrl,
  };
};
