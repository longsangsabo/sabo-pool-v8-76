import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Crown, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  player1?: {
    full_name: string;
    display_name?: string;
    verified_rank?: string;
  };
  player2?: {
    full_name: string;
    display_name?: string;
    verified_rank?: string;
  };
  score_player1?: number;
  score_player2?: number;
  bracket_type?: string;
  is_third_place_match?: boolean;
}

interface EmergencyMatchCompletionProps {
  matches: Match[];
  onMatchUpdated: () => void;
  isClubOwner: boolean;
}

export const EmergencyMatchCompletion: React.FC<
  EmergencyMatchCompletionProps
> = ({ matches, onMatchUpdated, isClubOwner }) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const incompleteMatches = matches.filter(
    m => m.status !== 'completed' && m.player1_id && m.player2_id
  );

  if (!isClubOwner || incompleteMatches.length === 0) {
    return null;
  }

  const handleEmergencyCompletion = async () => {
    if (!selectedMatch || player1Score === player2Score) {
      toast.error(
        'Vui lòng chọn trận đấu và nhập tỷ số hợp lệ (không được hòa)'
      );
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.rpc(
        'emergency_complete_tournament_match',
        {
          p_match_id: selectedMatch.id,
          p_winner_id:
            player1Score > player2Score
              ? selectedMatch.player1_id
              : selectedMatch.player2_id,
        }
      );

      if (error) throw error;

      const result = data as any; // Type assertion for JSON response

      if (result?.success) {
        toast.success(
          result.message || 'Trận đấu đã được hoàn thành thành công!'
        );

        if (result.tournament_completed) {
          toast.success('🏆 Giải đấu đã hoàn thành!', { duration: 5000 });
        }

        // Reset form
        setSelectedMatch(null);
        setPlayer1Score(0);
        setPlayer2Score(0);
        setNotes('');

        onMatchUpdated();
      } else {
        throw new Error(result?.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Emergency completion error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi hoàn thành trận đấu');
    } finally {
      setIsProcessing(false);
    }
  };

  const getMatchLabel = (match: Match) => {
    const player1Name =
      match.player1?.display_name || match.player1?.full_name || 'TBD';
    const player2Name =
      match.player2?.display_name || match.player2?.full_name || 'TBD';

    let prefix = '';
    if (match.is_third_place_match) {
      prefix = '🥉 Tranh hạng 3: ';
    } else if (match.bracket_type === 'finals') {
      // SABO_REBUILD: Updated bracket type
      prefix = '🏆 Chung kết: ';
    } else if (match.bracket_type === 'semifinals') {
      // SABO_REBUILD: Updated bracket type
      prefix = '🎯 Bán kết: ';
    } else {
      prefix = `Vòng ${match.round_number}, Trận ${match.match_number}: `;
    }

    return `${prefix}${player1Name} vs ${player2Name}`;
  };

  return (
    <Card className='border-orange-200 bg-orange-50/30'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-orange-800'>
          <AlertTriangle className='h-5 w-5' />
          Hoàn thành khẩn cấp trận đấu
          <Badge
            variant='outline'
            className='bg-orange-100 text-orange-700 border-orange-300'
          >
            Chỉ dành cho CLB
          </Badge>
        </CardTitle>
        <p className='text-sm text-orange-700'>
          Sử dụng tính năng này để hoàn thành trận đấu khi gặp sự cố kỹ thuật.
          Tất cả hành động sẽ được ghi lại để kiểm tra.
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <Label htmlFor='match-select'>Chọn trận đấu cần hoàn thành</Label>
          <select
            id='match-select'
            className='w-full mt-1 p-2 border border-gray-300 rounded-md'
            value={selectedMatch?.id || ''}
            onChange={e => {
              const match = incompleteMatches.find(
                m => m.id === e.target.value
              );
              setSelectedMatch(match || null);
              setPlayer1Score(0);
              setPlayer2Score(0);
            }}
          >
            <option value=''>-- Chọn trận đấu --</option>
            {incompleteMatches.map(match => (
              <option key={match.id} value={match.id}>
                {getMatchLabel(match)}
              </option>
            ))}
          </select>
        </div>

        {selectedMatch && (
          <>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='player1-score'>
                  Tỷ số{' '}
                  {selectedMatch.player1?.display_name ||
                    selectedMatch.player1?.full_name}
                </Label>
                <Input
                  id='player1-score'
                  type='number'
                  min='0'
                  value={player1Score}
                  onChange={e => setPlayer1Score(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor='player2-score'>
                  Tỷ số{' '}
                  {selectedMatch.player2?.display_name ||
                    selectedMatch.player2?.full_name}
                </Label>
                <Input
                  id='player2-score'
                  type='number'
                  min='0'
                  value={player2Score}
                  onChange={e => setPlayer2Score(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor='notes'>Ghi chú (tùy chọn)</Label>
              <Textarea
                id='notes'
                placeholder='Lý do hoàn thành khẩn cấp...'
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {player1Score !== player2Score && (
              <div className='p-3 bg-green-50 border border-green-200 rounded-md'>
                <div className='flex items-center gap-2 text-green-800'>
                  <Crown className='h-4 w-4' />
                  <span className='font-medium'>Người thắng:</span>
                  <span>
                    {player1Score > player2Score
                      ? selectedMatch.player1?.display_name ||
                        selectedMatch.player1?.full_name
                      : selectedMatch.player2?.display_name ||
                        selectedMatch.player2?.full_name}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleEmergencyCompletion}
              disabled={isProcessing || player1Score === player2Score}
              className='w-full bg-orange-600 hover:bg-orange-700 text-white'
            >
              {isProcessing ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Trophy className='h-4 w-4 mr-2' />
                  Hoàn thành trận đấu
                </>
              )}
            </Button>
          </>
        )}

        <div className='text-xs text-orange-600 space-y-1'>
          <p>⚠️ Chức năng này chỉ dành cho trường hợp khẩn cấp</p>
          <p>📝 Tất cả hành động sẽ được ghi lại trong hệ thống</p>
          <p>🏆 Giải đấu sẽ tự động hoàn thành khi tất cả trận đấu kết thúc</p>
        </div>
      </CardContent>
    </Card>
  );
};
