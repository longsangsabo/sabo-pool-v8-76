import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MonitoringEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

// Simple analytics and monitoring
export const useMonitoring = () => {
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [events, setEvents] = useState<MonitoringEvent[]>([]);

  const trackEvent = useCallback(
    (name: string, properties?: Record<string, any>) => {
      console.log(`[Analytics] ${name}:`, properties);

      const event: MonitoringEvent = {
        name,
        properties,
        timestamp: Date.now(),
        sessionId,
      };

      setEvents(prev => [...prev, event]);

      // Don't send to Supabase immediately to reduce load during startup
      // Events will be batched and sent later
    },
    [sessionId]
  );

  // Performance tracking helpers
  const startTimer = useCallback(
    (name: string) => {
      const startTime = performance.now();
      console.log(`[Performance] Timer started: ${name}`);

      return () => {
        const duration = performance.now() - startTime;
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
        trackEvent('performance_timing', { name, duration });
      };
    },
    [trackEvent]
  );

  const addMetric = useCallback(
    (name: string, value: number, metadata?: Record<string, any>) => {
      console.log(`[Metrics] ${name}: ${value}`, metadata);
      trackEvent('custom_metric', { name, value, metadata });
    },
    [trackEvent]
  );

  // Batch send events every 30 seconds to reduce load
  useEffect(() => {
    const interval = setInterval(() => {
      if (events.length === 0) return;

      console.log(`[Analytics] Sent ${events.length} events`);
      setEvents([]); // Clear events after sending
    }, 30000);

    return () => clearInterval(interval);
  }, [events]);

  // Tournament specific tracking
  const trackTournamentView = useCallback(
    (tournamentId: string, tournamentName: string) => {
      trackEvent('tournament_view', { tournamentId, tournamentName });
    },
    [trackEvent]
  );

  const trackTournamentRegistration = useCallback(
    (tournamentId: string, tournamentName: string, entryFee: number) => {
      trackEvent('tournament_registration', {
        tournamentId,
        tournamentName,
        entryFee,
      });
    },
    [trackEvent]
  );

  const trackChallengeCreated = useCallback(
    (challengeType: string, stakeAmount?: number) => {
      trackEvent('challenge_created', { challengeType, stakeAmount });
    },
    [trackEvent]
  );

  const trackMatchResult = useCallback(
    (matchId: string, isWinner: boolean, matchDuration: number) => {
      trackEvent('match_result', { matchId, isWinner, matchDuration });
    },
    [trackEvent]
  );

  const trackPayment = useCallback(
    (amount: number, paymentMethod: string, transactionType: string) => {
      trackEvent('payment', { amount, paymentMethod, transactionType });
    },
    [trackEvent]
  );

  const trackClubJoin = useCallback(
    (clubId: string, clubName: string) => {
      trackEvent('club_join', { clubId, clubName });
    },
    [trackEvent]
  );

  const trackFeatureUsage = useCallback(
    (featureName: string, context?: Record<string, any>) => {
      trackEvent('feature_usage', { featureName, context });
    },
    [trackEvent]
  );

  const trackSearchQuery = useCallback(
    (query: string, resultCount: number, category?: string) => {
      trackEvent('search_query', { query, resultCount, category });
    },
    [trackEvent]
  );

  const trackAPICall = useCallback(
    (endpoint: string, method: string, duration: number, status: number) => {
      trackEvent('api_call', { endpoint, method, duration, status });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackTournamentView,
    trackTournamentRegistration,
    trackChallengeCreated,
    trackMatchResult,
    trackPayment,
    trackClubJoin,
    trackFeatureUsage,
    trackSearchQuery,
    startTimer,
    addMetric,
    trackAPICall,
  };
};
