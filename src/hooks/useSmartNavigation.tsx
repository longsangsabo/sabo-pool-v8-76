import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navigateToAdmin = () => {
    navigate('/admin');
  };

  const navigateToClub = () => {
    navigate('/clb');
  };

  const navigateToProfile = () => {
    navigate('/profile');
  };

  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  const navigateToTournaments = () => {
    navigate('/tournaments');
  };

  const navigateToLeaderboard = () => {
    navigate('/leaderboard');
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return {
    navigateToAdmin,
    navigateToClub,
    navigateToProfile,
    navigateToDashboard,
    navigateToTournaments,
    navigateToLeaderboard,
    goBack,
    currentPath: location.pathname,
    user,
  };
};
