// Legacy component - redirects to enhanced version
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to enhanced register page
    navigate('/auth/register', { replace: true });
  }, [navigate]);

  return null; // Component just redirects
};

export default RegisterPage;
