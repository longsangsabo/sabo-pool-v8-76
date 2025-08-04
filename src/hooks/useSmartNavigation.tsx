import { useNavigate } from 'react-router-dom';
import { useUnifiedPermissions } from './useUnifiedPermissions';

export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const { permissions } = useUnifiedPermissions();

  const getDefaultRoute = () => {
    // 🎯 FORCE REDIRECT: Luôn điều hướng đến CLB - user yêu cầu!
    return '/clb';

    // // 🎯 TEMPORARY: Luôn điều hướng đến CLB cho user này
    // if (permissions.isClubOwner || permissions.isClubManager) {
    //   return '/clb';
    // }

    // // Nếu chỉ có Admin role
    // if (permissions.isAdmin && !permissions.isClubOwner && !permissions.isClubManager) {
    //   return '/admin';
    // }

    // // Default fallback
    // return '/dashboard';
  };

  const navigateAfterLogin = () => {
    const route = getDefaultRoute();
    navigate(route);
  };

  const getWelcomeMessage = () => {
    // 🎯 FORCE CLB: Always CLB welcome message
    return 'Chào mừng đến CLB Management! Đang chuyển đến bảng điều khiển CLB...';

    // // 🎯 TEMPORARY: CLB-focused welcome message  
    // if (permissions.isClubOwner || permissions.isClubManager) {
    //   return 'Chào mừng đến với CLB Management! Đang chuyển đến bảng điều khiển CLB...';
    // }
    
    // if (permissions.isAdmin && (permissions.isClubOwner || permissions.isClubManager)) {
    //   return 'Chào mừng! Đang chuyển đến quản lý CLB...';
    // }
    
    // if (permissions.isAdmin) {
    //   return 'Chào mừng Admin! Đang chuyển đến Admin Panel...';
    // }
    
    // if (permissions.isClubOwner) {
    //   return 'Chào mừng Chủ CLB! Đang chuyển đến quản lý CLB...';
    // }
    
    // return 'Chào mừng bạn đã quay trở lại!';
  };

  return {
    navigateAfterLogin,
    getDefaultRoute,
    getWelcomeMessage,
    hasMultipleRoles: permissions.isAdmin && (permissions.isClubOwner || permissions.isClubManager)
  };
};
