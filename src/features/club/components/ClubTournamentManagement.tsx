import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { TournamentManagementNew } from '@/features/club/components/tournament/TournamentManagementNew';
import { Button } from '@/shared/components/ui/button';
import { Trophy, Calendar, Users, Settings, Plus } from 'lucide-react';

interface ClubTournamentManagementProps {
  clubId?: string;
}

const ClubTournamentManagement: React.FC<ClubTournamentManagementProps> = ({
  clubId,
}) => {
  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl flex items-center'>
            <Trophy className='mr-2 h-5 w-5 text-yellow-500' />
            Tournament Management
          </CardTitle>
          <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
            <Plus className='mr-1 h-4 w-4' />
            New Tournament
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='upcoming'>
          <TabsList className='mb-4'>
            <TabsTrigger value='upcoming' className='flex items-center'>
              <Calendar className='mr-1 h-4 w-4' />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value='active' className='flex items-center'>
              <Trophy className='mr-1 h-4 w-4' />
              Active
            </TabsTrigger>
            <TabsTrigger value='participants' className='flex items-center'>
              <Users className='mr-1 h-4 w-4' />
              Participants
            </TabsTrigger>
            <TabsTrigger value='settings' className='flex items-center'>
              <Settings className='mr-1 h-4 w-4' />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value='upcoming' className='p-0'>
            {/* Tournament Management from Features */}
            <TournamentManagementNew clubId={clubId || '1'} />
          </TabsContent>

          <TabsContent value='active' className='p-0'>
            <div className='p-4 bg-muted/30 rounded-md'>
              <p className='text-center text-muted-foreground'>
                No active tournaments at the moment
              </p>
            </div>
          </TabsContent>

          <TabsContent value='participants' className='p-0'>
            <div className='p-4 bg-muted/30 rounded-md'>
              <p className='text-center text-muted-foreground'>
                Select a tournament to view participants
              </p>
            </div>
          </TabsContent>

          <TabsContent value='settings' className='p-0'>
            <div className='p-4 bg-muted/30 rounded-md'>
              <p className='text-center text-muted-foreground'>
                Tournament settings coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClubTournamentManagement;
