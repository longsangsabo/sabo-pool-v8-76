import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  Target,
  Hash,
  Clock,
  Gavel,
  Medal,
  Star,
  Crown,
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  seed: number;
}

interface Match {
  id: string;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  round: number;
}

interface TournamentBracket16Props {
  tournamentName?: string;
  players?: Player[];
  onMatchClick?: (match: Match) => void;
}

const TournamentBracket16: React.FC<TournamentBracket16Props> = ({
  tournamentName = 'Giải đấu Bi-a',
  players = [],
  onMatchClick,
}) => {
  // Generate initial matches for 16 players
  const generateInitialMatches = (): Match[] => {
    const matches: Match[] = [];

    // Round 1 - Round of 16 (8 matches)
    for (let i = 0; i < 8; i++) {
      const player1 = players[i * 2] || null;
      const player2 = players[i * 2 + 1] || null;

      matches.push({
        id: `r1-m${i + 1}`,
        matchNumber: i + 1,
        player1,
        player2,
        winner: null,
        round: 1,
      });
    }

    // Round 2 - Quarterfinals (4 matches)
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: `r2-m${i + 1}`,
        matchNumber: i + 9,
        player1: null,
        player2: null,
        winner: null,
        round: 2,
      });
    }

    // Round 3 - Semifinals (2 matches)
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: `r3-m${i + 1}`,
        matchNumber: i + 13,
        player1: null,
        player2: null,
        winner: null,
        round: 3,
      });
    }

    // Round 4 - Finals (2 matches: 3rd place + final)
    matches.push({
      id: 'bronze',
      matchNumber: 15,
      player1: null,
      player2: null,
      winner: null,
      round: 4,
    });

    matches.push({
      id: 'final',
      matchNumber: 16,
      player1: null,
      player2: null,
      winner: null,
      round: 4,
    });

    return matches;
  };

  const [matches] = useState<Match[]>(generateInitialMatches());

  const MatchCard: React.FC<{
    match: Match;
    isFinal?: boolean;
    isBronze?: boolean;
  }> = ({ match, isFinal = false, isBronze = false }) => {
    const cardClasses = `
      relative bg-gradient-to-br from-background to-muted/20 
      border-2 rounded-xl p-4 transition-all duration-300 
      hover:shadow-lg hover:-translate-y-1 cursor-pointer
      ${isFinal ? 'border-gradient-primary bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-500' : ''}
      ${isBronze ? 'border-amber-600 bg-gradient-to-br from-amber-50 to-amber-100' : 'border-border hover:border-primary'}
    `;

    return (
      <Card className={cardClasses} onClick={() => onMatchClick?.(match)}>
        <CardContent className='p-0'>
          <Badge
            variant={isFinal ? 'default' : isBronze ? 'secondary' : 'outline'}
            className={`absolute -top-2 left-3 px-2 py-1 text-xs font-bold
              ${isFinal ? 'bg-yellow-500 text-yellow-900' : ''}
              ${isBronze ? 'bg-amber-600 text-amber-100' : ''}
            `}
          >
            {isFinal
              ? 'CHUNG KẾT'
              : isBronze
                ? 'TRANH HẠNG 3'
                : `Trận ${match.matchNumber}`}
          </Badge>

          <div className='mt-4 space-y-2'>
            <div
              className={`p-2 rounded-lg border-l-4 ${
                match.player1
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-muted border-muted-foreground'
              }`}
            >
              <div className='text-sm font-medium'>
                {match.player1 ? `🎱 ${match.player1.name}` : '⏳ Chờ kết quả'}
              </div>
            </div>

            <div className='text-center text-xs font-bold text-primary'>VS</div>

            <div
              className={`p-2 rounded-lg border-l-4 ${
                match.player2
                  ? 'bg-purple-50 border-purple-400'
                  : 'bg-muted border-muted-foreground'
              }`}
            >
              <div className='text-sm font-medium'>
                {match.player2 ? `🎱 ${match.player2.name}` : '⏳ Chờ kết quả'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const InfoCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string;
  }> = ({ icon, title, value }) => (
    <Card className='bg-gradient-subtle border-border'>
      <CardContent className='p-4'>
        <div className='flex items-center gap-3'>
          <div className='text-primary'>{icon}</div>
          <div>
            <div className='text-sm text-muted-foreground'>{title}</div>
            <div className='font-semibold text-foreground'>{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='max-w-7xl mx-auto p-6 space-y-8'>
      {/* Header */}
      <Card className='bg-gradient-primary text-primary-foreground'>
        <CardContent className='p-8 text-center'>
          <div className='flex items-center justify-center gap-3 mb-4'>
            <Trophy className='w-8 h-8' />
            <h1 className='text-3xl font-bold'>{tournamentName}</h1>
          </div>
          <p className='text-lg opacity-90'>
            16 Người chơi - Loại trực tiếp (Single Elimination)
          </p>
        </CardContent>
      </Card>

      {/* Tournament Info */}
      <Card className='border-primary/20'>
        <CardContent className='p-6'>
          <h3 className='text-xl font-bold text-foreground mb-4 flex items-center gap-2'>
            <Target className='w-5 h-5 text-primary' />
            Thông tin giải đấu
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <InfoCard
              icon={<Users className='w-5 h-5' />}
              title='Số người chơi'
              value='16'
            />
            <InfoCard
              icon={<Target className='w-5 h-5' />}
              title='Loại giải'
              value='Loại trực tiếp'
            />
            <InfoCard
              icon={<Hash className='w-5 h-5' />}
              title='Tổng số vòng'
              value='4 vòng'
            />
            <InfoCard
              icon={<Trophy className='w-5 h-5' />}
              title='Tổng số trận'
              value='16 trận'
            />
          </div>
        </CardContent>
      </Card>

      {/* Tournament Bracket */}
      <Card>
        <CardContent className='p-6'>
          <h3 className='text-xl font-bold text-foreground mb-6 text-center'>
            🏆 SƠ ĐỒ GIẢI ĐẤU
          </h3>

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Round 1 - Round of 16 */}
            <div className='space-y-4'>
              <Card className='bg-primary/10 border-primary/30'>
                <CardContent className='p-3 text-center'>
                  <h4 className='font-bold text-primary'>🥊 VÒNG 1/8</h4>
                  <p className='text-xs text-muted-foreground'>(8 trận)</p>
                </CardContent>
              </Card>

              <div className='space-y-3'>
                {matches
                  .filter(m => m.round === 1)
                  .map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
              </div>
            </div>

            {/* Round 2 - Quarterfinals */}
            <div className='space-y-4'>
              <Card className='bg-primary/10 border-primary/30'>
                <CardContent className='p-3 text-center'>
                  <h4 className='font-bold text-primary'>🏆 TỨ KẾT</h4>
                  <p className='text-xs text-muted-foreground'>(4 trận)</p>
                </CardContent>
              </Card>

              <div className='space-y-8 mt-8'>
                {matches
                  .filter(m => m.round === 2)
                  .map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
              </div>
            </div>

            {/* Round 3 - Semifinals */}
            <div className='space-y-4'>
              <Card className='bg-primary/10 border-primary/30'>
                <CardContent className='p-3 text-center'>
                  <h4 className='font-bold text-primary'>🥇 BÁN KẾT</h4>
                  <p className='text-xs text-muted-foreground'>(2 trận)</p>
                </CardContent>
              </Card>

              <div className='space-y-16 mt-16'>
                {matches
                  .filter(m => m.round === 3)
                  .map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
              </div>
            </div>

            {/* Round 4 - Finals */}
            <div className='space-y-4'>
              <Card className='bg-primary/10 border-primary/30'>
                <CardContent className='p-3 text-center'>
                  <h4 className='font-bold text-primary'>👑 CHUNG KẾT</h4>
                  <p className='text-xs text-muted-foreground'>(2 trận)</p>
                </CardContent>
              </Card>

              <div className='space-y-8 mt-16'>
                <MatchCard
                  match={matches.find(m => m.id === 'bronze')!}
                  isBronze={true}
                />
                <MatchCard
                  match={matches.find(m => m.id === 'final')!}
                  isFinal={true}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Podium */}
      <Card className='bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'>
        <CardContent className='p-8'>
          <h3 className='text-2xl font-bold text-center mb-6 text-yellow-800'>
            🏆 BẢNG XẾP HẠNG CUỐI
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 text-yellow-900'>
              <CardContent className='p-4 text-center'>
                <div className='text-3xl mb-2'>🥇</div>
                <div className='font-bold'>NHẤT GIẢI</div>
                <div className='text-sm'>Thắng Chung kết</div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500 text-gray-700'>
              <CardContent className='p-4 text-center'>
                <div className='text-3xl mb-2'>🥈</div>
                <div className='font-bold'>NHÌ GIẢI</div>
                <div className='text-sm'>Thua Chung kết</div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-amber-600 to-amber-700 border-amber-800 text-amber-100'>
              <CardContent className='p-4 text-center'>
                <div className='text-3xl mb-2'>🥉</div>
                <div className='font-bold'>BA GIẢI</div>
                <div className='text-sm'>Thắng Tranh hạng 3</div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 text-gray-600'>
              <CardContent className='p-4 text-center'>
                <div className='text-3xl mb-2'>4️⃣</div>
                <div className='font-bold'>HẠNG 4</div>
                <div className='text-sm'>Thua Tranh hạng 3</div>
              </CardContent>
            </Card>
          </div>

          <p className='text-center mt-6 text-yellow-800'>
            🎱 Giải đấu có tranh hạng 3-4 để xác định đầy đủ thứ hạng!
          </p>
        </CardContent>
      </Card>

      {/* Prize Distribution */}
      <Card className='border-primary/20'>
        <CardContent className='p-6'>
          <h3 className='text-xl font-bold text-foreground mb-4 flex items-center gap-2'>
            <Medal className='w-5 h-5 text-primary' />
            Cơ cấu giải thưởng
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
            <InfoCard
              icon={<Crown className='w-5 h-5 text-yellow-500' />}
              title='🥇 Nhất giải'
              value='Vô địch'
            />
            <InfoCard
              icon={<Medal className='w-5 h-5 text-gray-400' />}
              title='🥈 Nhì giải'
              value='Á quân'
            />
            <InfoCard
              icon={<Medal className='w-5 h-5 text-amber-600' />}
              title='🥉 Ba giải'
              value='Thắng tranh hạng 3'
            />
            <InfoCard
              icon={<Star className='w-5 h-5 text-gray-500' />}
              title='4️⃣ Hạng 4'
              value='Thua tranh hạng 3'
            />
            <InfoCard
              icon={<Trophy className='w-5 h-5 text-green-600' />}
              title='🏆 Top 8'
              value='Vào tứ kết'
            />
          </div>
        </CardContent>
      </Card>

      {/* Tournament Rules */}
      <Card className='border-primary/20'>
        <CardContent className='p-6'>
          <h3 className='text-xl font-bold text-foreground mb-4 flex items-center gap-2'>
            <Gavel className='w-5 h-5 text-primary' />
            Luật thi đấu
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <InfoCard
              icon={<Target className='w-5 h-5' />}
              title='🎱 Môn thi đấu'
              value='Bi-a 8 bi'
            />
            <InfoCard
              icon={<Clock className='w-5 h-5' />}
              title='⏱️ Thời gian trận'
              value='45 phút/trận'
            />
            <InfoCard
              icon={<Trophy className='w-5 h-5' />}
              title='🏁 Điều kiện thắng'
              value='Best of 3 games'
            />
            <InfoCard
              icon={<Gavel className='w-5 h-5' />}
              title='⚖️ Trọng tài'
              value='Có trọng tài chính thức'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentBracket16;
