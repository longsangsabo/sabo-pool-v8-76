import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Building, Shield, History } from 'lucide-react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import EditableProfileForm from '@/components/profile/EditableProfileForm';
import ClubManagementTab from '@/components/profile/ClubManagementTab';
import RankVerificationForm from '@/components/RankVerificationForm';
import ActivitiesTab from '@/components/profile/ActivitiesTab';

interface ProfileContentProps {
  profile: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  profile,
  activeTab,
  onTabChange,
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();
  const userRole = profile?.role || 'player';

  const tabs = [
    {
      value: 'activities',
      label: isMobile ? 'Hoạt động' : 'Hoạt động & Thách đấu',
      icon: Trophy,
      content: <ActivitiesTab />,
    },
    {
      value: 'basic',
      label: isMobile ? 'Cá nhân' : 'Thông tin cá nhân',
      icon: User,
      content: <EditableProfileForm profile={profile} />,
    },
    {
      value: 'rank',
      label: isMobile ? 'Hạng' : 'Xác thực hạng',
      icon: Shield,
      content: <RankVerificationForm />,
    },
    {
      value: 'club',
      label: isMobile ? 'CLB' : 'Quản lý CLB',
      icon: Building,
      content: <ClubManagementTab userRole={userRole} />,
    },
  ];

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={onTabChange} className='w-full'>
        <TabsList className={`grid w-full grid-cols-${tabs.length} bg-muted`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground'
              >
                <Icon className='h-4 w-4' />
                <span className={isMobile ? 'text-xs' : ''}>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className='mt-6'>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
