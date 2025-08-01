/**
 * @deprecated This file has been consolidated into DashboardPage.tsx
 *
 * Features from this file have been integrated into the main dashboard:
 * - Dark theme with gradient background
 * - Real stats with specific numbers (ELO: 1,250, Wins: 45, Losses: 12, Rank: #15)
 * - Better color scheme for stats
 *
 * REMOVAL PLAN: This file will be deleted in 2-4 weeks (target: end of month)
 *
 * ACTION REQUIRED: None - all functionality has been moved to DashboardPage.tsx
 *
 * Last updated: January 2025
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard - SABO Pool Arena Hub</title>
        <meta name='description' content='Bảng điều khiển SABO Pool Arena' />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
        {/* Header */}
        <header className='container mx-auto px-4 py-6 flex justify-between items-center border-b border-slate-700'>
          <div className='flex items-center space-x-2'>
            <Target className='h-8 w-8 text-yellow-400' />
            <h1 className='text-2xl font-bold text-white'>SABO Pool Arena</h1>
          </div>
          <div className='flex space-x-4'>
            <Button
              variant='outline'
              className='text-white border-white hover:bg-white hover:text-slate-900'
            >
              Hồ sơ
            </Button>
            <Button className='bg-yellow-400 text-slate-900 hover:bg-yellow-500'>
              Đăng xuất
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className='container mx-auto px-4 py-8'>
          <div className='mb-8'>
            <h1 className='text-4xl font-bold text-white mb-2'>
              Chào mừng trở lại!
            </h1>
            <p className='text-gray-300 text-lg'>
              Sẵn sàng cho những trận đấu mới?
            </p>
          </div>

          {/* Quick Stats */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-yellow-400 text-2xl font-bold'>
                  1,250
                </CardTitle>
                <CardDescription className='text-gray-300'>
                  ELO Rating
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-green-400 text-2xl font-bold'>
                  45
                </CardTitle>
                <CardDescription className='text-gray-300'>
                  Trận thắng
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-red-400 text-2xl font-bold'>
                  12
                </CardTitle>
                <CardDescription className='text-gray-300'>
                  Trận thua
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-purple-400 text-2xl font-bold'>
                  #15
                </CardTitle>
                <CardDescription className='text-gray-300'>
                  Xếp hạng
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Main Actions */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <Trophy className='h-12 w-12 text-yellow-400 mb-4' />
                <CardTitle className='text-white'>Tạo thách đấu</CardTitle>
                <CardDescription className='text-gray-300'>
                  Thách đấu với các tay cơ khác
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className='w-full bg-yellow-400 text-slate-900 hover:bg-yellow-500'>
                  Thách đấu ngay
                </Button>
              </CardContent>
            </Card>

            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <Calendar className='h-12 w-12 text-blue-400 mb-4' />
                <CardTitle className='text-white'>Giải đấu</CardTitle>
                <CardDescription className='text-gray-300'>
                  Tham gia các giải đấu sắp tới
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className='w-full bg-blue-400 text-slate-900 hover:bg-blue-500'>
                  Xem giải đấu
                </Button>
              </CardContent>
            </Card>

            <Card className='bg-slate-800 border-slate-700'>
              <CardHeader>
                <Users className='h-12 w-12 text-green-400 mb-4' />
                <CardTitle className='text-white'>Bảng xếp hạng</CardTitle>
                <CardDescription className='text-gray-300'>
                  Xem thứ hạng của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className='w-full bg-green-400 text-slate-900 hover:bg-green-500'>
                  Xem bảng xếp hạng
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
