import React from 'react';
import EnhancedChallengesPageV2 from './EnhancedChallengesPageV2';

const ChallengesPage: React.FC = () => {
  try {
    return <EnhancedChallengesPageV2 />;
  } catch (error) {
    console.error('Error loading EnhancedChallengesPageV2:', error);
    return (
      <div className='container mx-auto p-6'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Thách đấu</h1>
          <p className='text-muted-foreground'>Đang tải trang thách đấu...</p>
        </div>
      </div>
    );
  }
};

export default ChallengesPage;
