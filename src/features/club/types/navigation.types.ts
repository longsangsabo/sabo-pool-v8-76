export interface TournamentManagement {
  create: {
    path: '/tournaments/create';
    permissions: ['tournament_create'];
  };
  manage: {
    path: '/tournaments/manage';
    permissions: ['tournament_manage'];
  };
  brackets: {
    path: '/tournaments/brackets';
    permissions: ['tournament_manage', 'bracket_manage'];
  };
  results: {
    path: '/tournaments/results';
    permissions: ['tournament_manage'];
  };
}

export interface ChallengeManagement {
  pending: {
    path: '/challenges/pending';
    permissions: ['challenge_verify'];
  };
  verify: {
    path: '/challenges/verify';
    permissions: ['challenge_verify'];
  };
  history: {
    path: '/challenges/history';
    permissions: ['challenge_view'];
  };
}

export interface MemberManagement {
  list: {
    path: '/members/list';
    permissions: ['member_manage'];
  };
  rankings: {
    path: '/members/rankings';
    permissions: ['member_view'];
  };
  activities: {
    path: '/members/activities';
    permissions: ['member_view'];
  };
}

export interface TableManagement {
  status: {
    path: '/tables/status';
    permissions: ['table_manage'];
  };
  bookings: {
    path: '/tables/bookings';
    permissions: ['table_manage'];
  };
  maintenance: {
    path: '/tables/maintenance';
    permissions: ['table_manage'];
  };
}

export interface ClubManagementNavigation {
  tournaments: TournamentManagement;
  challenges: ChallengeManagement;
  members: MemberManagement;
  tables: TableManagement;
  
  // Helper method to check permissions
  hasAccess: (path: string) => boolean;
}
