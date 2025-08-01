import { useTournamentGlobal } from '@/contexts/TournamentGlobalContext';
import { useModuleLoading } from '@/contexts/LoadingStateContext';
import { useModuleError } from '@/contexts/ErrorStateContext';

/**
 * Unified hook for tournament operations
 * Replaces multiple scattered tournament hooks
 */
export const useTournament = () => {
  const tournamentGlobal = useTournamentGlobal();
  const { loading: hookLoading, setLoading } = useModuleLoading('tournament');
  const { errors, addError, clearErrors } = useModuleError('tournament');

  return {
    // Tournament data
    ...tournamentGlobal,

    // Loading state specific to this hook
    hookLoading,
    setHookLoading: setLoading,

    // Error state specific to this hook
    hookErrors: errors,
    addHookError: addError,
    clearHookErrors: clearErrors,

    // Combined loading state
    isLoading:
      hookLoading ||
      tournamentGlobal.loading ||
      tournamentGlobal.tournamentsLoading,
  };
};
