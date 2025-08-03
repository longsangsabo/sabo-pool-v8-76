import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchNotificationPopup } from './MatchNotificationPopup';
import { Play } from 'lucide-react';

export const MatchNotificationDemo: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const mockMatch = {
    id: '123',
    tournament_name: 'SABO ARENA Championship 2024',
    round: 'Vòng Chung Kết',
    player1: {
      id: 'user1',
      name: 'Nguyễn Văn A',
      avatar_url: '',
      rank: 'Master',
      elo: 1850,
      is_online: true,
    },
    player2: {
      id: 'user2',
      name: 'Trần Thị B',
      avatar_url: '',
      rank: 'Expert',
      elo: 1720,
      is_online: true,
    },
    start_time: new Date().toISOString(),
    location: 'SABO Billiards Club - Vũng Tàu',
    status: 'final',
    match_format: 'Race to 9',
    head_to_head: {
      player1_wins: 3,
      player2_wins: 2,
    },
  };

  const handleJoinMatch = () => {
    console.log('Joining match...');
    setIsPopupOpen(false);
  };

  const handleViewBracket = () => {
    console.log('Viewing bracket...');
    setIsPopupOpen(false);
  };

  const handlePostpone = () => {
    console.log('Postponing match...');
    setIsPopupOpen(false);
  };

  return (
    <div className='p-6'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle className='text-center'>Match Notification Demo</CardTitle>
        </CardHeader>
        <CardContent className='text-center'>
          <p className='text-muted-foreground mb-4'>
            Click the button below to preview the redesigned match notification
            popup
          </p>
          <Button
            onClick={() => setIsPopupOpen(true)}
            className='bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold'
          >
            <Play className='w-4 h-4 mr-2' />
            Show Match Notification
          </Button>
        </CardContent>
      </Card>

      <MatchNotificationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        match={mockMatch}
        currentUserId='user1'
        onJoinMatch={handleJoinMatch}
        onViewBracket={handleViewBracket}
        onPostpone={handlePostpone}
      />
    </div>
  );
};
