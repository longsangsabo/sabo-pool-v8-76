import { useEffect } from 'react';

interface CLSMonitorProps {
  threshold?: number;
  onLayoutShift?: (value: number, sources: any[]) => void;
  enabled?: boolean;
}

export const CLSMonitor: React.FC<CLSMonitorProps> = ({
  threshold = 0.1,
  onLayoutShift,
  enabled = process.env.NODE_ENV === 'development',
}) => {
  useEffect(() => {
    if (
      !enabled ||
      typeof window === 'undefined' ||
      !('PerformanceObserver' in window)
    ) {
      return;
    }

    let clsValue = 0;
    let sessionValue = 0;
    const sessionEntries: any[] = [];

    const observer = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as any;

        // Only consider layout shifts without recent user input
        if (!layoutShift.hadRecentInput) {
          const shiftValue = layoutShift.value;
          sessionValue += shiftValue;
          clsValue += shiftValue;
          sessionEntries.push(layoutShift);

          // Log significant layout shifts
          if (shiftValue > threshold) {
            console.warn('🚨 Significant layout shift detected:', {
              value: shiftValue.toFixed(4),
              cumulativeValue: clsValue.toFixed(4),
              sources:
                layoutShift.sources?.map((source: any) => ({
                  node: source.node?.tagName || 'unknown',
                  previousRect: source.previousRect,
                  currentRect: source.currentRect,
                })) || [],
              startTime: entry.startTime,
            });

            // Call callback if provided
            onLayoutShift?.(shiftValue, layoutShift.sources || []);
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Report final CLS on page unload
    const reportCLS = () => {
      if (clsValue > 0) {
        console.log(`📊 Final CLS Score: ${clsValue.toFixed(4)}`, {
          rating:
            clsValue <= 0.1
              ? 'Good'
              : clsValue <= 0.25
                ? 'Needs Improvement'
                : 'Poor',
          totalShifts: sessionEntries.length,
        });
      }
    };

    window.addEventListener('beforeunload', reportCLS);

    return () => {
      observer.disconnect();
      window.removeEventListener('beforeunload', reportCLS);
    };
  }, [threshold, onLayoutShift, enabled]);

  // Component doesn't render anything
  return null;
};
