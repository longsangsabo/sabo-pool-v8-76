/**
 * Tournament Adapter
 * Utility functions to adapt tournament data from various sources
 * into standardized Tournament objects.
 */
import { Tournament, TournamentStatus, TournamentType } from '../types/tournament';

/**
 * Adapts raw tournament data from API to the Tournament interface
 */
export function adaptTournament(data: any): Tournament {
  return {
    id: data.id || data._id || '',
    name: data.name || data.title || '',
    date: data.date || data.startDate || '',
    location: data.location || data.venue || '',
    status: adaptStatus(data.status),
    participants: data.participants?.length || data.participantCount || 0,
    maxParticipants: data.maxParticipants || data.maxPlayers || 0,
    type: adaptType(data.type)
  };
}

/**
 * Adapts various status strings to standardized TournamentStatus enum
 */
function adaptStatus(status?: string): TournamentStatus {
  if (!status) return TournamentStatus.UPCOMING;
  
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus.includes('ongoing') || 
      normalizedStatus.includes('active') || 
      normalizedStatus.includes('in progress')) {
    return TournamentStatus.ONGOING;
  }
  
  if (normalizedStatus.includes('complete') || 
      normalizedStatus.includes('finished') || 
      normalizedStatus.includes('ended')) {
    return TournamentStatus.COMPLETED;
  }
  
  if (normalizedStatus.includes('cancel') || 
      normalizedStatus.includes('abort')) {
    return TournamentStatus.CANCELLED;
  }
  
  return TournamentStatus.UPCOMING;
}

/**
 * Adapts various tournament type strings to standardized TournamentType enum
 */
function adaptType(type?: string): TournamentType {
  if (!type) return TournamentType.SINGLE_ELIMINATION;
  
  const normalizedType = type.toLowerCase();
  
  if (normalizedType.includes('double')) {
    return TournamentType.DOUBLE_ELIMINATION;
  }
  
  if (normalizedType.includes('round') && normalizedType.includes('robin')) {
    return TournamentType.ROUND_ROBIN;
  }
  
  if (normalizedType.includes('swiss')) {
    return TournamentType.SWISS;
  }
  
  return TournamentType.SINGLE_ELIMINATION;
}
