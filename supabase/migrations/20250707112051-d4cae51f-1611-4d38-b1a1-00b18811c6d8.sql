-- Ensure the notification trigger exists for tournament registrations
DROP TRIGGER IF EXISTS trigger_notify_tournament_registration ON public.tournament_registrations;
CREATE TRIGGER trigger_notify_tournament_registration
AFTER INSERT ON public.tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION public.notify_tournament_registration();

-- Ensure participant count trigger exists
DROP TRIGGER IF EXISTS tournament_participant_count_trigger ON public.tournament_registrations;
CREATE TRIGGER tournament_participant_count_trigger
AFTER INSERT OR DELETE ON public.tournament_registrations
FOR EACH ROW 
EXECUTE FUNCTION public.update_tournament_participant_count();

-- Enable realtime for tournament registrations if not already enabled
ALTER TABLE public.tournament_registrations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.tournament_registrations;