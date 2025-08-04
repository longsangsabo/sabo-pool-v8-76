import React, { useMemo } from 'react';
import { TournamentMatch, Tournament } from '../../types/tournament.types';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface MatchCardProps {
  match: TournamentMatch;
  onUpdateScore: (matchId: string, score: string) => void;
  onUpdateStatus: (matchId: string, status: TournamentMatch['status']) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onUpdateScore, onUpdateStatus }) => {
  return (
    <Card className="p-4 min-w-[300px]">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Trận #{match.match_number}</span>
          <Select
            value={match.status}
            onValueChange={(value: TournamentMatch['status']) => onUpdateStatus(match.id, value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Chưa bắt đầu</SelectItem>
              <SelectItem value="in_progress">Đang diễn ra</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="walkover">Bỏ cuộc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <div className="flex justify-between items-center p-2 bg-muted rounded">
            <span>{match.player1_id || 'TBD'}</span>
            <span className="text-sm font-semibold">{match.score?.split('-')[0] || '0'}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-muted rounded">
            <span>{match.player2_id || 'TBD'}</span>
            <span className="text-sm font-semibold">{match.score?.split('-')[1] || '0'}</span>
          </div>
        </div>

        {match.scheduled_time && (
          <div className="text-sm text-muted-foreground">
            {format(new Date(match.scheduled_time), 'HH:mm dd/MM/yyyy')}
          </div>
        )}

        {match.table_id && (
          <div className="text-sm text-muted-foreground">
            Bàn: {match.table_id}
          </div>
        )}
      </div>
    </Card>
  );
};

interface TournamentBracketProps {
  tournament: Tournament;
  matches: TournamentMatch[];
  onUpdateMatch: (matchId: string, updates: Partial<TournamentMatch>) => void;
}

export function TournamentBracket({ tournament, matches, onUpdateMatch }: TournamentBracketProps) {
  const roundsGrouped = useMemo(() => {
    const grouped = matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, TournamentMatch[]>);

    // Sort matches within each round by match number
    Object.keys(grouped).forEach(round => {
      grouped[Number(round)].sort((a, b) => a.match_number - b.match_number);
    });

    return grouped;
  }, [matches]);

  const handleUpdateScore = (matchId: string, score: string) => {
    onUpdateMatch(matchId, { score });
  };

  const handleUpdateStatus = (matchId: string, status: TournamentMatch['status']) => {
    onUpdateMatch(matchId, { status });
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 p-6 min-w-max">
        {Object.entries(roundsGrouped).map(([round, roundMatches]) => (
          <div key={round} className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold mb-2">
              {round === '1' ? 'Vòng 1' :
               round === '2' ? 'Tứ kết' :
               round === '3' ? 'Bán kết' :
               round === '4' ? 'Chung kết' :
               `Vòng ${round}`}
            </h3>
            <div className="flex flex-col gap-6">
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onUpdateScore={handleUpdateScore}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 border-t">
        <h4 className="font-semibold mb-2">Chú thích</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>TBD - Chưa xác định</div>
          <div>Bỏ cuộc - Đội/người chơi bỏ cuộc</div>
        </div>
      </div>
    </div>
  );
}
