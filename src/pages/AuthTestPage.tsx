import Navigation from '@/components/Navigation';
import AuthTestingDashboard from '@/components/AuthTestingDashboard';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

const AuthTestPage = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation />
      <div className='pt-16'>
        <EmailVerificationBanner />
        <div className='container mx-auto py-8'>
          <AuthTestingDashboard />
        </div>
      </div>
    </div>
  );
};

export default AuthTestPage;
