import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentAutomationTestProps {
  tournamentId: string;
  tournament: any;
}

export const TournamentAutomationTest: React.FC<
  TournamentAutomationTestProps
> = ({ tournamentId, tournament }) => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const simulateMatchCompletion = async () => {
    setTesting(true);
    setTestResults([]);

    try {
      toast.info('🧪 Bắt đầu test automation system...');

      // Get first incomplete match
      const { data: incompleteMatches, error: matchError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .neq('status', 'completed')
        .limit(1);

      if (matchError) throw matchError;

      if (!incompleteMatches || incompleteMatches.length === 0) {
        setTestResults([
          '⚠️ Không có trận đấu nào để test (tất cả đã hoàn thành)',
        ]);
        toast.warning('Không có trận đấu nào để test');
        return;
      }

      const testMatch = incompleteMatches[0];
      const winnerId = testMatch.player1_id; // Assume player1 wins for test

      setTestResults(prev => [
        ...prev,
        `🎯 Testing match: Round ${testMatch.round_number}, Match ${testMatch.match_number}`,
      ]);
      setTestResults(prev => [...prev, `🏆 Setting winner: ${winnerId}`]);

      // Simulate match completion by updating scores and winner
      const { error: updateError } = await supabase
        .from('tournament_matches')
        .update({
          score_player1: 5,
          score_player2: 3,
          winner_id: winnerId,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', testMatch.id);

      if (updateError) throw updateError;

      setTestResults(prev => [...prev, '✅ Match updated successfully']);
      setTestResults(prev => [
        ...prev,
        '⚡ Database trigger should automatically advance winner...',
      ]);

      // Wait a bit for automation to run
      setTimeout(async () => {
        // Check if next round match was created/updated
        const { data: nextMatches, error: nextError } = await supabase
          .from('tournament_matches')
          .select('*')
          .eq('tournament_id', tournamentId)
          .eq('round_number', testMatch.round_number + 1);

        if (nextError) {
          setTestResults(prev => [
            ...prev,
            `❌ Error checking next round: ${nextError.message}`,
          ]);
        } else {
          const updatedMatch = nextMatches?.find(
            m => m.player1_id === winnerId || m.player2_id === winnerId
          );

          if (updatedMatch) {
            setTestResults(prev => [
              ...prev,
              '🎉 SUCCESS: Winner automatically advanced to next round!',
            ]);
            setTestResults(prev => [
              ...prev,
              `📍 Found in Round ${updatedMatch.round_number}, Match ${updatedMatch.match_number}`,
            ]);
            toast.success('🎉 Automation test thành công!');
          } else {
            setTestResults(prev => [
              ...prev,
              '⚠️ Winner not found in next round - automation may not be working',
            ]);
            toast.warning('Automation có thể chưa hoạt động đúng');
          }
        }

        setTesting(false);
      }, 2000);
    } catch (error) {
      console.error('Test automation error:', error);
      setTestResults(prev => [...prev, `❌ Error: ${error.message}`]);
      toast.error('Lỗi khi test automation');
      setTesting(false);
    }
  };

  const resetTestData = async () => {
    try {
      toast.info('🔄 Đang reset test data...');

      // Reset all matches to scheduled status
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'scheduled',
          winner_id: null,
          score_player1: null,
          score_player2: null,
          updated_at: new Date().toISOString(),
        })
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      setTestResults([]);
      toast.success('✅ Test data đã được reset');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Lỗi khi reset test data');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Zap className='h-5 w-5 text-primary' />
          Test Automation System
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              Tính năng này sẽ test automation system bằng cách hoàn thành một
              trận đấu ngẫu nhiên và kiểm tra xem winner có được tự động chuyển
              sang vòng tiếp theo không.
            </AlertDescription>
          </Alert>

          <div className='flex gap-2'>
            <Button
              onClick={simulateMatchCompletion}
              disabled={testing}
              className='flex items-center gap-2'
            >
              <Play className='h-4 w-4' />
              {testing ? 'Đang test...' : 'Test Automation'}
            </Button>

            <Button
              variant='outline'
              onClick={resetTestData}
              disabled={testing}
            >
              Reset Test Data
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className='space-y-2'>
              <h4 className='font-medium'>Kết quả test:</h4>
              <div className='bg-muted p-4 rounded-lg font-mono text-sm space-y-1'>
                {testResults.map((result, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    {result.includes('✅') && (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    )}
                    {result.includes('❌') && (
                      <AlertTriangle className='h-4 w-4 text-red-600' />
                    )}
                    {result.includes('⚠️') && (
                      <AlertTriangle className='h-4 w-4 text-orange-600' />
                    )}
                    <span>{result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='pt-4 border-t'>
            <h4 className='font-medium mb-2'>Cách hoạt động:</h4>
            <div className='text-sm text-muted-foreground space-y-1'>
              <div>1. Tìm trận đấu chưa hoàn thành đầu tiên</div>
              <div>2. Cập nhật điểm số và winner_id</div>
              <div>
                3. Database trigger tự động chạy advance_tournament_winner()
              </div>
              <div>
                4. Kiểm tra xem winner có được chuyển sang vòng tiếp theo
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
