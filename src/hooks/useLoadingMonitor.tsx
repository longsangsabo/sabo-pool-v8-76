import { useEffect, useState, useCallback } from 'react';

interface LoadingStep {
  name: string;
  timestamp: number;
  duration?: number;
}

export const useLoadingMonitor = (componentName: string) => {
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [startTime] = useState(() => performance.now());

  const logStep = useCallback(
    (stepName: string) => {
      const timestamp = performance.now();
      const duration = timestamp - startTime;

      console.log(
        `[LoadingMonitor] ${componentName} - ${stepName}: ${duration.toFixed(2)}ms`
      );

      setLoadingSteps(prev => [
        ...prev,
        {
          name: stepName,
          timestamp,
          duration,
        },
      ]);
    },
    [componentName, startTime]
  );

  // Auto-log mount and unmount
  useEffect(() => {
    logStep('mounted');

    return () => {
      logStep('unmounted');

      // Summary
      const totalTime = performance.now() - startTime;
      console.log(
        `[LoadingMonitor] ${componentName} total lifecycle: ${totalTime.toFixed(2)}ms`
      );
    };
  }, [logStep, componentName, startTime]);

  // Warning for slow components
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn(
        `[LoadingMonitor] ⚠️ ${componentName} has been active for >3s - potential performance issue`
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [componentName]);

  return { logStep, loadingSteps };
};
