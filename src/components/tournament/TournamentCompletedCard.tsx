import React from 'react';
import { useTournamentResults } from '@/hooks/useTournamentResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TournamentCompletedCardProps {
  tournamentId: string;
  tournamentName: string;
  completedAt?: string;
}

export const TournamentCompletedCard: React.FC<
  TournamentCompletedCardProps
> = ({ tournamentId, tournamentName, completedAt }) => {
  const navigate = useNavigate();
  const { results, loading } = useTournamentResults(tournamentId);

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin mr-2' />
            <span>Đang tải kết quả...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topThree = results.slice(0, 3);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className='h-5 w-5 text-yellow-500' />;
      case 2:
        return <Medal className='h-5 w-5 text-gray-400' />;
      case 3:
        return <Award className='h-5 w-5 text-amber-600' />;
      default:
        return null;
    }
  };

  return (
    <Card className='bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-yellow-500' />
            {tournamentName}
          </CardTitle>
          <Badge className='bg-green-100 text-green-800 border-green-200'>
            Đã hoàn thành
          </Badge>
        </div>
        {completedAt && (
          <p className='text-sm text-muted-foreground'>
            Hoàn thành: {new Date(completedAt).toLocaleDateString('vi-VN')}
          </p>
        )}
      </CardHeader>

      <CardContent className='space-y-4'>
        {topThree.length > 0 ? (
          <>
            <div className='space-y-3'>
              {topThree.map(result => (
                <div
                  key={result.user_id}
                  className='flex items-center justify-between p-3 bg-white rounded-lg border'
                >
                  <div className='flex items-center gap-3'>
                    {getPositionIcon(result.final_position)}
                    <span className='font-bold'>#{result.final_position}</span>

                    <Avatar className='h-8 w-8'>
                      <AvatarImage
                        src={result.avatar_url}
                        alt={result.display_name}
                      />
                      <AvatarFallback>
                        {result.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className='font-medium'>{result.display_name}</p>
                      <Badge variant='outline' className='text-xs'>
                        {result.verified_rank}
                      </Badge>
                    </div>
                  </div>

                  <div className='text-right text-sm'>
                    <p className='font-semibold text-purple-600'>
                      +{result.spa_points_earned} SPA
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {result.wins}W-{result.losses}L
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className='flex items-center justify-between pt-4 border-t'>
              <div className='text-sm text-muted-foreground'>
                {results.length} người tham gia
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() => navigate(`/tournaments/${tournamentId}/results`)}
                className='gap-2'
              >
                <Eye className='h-4 w-4' />
                Xem chi tiết
              </Button>
            </div>
          </>
        ) : (
          <div className='text-center text-muted-foreground py-4'>
            <Trophy className='h-12 w-12 mx-auto mb-2 opacity-50' />
            <p>Chưa có kết quả chi tiết</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentCompletedCard;
