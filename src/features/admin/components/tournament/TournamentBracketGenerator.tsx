import React, { useState } from 'react';
import { 
  GitBranch, 
  Users, 
  Shuffle, 
  Play, 
  Trophy,
  Target,
  ArrowRight,
  Crown,
  Star,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AdminTournament } from '@/hooks/admin/useAdminData';

interface TournamentMatch {
  match_id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player1_name?: string;
  player1_seed?: number;
  player2_id?: string;
  player2_name?: string;
  player2_seed?: number;
  winner_id?: string;
  winner_name?: string;
  status: 'pending' | 'ongoing' | 'completed' | 'bye';
  score_p1?: number;
  score_p2?: number;
  scheduled_time?: string;
  completed_time?: string;
}

interface TournamentBracketGeneratorProps {
  tournament: AdminTournament;
  isOpen: boolean;
  onClose: () => void;
}

const TournamentBracketGenerator = ({ tournament, isOpen, onClose }: TournamentBracketGeneratorProps) => {
  const [bracketType, setBracketType] = useState<'single' | 'double'>('single');
  const [seedingMethod, setSeedingMethod] = useState<'elo' | 'random' | 'manual'>('elo');
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [bracketGenerated, setBracketGenerated] = useState(false);

  // Mock participants data (would come from API)
  const participants = [
    { id: 'P001', name: 'Nguyễn Văn A', elo: 1850, seed: 1 },
    { id: 'P002', name: 'Trần Thị B', elo: 1720, seed: 2 },
    { id: 'P003', name: 'Lê Văn C', elo: 1680, seed: 3 },
    { id: 'P004', name: 'Phạm Văn D', elo: 1590, seed: 4 },
    { id: 'P005', name: 'Hoàng Thị E', elo: 1560, seed: 5 },
    { id: 'P006', name: 'Vũ Văn F', elo: 1520, seed: 6 },
    { id: 'P007', name: 'Đặng Thị G', elo: 1480, seed: 7 },
    { id: 'P008', name: 'Bùi Văn H', elo: 1450, seed: 8 },
  ];

  const generateSingleEliminationBracket = () => {
    const numParticipants = participants.length;
    const numRounds = Math.ceil(Math.log2(numParticipants));
    const newMatches: TournamentMatch[] = [];

    // Sort participants by seeding method
    let sortedParticipants = [...participants];
    if (seedingMethod === 'elo') {
      sortedParticipants.sort((a, b) => b.elo - a.elo);
    } else if (seedingMethod === 'random') {
      sortedParticipants = sortedParticipants.sort(() => Math.random() - 0.5);
    }

    // Generate first round matches
    const firstRoundMatches = Math.ceil(numParticipants / 2);
    
    for (let i = 0; i < firstRoundMatches; i++) {
      const player1 = sortedParticipants[i * 2];
      const player2 = sortedParticipants[i * 2 + 1];
      
      const match: TournamentMatch = {
        match_id: `R1M${i + 1}`,
        round: 1,
        match_number: i + 1,
        player1_id: player1.id,
        player1_name: player1.name,
        player1_seed: player1.seed,
        player2_id: player2?.id,
        player2_name: player2?.name,
        player2_seed: player2?.seed,
        status: player2 ? 'pending' : 'bye',
      };

      // If odd number of participants, last player gets a bye
      if (!player2) {
        match.winner_id = player1.id;
        match.winner_name = player1.name;
        match.status = 'bye';
      }

      newMatches.push(match);
    }

    // Generate subsequent rounds (placeholder matches)
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.ceil(firstRoundMatches / Math.pow(2, round - 1));
      
      for (let i = 0; i < matchesInRound; i++) {
        const match: TournamentMatch = {
          match_id: `R${round}M${i + 1}`,
          round,
          match_number: i + 1,
          status: 'pending',
        };
        newMatches.push(match);
      }
    }

    setMatches(newMatches);
    setBracketGenerated(true);
    toast.success('Đã tạo bracket single elimination thành công!');
  };

  const generateDoubleEliminationBracket = () => {
    // Simplified double elimination for demo
    generateSingleEliminationBracket();
    toast.success('Đã tạo bracket double elimination thành công!');
  };

  const generateBracket = () => {
    if (bracketType === 'single') {
      generateSingleEliminationBracket();
    } else {
      generateDoubleEliminationBracket();
    }
  };

  const updateMatchResult = (matchId: string, winnerId: string, winnerName: string, scoreP1: number, scoreP2: number) => {
    setMatches(prev => prev.map(match => 
      match.match_id === matchId 
        ? { 
            ...match, 
            winner_id: winnerId, 
            winner_name: winnerName,
            score_p1: scoreP1,
            score_p2: scoreP2,
            status: 'completed',
            completed_time: new Date().toISOString()
          }
        : match
    ));
    
    // Advance winner to next round
    advanceWinnerToNextRound(matchId, winnerId, winnerName);
  };

  const advanceWinnerToNextRound = (currentMatchId: string, winnerId: string, winnerName: string) => {
    const currentMatch = matches.find(m => m.match_id === currentMatchId);
    if (!currentMatch) return;

    const nextRound = currentMatch.round + 1;
    const nextMatchNumber = Math.ceil(currentMatch.match_number / 2);
    const nextMatchId = `R${nextRound}M${nextMatchNumber}`;
    
    setMatches(prev => prev.map(match => {
      if (match.match_id === nextMatchId) {
        // Determine if winner goes to player1 or player2 slot
        const isEvenMatch = currentMatch.match_number % 2 === 0;
        
        if (isEvenMatch) {
          return {
            ...match,
            player2_id: winnerId,
            player2_name: winnerName,
          };
        } else {
          return {
            ...match,
            player1_id: winnerId,
            player1_name: winnerName,
          };
        }
      }
      return match;
    }));
  };

  const getRoundMatches = (round: number) => {
    return matches.filter(match => match.round === round);
  };

  const maxRounds = Math.max(...matches.map(m => m.round));

  const MatchCard = ({ match }: { match: TournamentMatch }) => (
    <Card className="w-64 mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">
            {match.status === 'bye' ? 'BYE' : `Trận ${match.match_number}`}
          </CardTitle>
          <Badge variant={
            match.status === 'completed' ? 'default' : 
            match.status === 'ongoing' ? 'secondary' : 
            match.status === 'bye' ? 'outline' : 'secondary'
          }>
            {match.status === 'completed' ? 'Hoàn thành' :
             match.status === 'ongoing' ? 'Đang đấu' :
             match.status === 'bye' ? 'BYE' : 'Chờ đấu'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Player 1 */}
          <div className={`flex justify-between items-center p-2 rounded ${
            match.winner_id === match.player1_id ? 'bg-green-100 border-green-300' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2">
              {match.player1_seed && (
                <Badge variant="outline" className="text-xs w-6 h-6 rounded-full p-0 flex items-center justify-center">
                  {match.player1_seed}
                </Badge>
              )}
              <span className="font-medium text-sm">
                {match.player1_name || 'TBD'}
              </span>
            </div>
            {match.status === 'completed' && (
              <span className="font-bold">{match.score_p1}</span>
            )}
          </div>

          {/* VS */}
          {match.status !== 'bye' && (
            <div className="text-center text-xs text-gray-400">VS</div>
          )}

          {/* Player 2 */}
          {match.status !== 'bye' && (
            <div className={`flex justify-between items-center p-2 rounded ${
              match.winner_id === match.player2_id ? 'bg-green-100 border-green-300' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-2">
                {match.player2_seed && (
                  <Badge variant="outline" className="text-xs w-6 h-6 rounded-full p-0 flex items-center justify-center">
                    {match.player2_seed}
                  </Badge>
                )}
                <span className="font-medium text-sm">
                  {match.player2_name || 'TBD'}
                </span>
              </div>
              {match.status === 'completed' && (
                <span className="font-bold">{match.score_p2}</span>
              )}
            </div>
          )}

          {/* Actions */}
          {match.status === 'pending' && match.player1_id && match.player2_id && (
            <div className="pt-2">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  // Mock result for demo
                  const winnerId = Math.random() > 0.5 ? match.player1_id! : match.player2_id!;
                  const winnerName = winnerId === match.player1_id ? match.player1_name! : match.player2_name!;
                  updateMatchResult(match.match_id, winnerId, winnerName, 
                    winnerId === match.player1_id ? 5 : Math.floor(Math.random() * 5),
                    winnerId === match.player2_id ? 5 : Math.floor(Math.random() * 5)
                  );
                }}
              >
                <Play className="h-3 w-3 mr-1" />
                Nhập kết quả
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <span>Tạo Bracket - {tournament.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!bracketGenerated ? (
            // Bracket Generation Settings
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4" />
                      <span>Loại Bracket</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={bracketType} onValueChange={(value: 'single' | 'double') => setBracketType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại bracket" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Elimination</SelectItem>
                        <SelectItem value="double">Double Elimination</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2 text-sm text-gray-500">
                      {bracketType === 'single' 
                        ? 'Loại trực tiếp - Thua 1 trận bị loại'
                        : 'Loại đôi - Phải thua 2 trận mới bị loại'
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Phương thức Seeding</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={seedingMethod} onValueChange={(value: 'elo' | 'random' | 'manual') => setSeedingMethod(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phương thức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elo">Theo ELO Rating</SelectItem>
                        <SelectItem value="random">Ngẫu nhiên</SelectItem>
                        <SelectItem value="manual">Thủ công</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2 text-sm text-gray-500">
                      {seedingMethod === 'elo' 
                        ? 'Xếp hạng theo điểm ELO'
                        : seedingMethod === 'random'
                        ? 'Xếp hạng ngẫu nhiên'
                        : 'Tự xếp hạng thủ công'
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Thống kê thí sinh</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
                      <div className="text-sm text-gray-500">Tổng thí sinh</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{Math.ceil(Math.log2(participants.length))}</div>
                      <div className="text-sm text-gray-500">Số vòng đấu</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{participants.length - 1}</div>
                      <div className="text-sm text-gray-500">Tổng số trận</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {participants.filter(p => p.elo > 1700).length}
                      </div>
                      <div className="text-sm text-gray-500">Thí sinh mạnh</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button size="lg" onClick={generateBracket}>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Tạo Bracket
                </Button>
              </div>
            </div>
          ) : (
            // Bracket Display
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Bracket Tournament</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setBracketGenerated(false)}>
                    Tạo lại
                  </Button>
                  <Button>
                    Xuất Bracket
                  </Button>
                </div>
              </div>

              {/* Bracket Visualization */}
              <div className="bg-gray-50 p-6 rounded-lg overflow-x-auto">
                <div className="flex space-x-8">
                  {Array.from({ length: maxRounds }, (_, i) => i + 1).map(round => (
                    <div key={round} className="flex flex-col">
                      <div className="text-center font-bold mb-4 text-lg">
                        {round === maxRounds ? (
                          <div className="flex items-center space-x-2">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            <span>Chung kết</span>
                          </div>
                        ) : (
                          `Vòng ${round}`
                        )}
                      </div>
                      <div className="flex flex-col justify-center space-y-4">
                        {getRoundMatches(round).map(match => (
                          <MatchCard key={match.match_id} match={match} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentBracketGenerator;
