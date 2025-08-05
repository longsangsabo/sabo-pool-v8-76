// Simple mock tournament repository to avoid TypeScript errors
export class TournamentRepository {
  static async createTournament(data: any) {
    console.log('Mock: Creating tournament', data);
    return { id: 'mock-tournament-id', ...data };
  }

  static async getTournaments() {
    return [];
  }

  static async registerPlayer(tournamentId: string, playerId?: string) {
    console.log('Mock: Registering player', tournamentId, playerId);
    return { success: true };
  }

  static async cancelRegistration(tournamentId: string, playerId?: string) {
    console.log('Mock: Canceling registration', tournamentId, playerId);
    return { success: true };
  }

  static async generateBracket(tournamentId: string) {
    console.log('Mock: Generating bracket', tournamentId);
    return { success: true };
  }

  static async updateTournamentResults(tournamentId: string, results?: any) {
    console.log('Mock: Updating tournament results', tournamentId, results);
    return { success: true };
  }

  static async checkUserRegistration(tournamentId: string, userId?: string) {
    console.log('Mock: Checking user registration', tournamentId, userId);
    return { registered: false };
  }
}

export const tournamentRepository = {
  async createTournament(data: any) {
    console.log('Mock: Creating tournament', data);
    return { success: true, data: { id: 'mock-tournament-id', ...data } };
  },

  async updateTournament(id: string, data: any) {
    console.log('Mock: Updating tournament', id, data);
    return { success: true, data: { id, ...data } };
  },

  async getTournament(id: string) {
    console.log('Mock: Getting tournament', id);
    return { success: true, data: { id, name: 'Mock Tournament' } };
  },

  async deleteTournament(id: string) {
    console.log('Mock: Deleting tournament', id);
    return { success: true };
  },

  async generateBracket(tournamentId: string) {
    console.log('Mock: Generating bracket for', tournamentId);
    return { success: true, data: { matches: [] } };
  },
};
