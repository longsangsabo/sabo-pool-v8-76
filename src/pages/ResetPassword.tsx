import { Navigate } from 'react-router-dom';

const ResetPassword = () => {
  return <Navigate to='/auth?mode=reset-password' replace />;
};

export default ResetPassword;
