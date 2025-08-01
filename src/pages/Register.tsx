import { Navigate } from 'react-router-dom';

const Register = () => {
  return <Navigate to='/auth?mode=register' replace />;
};

export default Register;
