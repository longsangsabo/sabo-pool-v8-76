import { useEffect, useRef } from 'react';

interface LayoutStabilityOptions {
  width?: number;
  height?: number;
  aspectRatio?: string;
  reserveSpace?: boolean;
}

export const useLayoutStability = (options: LayoutStabilityOptions = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height, aspectRatio, reserveSpace = true } = options;

  useEffect(() => {
    if (!containerRef.current || !reserveSpace) return;

    const element = containerRef.current;

    // Set explicit dimensions to prevent layout shift
    if (width && height) {
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
    } else if (aspectRatio) {
      element.style.aspectRatio = aspectRatio;
    }

    // Ensure position is relative for proper layout
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }
  }, [width, height, aspectRatio, reserveSpace]);

  const getContainerStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (width && height) {
      style.width = `${width}px`;
      style.height = `${height}px`;
    } else if (aspectRatio) {
      style.aspectRatio = aspectRatio;
    }

    return style;
  };

  return {
    containerRef,
    containerStyle: getContainerStyle(),
  };
};

// Hook for preloading critical images to prevent layout shift
export const useImagePreloader = (images: string[]) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !images.length) return;

    const preloadPromises = images.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;

        // Add preload link to head
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });
    });

    Promise.allSettled(preloadPromises).then(results => {
      const failed = results.filter(result => result.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`Failed to preload ${failed.length} images`);
      }
    });
  }, [images]);
};

// Hook for detecting and logging layout shifts
export const useLayoutShiftDetector = (
  enabled: boolean = process.env.NODE_ENV === 'development'
) => {
  useEffect(() => {
    if (
      !enabled ||
      typeof window === 'undefined' ||
      !('PerformanceObserver' in window)
    ) {
      return;
    }

    let clsValue = 0;
    const clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        // Only consider layout shifts without recent user input
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);

          // Log significant layout shifts
          if ((entry as any).value > 0.1) {
            console.warn('Significant layout shift detected:', {
              value: (entry as any).value,
              sources: (entry as any).sources,
              startTime: entry.startTime,
            });
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    return () => {
      observer.disconnect();
      if (clsValue > 0.1) {
        console.warn(`Total CLS score: ${clsValue.toFixed(4)}`);
      }
    };
  }, [enabled]);
};
