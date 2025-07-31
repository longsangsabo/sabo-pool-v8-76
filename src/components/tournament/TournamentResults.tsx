
import React from 'react';
import { useTournamentResults } from '@/hooks/useTournamentResults';
import { useTournamentPrizeTiers } from '@/hooks/useTournamentPrizeTiers';
import { TournamentResultWithPlayer } from '@/types/tournamentResults';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Gift, Loader2, AlertCircle } from 'lucide-react';

interface TournamentResultsProps {
  tournamentId: string;
  showTitle?: boolean;
  maxResults?: number;
}

export const TournamentResults: React.FC<TournamentResultsProps> = ({ 
  tournamentId, 
  showTitle = true,
  maxResults 
}) => {
  const { results, loading, error } = useTournamentResults(tournamentId);
  const { prizeTiers } = useTournamentPrizeTiers(tournamentId);

  // Combine results with prize tier configuration
  const enhancedResults = results.map(result => {
    const prizeTier = prizeTiers.find(tier => tier.position === result.final_position);
    return {
      ...result,
      // Override with prize tier configuration if available
      spa_points_earned: prizeTier?.spa_points || result.spa_points_earned,
      elo_points_awarded: prizeTier?.elo_points || result.elo_points_awarded,
      prize_amount: prizeTier?.cash_amount || result.prize_amount,
      physical_rewards: prizeTier?.physical_items || result.physical_rewards || [],
      // Fix verified_rank display
      verified_rank: result.verified_rank || 'Unranked',
      position_name: prizeTier?.position_name || 
        (result.final_position === 1 ? 'Vô địch' : 
         result.final_position === 2 ? 'Á quân' : 
         result.final_position === 3 ? 'Hạng 3' : 
         `Hạng ${result.final_position}`)
    };
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Đang tải kết quả...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Lỗi tải kết quả: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có kết quả giải đấu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayResults = maxResults ? enhancedResults.slice(0, maxResults) : enhancedResults;

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      case 4:
        return <Award className="h-5 w-5 text-blue-500" />;
      default:
        return <Gift className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 3:
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Kết quả giải đấu
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {displayResults.map((result) => (
          <div
            key={result.user_id}
            className={`p-4 rounded-lg border ${getPositionColor(result.final_position)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getPositionIcon(result.final_position)}
                  <span className="font-bold text-lg">#{result.final_position}</span>
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={result.avatar_url} alt={result.display_name} />
                  <AvatarFallback>
                    {result.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <p className="font-semibold">{result.display_name}</p>
                  <p className="text-sm text-muted-foreground">{result.full_name}</p>
                </div>
                
                <Badge variant="outline" className="ml-2">
                  {result.verified_rank}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-green-600">{result.wins}W</p>
                  <p className="text-xs text-muted-foreground">Thắng</p>
                </div>
                
                <div className="text-center">
                  <p className="font-semibold text-red-600">{result.losses}L</p>
                  <p className="text-xs text-muted-foreground">Thua</p>
                </div>
                
                <div className="text-center">
                  <p className="font-semibold text-blue-600">{result.win_percentage?.toFixed(1) || '0.0'}%</p>
                  <p className="text-xs text-muted-foreground">Tỷ lệ thắng</p>
                </div>
                
                <div className="text-center">
                  <p className="font-semibold text-purple-600">{result.spa_points_earned}</p>
                  <p className="text-xs text-muted-foreground">SPA Points</p>
                </div>
                
                <div className="text-center">
                  <p className="font-semibold text-orange-600">{result.elo_points_awarded}</p>
                  <p className="text-xs text-muted-foreground">ELO</p>
                </div>
                
                <div className="text-center">
                  <p className="font-semibold text-green-700">
                    {result.prize_amount > 0 ? new Intl.NumberFormat('vi-VN', { 
                      style: 'currency', 
                      currency: 'VND',
                      minimumFractionDigits: 0
                    }).format(result.prize_amount) : '0₫'}
                  </p>
                  <p className="text-xs text-muted-foreground">Tiền thưởng</p>
                </div>
                
                {result.physical_rewards && result.physical_rewards.length > 0 && (
                  <div className="text-center">
                    <Gift className="h-4 w-4 mx-auto text-amber-600" />
                    <p className="text-xs text-muted-foreground">
                      {result.physical_rewards.length} phần thưởng
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {maxResults && enhancedResults.length > maxResults && (
          <div className="text-center text-sm text-muted-foreground">
            Hiển thị {maxResults} trong {enhancedResults.length} kết quả
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentResults;
