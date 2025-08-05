/**
 * React Hook for Automated Migration Management
 * Provides real-time monitoring and control of the automated migration system
 */

import { useState, useEffect, useCallback } from 'react';
import {
  automatedMigrationService,
  runAutomatedPlayerIdMigration,
} from '@/services/AutomatedMigrationService';

interface MigrationStatus {
  queueLength: number;
  isRunning: boolean;
  hasBackgroundProcessor: boolean;
  lastVerification?: Date;
  isComplete?: boolean;
}

interface MigrationStats {
  totalTargets: number;
  completedTargets: number;
  failedTargets: number;
  pendingTargets: number;
}

export const useAutomatedMigration = () => {
  const [status, setStatus] = useState<MigrationStatus>({
    queueLength: 0,
    isRunning: false,
    hasBackgroundProcessor: false,
  });

  const [stats, setStats] = useState<MigrationStats>({
    totalTargets: 0,
    completedTargets: 0,
    failedTargets: 0,
    pendingTargets: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  /**
   * Update migration status
   */
  const updateStatus = useCallback(() => {
    const currentStatus = automatedMigrationService.getMigrationStatus();
    setStatus(prev => ({
      ...prev,
      ...currentStatus,
    }));
  }, []);

  /**
   * Run automated migration
   */
  const runMigration = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLogs([]);

    try {
      // Capture console logs for real-time feedback
      const originalLog = console.log;
      const originalError = console.error;

      console.log = (...args) => {
        setLogs(prev => [...prev, `[INFO] ${args.join(' ')}`]);
        originalLog(...args);
      };

      console.error = (...args) => {
        setLogs(prev => [...prev, `[ERROR] ${args.join(' ')}`]);
        originalError(...args);
      };

      const result = await runAutomatedPlayerIdMigration();

      setStatus(prev => ({
        ...prev,
        isComplete: result?.success || false,
        lastVerification: new Date(),
      }));

      // Restore original console functions
      console.log = originalLog;
      console.error = originalError;

      if (result?.success) {
        setLogs(prev => [
          ...prev,
          '[SUCCESS] ✅ All player_id references have been migrated!',
        ]);
      } else {
        setLogs(prev => [
          ...prev,
          '[INFO] 🔄 Migration partially complete - background processing continues',
        ]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLogs(prev => [
        ...prev,
        `[ERROR] 💥 Migration failed: ${errorMessage}`,
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify migration completion
   */
  const verifyMigration = useCallback(async () => {
    try {
      const result = await automatedMigrationService.verifyMigrationComplete();
      setStatus(prev => ({
        ...prev,
        isComplete: result?.success || false,
        lastVerification: new Date(),
      }));
      return result?.success || false;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Stop migration processes
   */
  const stopMigration = useCallback(() => {
    automatedMigrationService.stop();
    updateStatus();
    setLogs(prev => [...prev, '[INFO] 🛑 Migration processes stopped']);
  }, [updateStatus]);

  /**
   * Clear logs
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
    setError(null);
  }, []);

  /**
   * Get migration health status
   */
  const getHealthStatus = useCallback(() => {
    const { isRunning, hasBackgroundProcessor, queueLength } = status;

    if (status.isComplete) {
      return {
        status: 'complete',
        color: 'green',
        message: 'All migrations completed',
      };
    }

    if (isRunning) {
      return {
        status: 'running',
        color: 'blue',
        message: 'Migration in progress',
      };
    }

    if (hasBackgroundProcessor && queueLength > 0) {
      return {
        status: 'background',
        color: 'yellow',
        message: `${queueLength} items in background queue`,
      };
    }

    if (queueLength > 0) {
      return {
        status: 'pending',
        color: 'orange',
        message: `${queueLength} migrations pending`,
      };
    }

    return { status: 'idle', color: 'gray', message: 'System idle' };
  }, [status]);

  // Update status periodically
  useEffect(() => {
    updateStatus();

    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  // Auto-verify on component mount
  useEffect(() => {
    verifyMigration();
  }, [verifyMigration]);

  return {
    // Status
    status,
    stats,
    isLoading,
    error,
    logs,

    // Actions
    runMigration,
    verifyMigration,
    stopMigration,
    clearLogs,

    // Utilities
    getHealthStatus,

    // Quick status checks
    isComplete: status.isComplete === true,
    isRunning: status.isRunning,
    hasBackgroundQueue: status.hasBackgroundProcessor && status.queueLength > 0,

    // Formatted data
    formattedLogs: logs.slice(-50), // Last 50 logs
    lastVerificationTime: status.lastVerification?.toLocaleTimeString(),
  };
};

export default useAutomatedMigration;
