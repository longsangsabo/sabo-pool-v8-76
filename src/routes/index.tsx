import { createBrowserRouter } from 'react-router-dom';
import { CLBManagement } from '../features/CLB/components/CLBManagement';
import { UnifiedDashboard } from '../components/dashboard/UnifiedDashboard';

// Legacy imports for backward compatibility
import { ClubManagement } from '../features/club-management/components/ClubManagement';
import { MemberList } from '../features/club-management/components/members/MemberList';
import { TournamentManagement } from '../features/club-management/components/tournament/TournamentManagement';
import { ClubDashboard } from '../features/club-management/components/dashboard/ClubDashboard';

export const router = createBrowserRouter([
  // Unified Dashboard (main entry point)
  {
    path: '/dashboard',
    element: <UnifiedDashboard />,
  },
  // New CLB routes (preferred)
  {
    path: '/clb',
    element: <CLBManagement />,
  },
  // Legacy routes (backward compatibility)
  {
    path: '/club-management',
    element: <ClubManagement />,
    children: [
      {
        path: '',
        element: <ClubDashboard clubId="default" />,
      },
      {
        path: 'members',
        element: <MemberList clubId="default" />,
      },
      {
        path: 'tournaments',
        element: <TournamentManagement />,
      },
    ],
  },
]);
