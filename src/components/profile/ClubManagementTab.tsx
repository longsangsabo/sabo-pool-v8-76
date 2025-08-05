import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building,
  UserCheck,
  Shield,
  AlertTriangle,
  ExternalLink,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClubRegistrationMultiStepForm from '@/components/ClubRegistrationMultiStepForm';
import RankVerificationRequests from '@/components/RankVerificationRequests';
import PenaltyManagement from '@/components/PenaltyManagement';
import ClubTournamentManagement from '@/components/ClubTournamentManagement';

interface ClubManagementTabProps {
  userRole: 'player' | 'club_owner' | 'both';
}

const ClubManagementTab: React.FC<ClubManagementTabProps> = ({ userRole }) => {
  const navigate = useNavigate();

  // If user is not a club owner, show registration form directly
  if (userRole === 'player') {
    return (
      <div className='space-y-6'>
        <Card className='bg-card dark:bg-card border-border dark:border-border'>
          <CardContent className='pt-6'>
            <div className='text-center mb-6'>
              <Building className='w-16 h-16 mx-auto mb-4 text-primary' />
              <h2 className='text-2xl font-bold text-card-foreground dark:text-card-foreground mb-2'>
                Đăng ký Câu lạc bộ
              </h2>
              <p className='text-muted-foreground dark:text-muted-foreground'>
                Điền thông tin để đăng ký câu lạc bộ của bạn
              </p>
            </div>
            <ClubRegistrationMultiStepForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card className='bg-card dark:bg-card border-border dark:border-border'>
        <CardContent className='pt-6'>
          <div className='text-center mb-6'>
            <Building className='w-16 h-16 mx-auto mb-4 text-primary' />
            <h2 className='text-2xl font-bold text-card-foreground dark:text-card-foreground mb-2'>
              Quản lý Câu lạc bộ
            </h2>
            <p className='text-muted-foreground dark:text-muted-foreground'>
              Quản lý thành viên, xử lý yêu cầu xác thực và theo dõi hoạt động
              câu lạc bộ
            </p>
          </div>

          <div className='space-y-4'>
            <Card className='bg-secondary/10 dark:bg-secondary/20 border-secondary/30 dark:border-secondary/40'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-card-foreground dark:text-card-foreground'>
                      Quản lý thông tin CLB
                    </h3>
                    <p className='text-sm text-muted-foreground dark:text-muted-foreground'>
                      Cập nhật thông tin câu lạc bộ của bạn
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/club-management')}
                    variant='outline'
                    className='bg-background dark:bg-background border-border dark:border-border hover:bg-secondary dark:hover:bg-secondary/80'
                  >
                    <ExternalLink className='w-4 h-4 mr-2' />
                    Đi tới trang quản lý CLB
                  </Button>
                </div>
              </CardContent>
            </Card>
            <ClubRegistrationMultiStepForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubManagementTab;
