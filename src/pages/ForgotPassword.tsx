import { Navigate } from 'react-router-dom';

const ForgotPassword = () => {
  return <Navigate to='/auth?mode=forgot-password' replace />;
};

export default ForgotPassword;
