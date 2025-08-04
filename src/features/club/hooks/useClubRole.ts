import { useCallback, useMemo } from 'react';
import { CLUB_ROLES, ROLE_PERMISSIONS, type ClubRole } from '../constants/roles';

interface UseClubRoleProps {
  userId?: string;
  clubOwnerId?: string;
  isAdmin?: boolean;
  memberRole?: string;
}

export const useClubRole = ({
  userId,
  clubOwnerId,
  isAdmin,
  memberRole,
}: UseClubRoleProps) => {
  const role: ClubRole = useMemo(() => {
    if (isAdmin) return CLUB_ROLES.ADMIN;
    if (userId === clubOwnerId) return CLUB_ROLES.CLUB_OWNER;
    if (memberRole) return CLUB_ROLES.MEMBER;
    return CLUB_ROLES.USER;
  }, [isAdmin, userId, clubOwnerId, memberRole]);

  const permissions = useMemo(() => ROLE_PERMISSIONS[role], [role]);

  const checkPermission = useCallback(
    (permission: keyof typeof ROLE_PERMISSIONS[ClubRole]) => {
      return permissions[permission];
    },
    [permissions]
  );

  return {
    role,
    permissions,
    checkPermission,
    isAdmin: role === CLUB_ROLES.ADMIN,
    isClubOwner: role === CLUB_ROLES.CLUB_OWNER,
    isMember: role === CLUB_ROLES.MEMBER,
  };
};
