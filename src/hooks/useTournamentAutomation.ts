import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AutomationStatus {
  isActive: boolean;
  lastTriggered: Date | null;
  successCount: number;
  errorCount: number;
  currentStatus: 'idle' | 'processing' | 'error';
}

export const useTournamentAutomation = (tournamentId?: string) => {
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({
    isActive: false,
    lastTriggered: null,
    successCount: 0,
    errorCount: 0,
    currentStatus: 'idle',
  });

  const [isFixing, setIsFixing] = useState(false);

  // Initialize automation status
  useEffect(() => {
    if (!tournamentId) return;

    setAutomationStatus({
      isActive: true,
      lastTriggered: null,
      successCount: 0,
      errorCount: 0,
      currentStatus: 'idle',
    });
  }, [tournamentId]);

  // Enhanced fix function that handles progression issues
  const fixTournamentProgression = async () => {
    if (!tournamentId || isFixing) return;

    setIsFixing(true);
    try {
      console.log('🔧 Starting enhanced tournament progression fix...');

      // First, try the comprehensive fix function
      const { data: fixResult, error: fixError } = await supabase.rpc(
        'fix_all_tournament_progression',
        {
          p_tournament_id: tournamentId,
        }
      );

      if (fixError) {
        console.error('❌ Fix function error:', fixError);
        throw fixError;
      }

      console.log('✅ Fix result:', fixResult);

      // Then check for any remaining issues and force advancement
      const { data: matches, error: matchError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'completed')
        .not('winner_id', 'is', null)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchError) {
        console.error('❌ Error fetching completed matches:', matchError);
        throw matchError;
      }

      // Force advancement for each completed match
      if (matches && matches.length > 0) {
        console.log(
          `🎯 Force advancing ${matches.length} completed matches...`
        );

        // Use the new corrected advance function for the entire tournament
        try {
          const { data: advanceResult, error: advanceError } =
            await supabase.rpc('repair_double_elimination_bracket', {
              p_tournament_id: tournamentId,
            });

          if (advanceError) {
            console.warn(
              `⚠️ Could not advance tournament ${tournamentId}:`,
              advanceError
            );
          } else {
            console.log(
              `✅ Successfully advanced tournament ${tournamentId}:`,
              advanceResult
            );
          }
        } catch (err) {
          console.warn(
            `⚠️ Exception advancing tournament ${tournamentId}:`,
            err
          );
        }
      }

      // Update automation status
      setAutomationStatus(prev => ({
        ...prev,
        lastTriggered: new Date(),
        successCount: prev.successCount + 1,
        currentStatus: 'idle',
      }));

      toast.success('🎯 Tournament progression fixed successfully!');
    } catch (error: any) {
      console.error('❌ Error fixing tournament progression:', error);

      setAutomationStatus(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        currentStatus: 'error',
      }));

      toast.error(`❌ Failed to fix progression: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  // Monitor tournament in real-time and auto-fix issues for double elimination
  useEffect(() => {
    if (!tournamentId) return;

    console.log(
      '🔄 Setting up real-time double elimination automation monitoring...'
    );

    const channel = supabase
      .channel(`tournament_automation_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async payload => {
          console.log('🎯 Tournament match updated:', payload);

          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // If a match was just completed with a winner
          if (
            newRecord.status === 'completed' &&
            newRecord.winner_id &&
            (!oldRecord.winner_id || oldRecord.status !== 'completed')
          ) {
            console.log(
              '🏆 Match completed with winner, trigger should auto-advance...'
            );

            // Update automation status
            setAutomationStatus(prev => ({
              ...prev,
              lastTriggered: new Date(),
              currentStatus: 'processing',
            }));

            // Wait for trigger to process, then verify advancement happened
            setTimeout(async () => {
              try {
                // Check if automation log was created for this match
                const { data: automationLogs } = await supabase
                  .from('tournament_automation_log')
                  .select('*')
                  .eq('tournament_id', tournamentId)
                  .eq('automation_type', 'auto_double_elimination_advancement')
                  .gte('created_at', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (automationLogs && automationLogs.length > 0) {
                  const latestLog = automationLogs[0];
                  console.log('🔍 Found automation log:', latestLog);

                  setAutomationStatus(prev => ({
                    ...prev,
                    successCount:
                      latestLog.status === 'completed'
                        ? prev.successCount + 1
                        : prev.successCount,
                    errorCount:
                      latestLog.status === 'failed'
                        ? prev.errorCount + 1
                        : prev.errorCount,
                    currentStatus:
                      latestLog.status === 'completed' ? 'idle' : 'error',
                  }));

                  if (latestLog.status === 'completed') {
                    toast.success(
                      '🎯 Double elimination automation processed successfully!'
                    );
                  } else {
                    console.warn(
                      '⚠️ Automation failed, triggering manual fix...'
                    );
                    toast.warning(
                      'Automation issue detected, attempting manual fix...'
                    );
                    await fixTournamentProgression();
                  }
                } else {
                  console.warn(
                    '⚠️ No automation log found, triggering manual fix...'
                  );
                  toast.warning(
                    'Automation not triggered, running manual fix...'
                  );
                  await fixTournamentProgression();
                }
              } catch (err) {
                console.error('❌ Error checking automation status:', err);
                setAutomationStatus(prev => ({
                  ...prev,
                  errorCount: prev.errorCount + 1,
                  currentStatus: 'error',
                }));
              }
            }, 3000); // Wait 3 seconds for trigger to process
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up automation monitoring');
      supabase.removeChannel(channel);
    };
  }, [tournamentId, fixTournamentProgression]);

  return {
    automationStatus,
    fixTournamentProgression,
    isFixing,
  };
};
