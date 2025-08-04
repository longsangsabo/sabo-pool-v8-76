export const CLUB_ROLES = {
  ADMIN: 'admin',
  CLUB_OWNER: 'club_owner',
  MEMBER: 'member',
  USER: 'user',
} as const;

export type ClubRole = (typeof CLUB_ROLES)[keyof typeof CLUB_ROLES];

export const ROLE_PERMISSIONS = {
  [CLUB_ROLES.ADMIN]: {
    canManageClub: true,
    canManageMembers: true,
    canManageTournaments: true,
    canVerifyRanks: true,
  },
  [CLUB_ROLES.CLUB_OWNER]: {
    canManageClub: true,
    canManageMembers: true,
    canManageTournaments: true,
    canVerifyRanks: true,
  },
  [CLUB_ROLES.MEMBER]: {
    canManageClub: false,
    canManageMembers: false,
    canManageTournaments: false,
    canVerifyRanks: false,
  },
  [CLUB_ROLES.USER]: {
    canManageClub: false,
    canManageMembers: false,
    canManageTournaments: false,
    canVerifyRanks: false,
  },
} as const;
