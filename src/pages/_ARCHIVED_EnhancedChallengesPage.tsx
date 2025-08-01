import React from 'react';
import { ArrowLeft, Zap, Users, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import EnhancedChallengesList from '@/components/EnhancedChallengesList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EnhancedChallengesPage = () => {
  const navigate = useNavigate();

  <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50'>
    {/* Header */}
    <div className='bg-white shadow-sm'>
      <div className='flex items-center justify-between p-4'>
        <Button variant='ghost' size='sm' onClick={() => navigate(-1)}>
          <ArrowLeft className='w-5 h-5 mr-2' />
          Quay lại
        </Button>
        <h1 className='text-xl font-bold text-gray-900'>Thách Đấu</h1>
        <Button
          size='sm'
          onClick={() => navigate('/discovery')}
          className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        >
          <Target className='w-4 h-4 mr-2' />
          Tìm đối thủ
        </Button>
      </div>
    </div>

    {/* Quick Stats */}
    <div className='p-4'>
      <div className='grid grid-cols-3 gap-4 mb-6'>
        <Card className='text-center'>
          <CardContent className='p-4'>
            <Zap className='w-8 h-8 text-yellow-500 mx-auto mb-2' />
            <div className='text-lg font-bold text-gray-900'>12</div>
            <div className='text-xs text-gray-500'>Đã thắng</div>
          </CardContent>
        </Card>
        <Card className='text-center'>
          <CardContent className='p-4'>
            <Users className='w-8 h-8 text-blue-500 mx-auto mb-2' />
            <div className='text-lg font-bold text-gray-900'>8</div>
            <div className='text-xs text-gray-500'>Đã thua</div>
          </CardContent>
        </Card>
        <Card className='text-center'>
          <CardContent className='p-4'>
            <Target className='w-8 h-8 text-green-500 mx-auto mb-2' />
            <div className='text-lg font-bold text-gray-900'>60%</div>
            <div className='text-xs text-gray-500'>Tỷ lệ thắng</div>
          </CardContent>
        </Card>
      </div>

      {/* Challenges List */}
      <EnhancedChallengesList />
    </div>
  </div>;
};

export default EnhancedChallengesPage;
