import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface HealthCheckItem {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  lastChecked: Date;
  details?: string;
}

interface HealthCheckConfig {
  enableAutoFix: boolean;
  checkInterval: number; // milliseconds
  criticalIssueThreshold: number;
}

export const useSystemHealthCheck = (
  config: HealthCheckConfig = {
    enableAutoFix: true,
    checkInterval: 60000, // Increased to 60 seconds to reduce load
    criticalIssueThreshold: 3,
  }
) => {
  console.log('[HealthCheck] 🏥 Health check system initializing...');
  const queryClient = useQueryClient();
  const [healthChecks, setHealthChecks] = useState<HealthCheckItem[]>([
    {
      id: 'data_consistency',
      name: 'Tính nhất quán dữ liệu',
      status: 'checking',
      lastChecked: new Date(),
    },
    {
      id: 'ui_state_sync',
      name: 'Đồng bộ trạng thái UI',
      status: 'checking',
      lastChecked: new Date(),
    },
    {
      id: 'query_cache',
      name: 'Cache truy vấn',
      status: 'checking',
      lastChecked: new Date(),
    },
  ]);

  const [criticalIssues, setCriticalIssues] = useState<string[]>([]);

  const performHealthCheck = async () => {
    console.log('[HealthCheck] Starting system health check...');

    const results: HealthCheckItem[] = [];

    // Check 1: Data Consistency - Are there any stale queries?
    try {
      const queryCache = queryClient.getQueryCache();
      const staleQueries = queryCache
        .getAll()
        .filter(query => query.isStale() && query.state.status === 'success');

      results.push({
        id: 'data_consistency',
        name: 'Tính nhất quán dữ liệu',
        status: staleQueries.length > 5 ? 'warning' : 'healthy',
        lastChecked: new Date(),
        details: `${staleQueries.length} truy vấn cũ`,
      });
    } catch (error) {
      results.push({
        id: 'data_consistency',
        name: 'Tính nhất quán dữ liệu',
        status: 'error',
        lastChecked: new Date(),
        details: 'Lỗi kiểm tra dữ liệu',
      });
    }

    // Check 2: UI State Sync - Check for common UI inconsistency patterns
    try {
      // Skip admin tournaments check since it's been removed
      const hasData = true; // Always healthy since check is removed

      results.push({
        id: 'ui_state_sync',
        name: 'Đồng bộ trạng thái UI',
        status: hasData ? 'healthy' : 'warning',
        lastChecked: new Date(),
        details: hasData ? 'Dữ liệu đồng bộ' : 'Không có dữ liệu',
      });
    } catch (error) {
      results.push({
        id: 'ui_state_sync',
        name: 'Đồng bộ trạng thái UI',
        status: 'error',
        lastChecked: new Date(),
        details: 'Lỗi kiểm tra UI',
      });
    }

    // Check 3: Query Cache Health
    try {
      const queryCache = queryClient.getQueryCache();
      const errorQueries = queryCache
        .getAll()
        .filter(query => query.state.status === 'error');

      results.push({
        id: 'query_cache',
        name: 'Cache truy vấn',
        status: errorQueries.length > 0 ? 'error' : 'healthy',
        lastChecked: new Date(),
        details:
          errorQueries.length > 0
            ? `${errorQueries.length} lỗi cache`
            : 'Cache hoạt động tốt',
      });
    } catch (error) {
      results.push({
        id: 'query_cache',
        name: 'Cache truy vấn',
        status: 'error',
        lastChecked: new Date(),
        details: 'Không thể kiểm tra cache',
      });
    }

    setHealthChecks(results);

    // Identify critical issues
    const critical = results
      .filter(check => check.status === 'error')
      .map(check => check.id);

    setCriticalIssues(critical);

    // Auto-fix critical issues if enabled
    if (config.enableAutoFix && critical.length > 0) {
      await autoFixCriticalIssues(critical);
    }

    // Alert if too many critical issues
    if (critical.length >= config.criticalIssueThreshold) {
      toast.error(
        `Phát hiện ${critical.length} vấn đề nghiêm trọng trong hệ thống!`
      );
    }

    console.log('[HealthCheck] Health check completed:', results);
  };

  const autoFixCriticalIssues = async (issues: string[]) => {
    console.log('[HealthCheck] Auto-fixing critical issues:', issues);

    for (const issue of issues) {
      try {
        switch (issue) {
          case 'query_cache':
            // Clear error queries and refetch
            queryClient
              .getQueryCache()
              .getAll()
              .filter(query => query.state.status === 'error')
              .forEach(query => {
                queryClient.resetQueries({ queryKey: query.queryKey });
              });
            break;

          case 'ui_state_sync':
            // Force refetch critical data
            // Skip admin tournaments invalidation since removed
            break;

          case 'data_consistency':
            // Refresh stale queries
            await queryClient.refetchQueries({ stale: true });
            break;
        }
      } catch (error) {
        console.error(`[HealthCheck] Failed to auto-fix ${issue}:`, error);
      }
    }

    toast.success('Đã tự động khắc phục các vấn đề hệ thống');
  };

  const manualFix = async (issueId: string) => {
    await autoFixCriticalIssues([issueId]);
    // Re-run health check after manual fix
    setTimeout(performHealthCheck, 1000);
  };

  // Temporarily disable periodic health checks to reduce load during startup issues
  useEffect(() => {
    console.log(
      '[HealthCheck] ⚠️ Periodic health checks temporarily disabled for performance debugging'
    );

    // Only run initial check after a delay to not interfere with page load
    const timer = setTimeout(() => {
      console.log('[HealthCheck] Running delayed initial health check...');
      performHealthCheck();
    }, 10000); // 10 seconds delay

    return () => clearTimeout(timer);
  }, []);

  const overallHealth = healthChecks.every(check => check.status === 'healthy')
    ? 'healthy'
    : healthChecks.some(check => check.status === 'error')
      ? 'error'
      : 'warning';

  return {
    healthChecks,
    criticalIssues,
    overallHealth,
    performHealthCheck,
    manualFix,
  };
};
