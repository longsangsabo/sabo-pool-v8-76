import { createBrowserRouter } from 'react-router-dom';
import { CLBManagement } from '../features/CLB/components/CLBManagement';
import { Dashboard } from '../features/CLB/components/Dashboard/Dashboard';

// Legacy imports for backward compatibility
import { ClubManagement } from '../features/club-management/components/ClubManagement';
import { MemberList } from '../features/club-management/components/members/MemberList';
import { TournamentManagement } from '../features/club-management/components/tournament/TournamentManagement';
import { ClubDashboard } from '../features/club-management/components/dashboard/ClubDashboard';

export const router = createBrowserRouter([
  // New CLB routes
  {
    path: '/clb',
    element: <CLBManagement />,
  },
  {
    path: '/clb/dashboard',
    element: <Dashboard clubId="default" />,
  },
  // Legacy routes (for backward compatibility)
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
