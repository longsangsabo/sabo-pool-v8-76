import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActivitiesTab from '../ActivitiesTab';
import EditableProfileForm from '../EditableProfileForm';
import RankVerificationForm from '@/components/RankVerificationForm';
import ClubManagementTab from '../ClubManagementTab';
import { Activity, User, Award, Building } from 'lucide-react';

interface ArenaProfileContentProps {
  profile: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const ArenaProfileContent: React.FC<ArenaProfileContentProps> = ({
  profile,
  activeTab,
  onTabChange,
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();

  const tabs = [
    {
      value: 'activities',
      label: isMobile ? 'Hoạt động' : 'Hoạt động gần đây',
      icon: Activity,
      content: <ActivitiesTab />,
    },
    {
      value: 'basic',
      label: isMobile ? 'Cơ bản' : 'Thông tin cơ bản',
      icon: User,
      content: <EditableProfileForm profile={profile} />,
    },
    {
      value: 'rank',
      label: isMobile ? 'Xếp hạng' : 'Xác minh xếp hạng',
      icon: Award,
      content: <RankVerificationForm />,
    },
    {
      value: 'club',
      label: isMobile ? 'Club' : 'Quản lý Club',
      icon: Building,
      content: (
        <ClubManagementTab userRole={profile?.active_role || 'player'} />
      ),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs value={activeTab} onValueChange={onTabChange} className='w-full'>
        <TabsList className='grid w-full grid-cols-4 bg-card/30 border border-primary/20 backdrop-blur-sm'>
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='flex items-center space-x-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground hover:text-primary transition-all duration-300'
              >
                <IconComponent className='w-4 h-4' />
                {!isMobile && <span>{tab.label}</span>}
                {isMobile && <span className='text-xs'>{tab.label}</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className='mt-6 animate-fade-in'
          >
            <div className='bg-card/30 border border-primary/20 rounded-lg backdrop-blur-sm p-6'>
              {tab.content}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
