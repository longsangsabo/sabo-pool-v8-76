import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Trophy,
  Users,
  MessageSquare,
  FileText,
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
} from 'lucide-react';
import { MatchResultData } from '@/types/matchResult';
import { useMatchResults } from '@/hooks/useMatchResults';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MatchResultVerificationProps {
  matchResult: MatchResultData;
  onStatusChange?: (newStatus: string) => void;
}

export const MatchResultVerification: React.FC<
  MatchResultVerificationProps
> = ({ matchResult, onStatusChange }) => {
  const { user } = useAuth();
  const { confirmMatchResult, verifyMatchResult, createDispute, loading } =
    useMatchResults();
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const isPlayer1 = user?.id === matchResult.player1_id;
  const isPlayer2 = user?.id === matchResult.player2_id;
  const isParticipant = isPlayer1 || isPlayer2;
  const isReferee = user?.id === matchResult.referee_id;
  const isAdmin = false; // TODO: Get from auth context

  const canConfirm = isParticipant && matchResult.result_status === 'pending';
  const canVerify =
    (isReferee || isAdmin) && matchResult.result_status === 'pending';
  const canDispute =
    isParticipant &&
    ['pending', 'verified'].includes(matchResult.result_status);

  const hasConfirmed =
    (isPlayer1 && matchResult.player1_confirmed) ||
    (isPlayer2 && matchResult.player2_confirmed);

  const bothPlayersConfirmed =
    matchResult.player1_confirmed && matchResult.player2_confirmed;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disputed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className='h-4 w-4' />;
      case 'pending':
        return <Clock className='h-4 w-4' />;
      case 'disputed':
        return <AlertTriangle className='h-4 w-4' />;
      case 'rejected':
        return <XCircle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Đã xác thực';
      case 'pending':
        return 'Chờ xác nhận';
      case 'disputed':
        return 'Đang tranh chấp';
      case 'rejected':
        return 'Đã từ chối';
      default:
        return status;
    }
  };

  const handleConfirm = async () => {
    if (!user) return;

    const success = await confirmMatchResult(matchResult.id, user.id);
    if (success) {
      onStatusChange?.('verified');
    }
  };

  const handleVerify = async () => {
    if (!user) return;

    const success = await verifyMatchResult(matchResult.id, user.id);
    if (success) {
      onStatusChange?.('verified');
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;

    const success = await createDispute(
      matchResult.id,
      disputeReason,
      disputeDetails || undefined
    );

    if (success) {
      setShowDisputeForm(false);
      setDisputeReason('');
      setDisputeDetails('');
      onStatusChange?.('disputed');
    }
  };

  const winner =
    matchResult.winner_id === matchResult.player1_id
      ? matchResult.player1
      : matchResult.player2;
  const loser =
    matchResult.winner_id === matchResult.player1_id
      ? matchResult.player2
      : matchResult.player1;

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Xác Thực Kết Quả
          </CardTitle>
          <Badge className={getStatusColor(matchResult.result_status)}>
            {getStatusIcon(matchResult.result_status)}
            <span className='ml-1'>
              {getStatusText(matchResult.result_status)}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Match Summary */}
        <div className='bg-muted/50 rounded-lg p-4'>
          <div className='grid grid-cols-3 gap-4 items-center'>
            {/* Player 1 */}
            <div className='flex items-center gap-3'>
              <Avatar>
                <AvatarImage src={matchResult.player1?.avatar_url} />
                <AvatarFallback>
                  {matchResult.player1?.display_name?.[0] || 'P1'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className='font-medium'>
                  {matchResult.player1?.display_name || 'Người chơi 1'}
                </div>
                <div className='text-sm text-muted-foreground'>
                  ELO: {matchResult.player1_elo_before}
                  {matchResult.result_status === 'verified' && (
                    <span
                      className={`ml-2 ${matchResult.player1_elo_change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      ({matchResult.player1_elo_change >= 0 ? '+' : ''}
                      {matchResult.player1_elo_change})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className='text-center'>
              <div className='text-3xl font-bold'>
                {matchResult.player1_score} - {matchResult.player2_score}
              </div>
              <div className='text-sm text-muted-foreground'>
                {matchResult.match_format.replace('_', ' ').toUpperCase()}
              </div>
            </div>

            {/* Player 2 */}
            <div className='flex items-center gap-3 justify-end'>
              <div className='text-right'>
                <div className='font-medium'>
                  {matchResult.player2?.display_name || 'Người chơi 2'}
                </div>
                <div className='text-sm text-muted-foreground'>
                  ELO: {matchResult.player2_elo_before}
                  {matchResult.result_status === 'verified' && (
                    <span
                      className={`ml-2 ${matchResult.player2_elo_change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      ({matchResult.player2_elo_change >= 0 ? '+' : ''}
                      {matchResult.player2_elo_change})
                    </span>
                  )}
                </div>
              </div>
              <Avatar>
                <AvatarImage src={matchResult.player2?.avatar_url} />
                <AvatarFallback>
                  {matchResult.player2?.display_name?.[0] || 'P2'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Winner Banner */}
          {winner && (
            <div className='mt-4 text-center'>
              <Badge className='bg-primary text-primary-foreground px-4 py-2'>
                <Trophy className='h-4 w-4 mr-2' />
                {winner.display_name} chiến thắng!
              </Badge>
            </div>
          )}
        </div>

        {/* Match Details */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Thời gian:</span>
              <span>
                {new Date(matchResult.match_date).toLocaleString('vi-VN')}
              </span>
            </div>
            {matchResult.duration_minutes && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Thời lượng:</span>
                <span>{matchResult.duration_minutes} phút</span>
              </div>
            )}
            {matchResult.club && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Câu lạc bộ:</span>
                <span>{matchResult.club.club_name}</span>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            {matchResult.tournament && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Giải đấu:</span>
                <span>{matchResult.tournament.name}</span>
              </div>
            )}
            {matchResult.referee && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Trọng tài:</span>
                <span>{matchResult.referee.display_name}</span>
              </div>
            )}
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Tạo lúc:</span>
              <span>
                {formatDistanceToNow(new Date(matchResult.created_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Player Confirmations */}
        {matchResult.result_status === 'pending' && (
          <div className='space-y-3'>
            <h4 className='font-semibold'>Xác nhận từ người chơi</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div
                className={`p-3 rounded-lg border ${
                  matchResult.player1_confirmed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className='flex items-center gap-2'>
                  {matchResult.player1_confirmed ? (
                    <CheckCircle className='h-4 w-4 text-green-600' />
                  ) : (
                    <Clock className='h-4 w-4 text-gray-400' />
                  )}
                  <span className='font-medium'>
                    {matchResult.player1?.display_name}
                  </span>
                </div>
                <div className='text-sm text-muted-foreground mt-1'>
                  {matchResult.player1_confirmed
                    ? `Đã xác nhận ${formatDistanceToNow(
                        new Date(matchResult.player1_confirmed_at!),
                        {
                          addSuffix: true,
                          locale: vi,
                        }
                      )}`
                    : 'Chờ xác nhận'}
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  matchResult.player2_confirmed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className='flex items-center gap-2'>
                  {matchResult.player2_confirmed ? (
                    <CheckCircle className='h-4 w-4 text-green-600' />
                  ) : (
                    <Clock className='h-4 w-4 text-gray-400' />
                  )}
                  <span className='font-medium'>
                    {matchResult.player2?.display_name}
                  </span>
                </div>
                <div className='text-sm text-muted-foreground mt-1'>
                  {matchResult.player2_confirmed
                    ? `Đã xác nhận ${formatDistanceToNow(
                        new Date(matchResult.player2_confirmed_at!),
                        {
                          addSuffix: true,
                          locale: vi,
                        }
                      )}`
                    : 'Chờ xác nhận'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Info */}
        {matchResult.result_status === 'verified' &&
          matchResult.verified_at && (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                Kết quả đã được xác thực vào{' '}
                {new Date(matchResult.verified_at).toLocaleString('vi-VN')}
                {matchResult.verification_method && (
                  <span className='ml-1'>
                    bằng phương pháp{' '}
                    {matchResult.verification_method === 'auto'
                      ? 'tự động'
                      : 'thủ công'}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

        {/* Actions */}
        <div className='flex flex-wrap gap-3 pt-4 border-t'>
          {/* Player Confirmation */}
          {canConfirm && !hasConfirmed && (
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className='flex-1 sm:flex-none'
            >
              <CheckCircle className='h-4 w-4 mr-2' />
              Xác nhận kết quả
            </Button>
          )}

          {/* Admin/Referee Verification */}
          {canVerify && bothPlayersConfirmed && (
            <Button onClick={handleVerify} disabled={loading} variant='default'>
              <Shield className='h-4 w-4 mr-2' />
              Xác thực kết quả
            </Button>
          )}

          {/* Dispute Button */}
          {canDispute && (
            <Dialog open={showDisputeForm} onOpenChange={setShowDisputeForm}>
              <DialogTrigger asChild>
                <Button variant='destructive' size='sm'>
                  <AlertTriangle className='h-4 w-4 mr-2' />
                  Khiếu nại
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Khiếu nại kết quả trận đấu</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>
                      Lý do khiếu nại
                    </label>
                    <Textarea
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      placeholder='Mô tả lý do khiếu nại...'
                      className='mt-1'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>
                      Chi tiết (tùy chọn)
                    </label>
                    <Textarea
                      value={disputeDetails}
                      onChange={e => setDisputeDetails(e.target.value)}
                      placeholder='Thêm chi tiết hoặc bằng chứng...'
                      className='mt-1'
                    />
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      onClick={handleDispute}
                      disabled={!disputeReason.trim() || loading}
                      className='flex-1'
                    >
                      Gửi khiếu nại
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => setShowDisputeForm(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Match Notes */}
        {matchResult.match_notes && (
          <div className='space-y-2'>
            <h4 className='font-semibold flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              Ghi chú
            </h4>
            <div className='p-3 bg-muted/50 rounded-lg text-sm'>
              {matchResult.match_notes}
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {(matchResult.player1_stats || matchResult.player2_stats) && (
          <div className='space-y-3'>
            <h4 className='font-semibold flex items-center gap-2'>
              <Target className='h-4 w-4' />
              Thống kê chi tiết
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {matchResult.player1_stats &&
                Object.keys(matchResult.player1_stats).length > 0 && (
                  <div className='space-y-2'>
                    <div className='font-medium'>
                      {matchResult.player1?.display_name}
                    </div>
                    <div className='space-y-1 text-sm'>
                      {matchResult.player1_stats.longest_run && (
                        <div className='flex justify-between'>
                          <span>Run dài nhất:</span>
                          <span className='font-medium'>
                            {matchResult.player1_stats.longest_run}
                          </span>
                        </div>
                      )}
                      {matchResult.player1_stats.total_shots && (
                        <div className='flex justify-between'>
                          <span>Tổng shots:</span>
                          <span className='font-medium'>
                            {matchResult.player1_stats.total_shots}
                          </span>
                        </div>
                      )}
                      {matchResult.player1_stats.potting_percentage && (
                        <div className='flex justify-between'>
                          <span>% Pot thành công:</span>
                          <span className='font-medium'>
                            {matchResult.player1_stats.potting_percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {matchResult.player2_stats &&
                Object.keys(matchResult.player2_stats).length > 0 && (
                  <div className='space-y-2'>
                    <div className='font-medium'>
                      {matchResult.player2?.display_name}
                    </div>
                    <div className='space-y-1 text-sm'>
                      {matchResult.player2_stats.longest_run && (
                        <div className='flex justify-between'>
                          <span>Run dài nhất:</span>
                          <span className='font-medium'>
                            {matchResult.player2_stats.longest_run}
                          </span>
                        </div>
                      )}
                      {matchResult.player2_stats.total_shots && (
                        <div className='flex justify-between'>
                          <span>Tổng shots:</span>
                          <span className='font-medium'>
                            {matchResult.player2_stats.total_shots}
                          </span>
                        </div>
                      )}
                      {matchResult.player2_stats.potting_percentage && (
                        <div className='flex justify-between'>
                          <span>% Pot thành công:</span>
                          <span className='font-medium'>
                            {matchResult.player2_stats.potting_percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
