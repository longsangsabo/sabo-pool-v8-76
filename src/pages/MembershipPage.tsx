import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building } from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';
import {
  IndividualMembershipTab,
  ClubMembershipTab,
} from '@/components/membership';
import { toast } from 'sonner';

const MembershipPage = () => {
  const [activeTab, setActiveTab] = useState('individual');
  const navigate = useNavigate();
  const {
    currentMembership,
    clubRegistration,
    membershipLoading,
    clubLoading,
  } = useMembership();

  const handleUpgrade = async (planType: string, planPrice: number) => {
    try {
      // Redirect to payment page
      navigate(`/payment/membership?plan=${planType}&price=${planPrice}`);
    } catch (error) {
      console.error('Error upgrading membership:', error);
      toast.error('Có lỗi xảy ra khi nâng cấp');
    }
  };

  const handleClubVerification = () => {
    // Navigate to profile page with club tab
    navigate('/profile?tab=club');
  };

  const handleClubUpgrade = async (planType: string, planPrice: number) => {
    if (!clubRegistration || clubRegistration.status !== 'approved') {
      toast.error('Bạn cần xác minh CLB trước khi nâng cấp');
      handleClubVerification();
      return;
    }

    // Redirect to club payment page
    navigate(`/payment/club-membership?plan=${planType}&price=${planPrice}`);
  };

  if (membershipLoading || clubLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-2 text-gray-600'>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Gói hội viên</h1>
          <p className='mt-2 text-gray-600'>
            Chọn gói phù hợp để tận hưởng đầy đủ quyền lợi tại SABO POOL ARENA
          </p>
        </div>

        {/* Tabs */}
        <div className='mb-8'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              <button
                onClick={() => setActiveTab('individual')}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'individual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className='w-4 h-4 mr-2' />
                Cá nhân
              </button>
              <button
                onClick={() => setActiveTab('club')}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'club'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className='w-4 h-4 mr-2' />
                Câu lạc bộ
              </button>
            </nav>
          </div>
        </div>

        {/* Individual Tab */}
        {activeTab === 'individual' && (
          <IndividualMembershipTab
            currentMembership={currentMembership}
            onUpgrade={handleUpgrade}
          />
        )}

        {/* Club Tab */}
        {activeTab === 'club' && (
          <ClubMembershipTab
            clubRegistration={clubRegistration}
            onUpgrade={handleClubUpgrade}
            onVerification={handleClubVerification}
          />
        )}
      </div>
    </div>
  );
};

export default MembershipPage;
