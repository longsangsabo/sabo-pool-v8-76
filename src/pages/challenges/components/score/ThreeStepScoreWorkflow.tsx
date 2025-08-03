import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Challenge } from '@/types/challenge';
import {
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Trophy,
  User,
  Users,
  Building2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ThreeStepScoreWorkflowProps {
  challenge: Challenge;
  isClubOwner: boolean;
  onScoreUpdated: () => void;
}

const ThreeStepScoreWorkflow: React.FC<ThreeStepScoreWorkflowProps> = ({
  challenge,
  isClubOwner,
  onScoreUpdated,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [challengerScore, setChallengerScore] = useState<number>(
    challenge.challenger_final_score || 0
  );
  const [opponentScore, setOpponentScore] = useState<number>(
    challenge.opponent_final_score || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Club confirmation state
  const [editedChallengerScore, setEditedChallengerScore] = useState<number>(
    challenge.challenger_final_score || 0
  );
  const [editedOpponentScore, setEditedOpponentScore] = useState<number>(
    challenge.opponent_final_score || 0
  );
  const [challengerRating, setChallengerRating] = useState<number>(5);
  const [opponentRating, setOpponentRating] = useState<number>(5);
  const [challengerComment, setChallengerComment] = useState<string>('');
  const [opponentComment, setOpponentComment] = useState<string>('');

  // Player profiles state
  const [challengerProfile, setChallengerProfile] = useState<any>(null);
  const [opponentProfile, setOpponentProfile] = useState<any>(null);
  const [clubProfile, setClubProfile] = useState<any>(null);

  const loadPlayerProfiles = async () => {
    try {
      const [challengerData, opponentData, clubData] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, verified_rank')
          .eq('user_id', challenge.challenger_id)
          .single(),
        supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, verified_rank')
          .eq('user_id', challenge.opponent_id)
          .single(),
        challenge.club_id
          ? supabase
              .from('club_profiles')
              .select('id, user_id, club_name')
              .eq('id', challenge.club_id)
              .single()
          : { data: null },
      ]);

      if (challengerData.data) setChallengerProfile(challengerData.data);
      if (opponentData.data) setOpponentProfile(opponentData.data);
      if (clubData.data) setClubProfile(clubData.data);

      // Initialize edited scores with current scores
      setEditedChallengerScore(challenge.challenger_final_score || 0);
      setEditedOpponentScore(challenge.opponent_final_score || 0);
    } catch (error) {
      console.error('Error loading player profiles:', error);
    }
  };

  const isChallenger = user?.id === challenge.challenger_id;
  const isOpponent = user?.id === challenge.opponent_id;
  const isParticipant = isChallenger || isOpponent;
  const isScoreEnterer = user?.id === challenge.score_entered_by;

  // Fix: Correctly determine if current user is the "other player" who needs to confirm
  const isOtherPlayer =
    isParticipant &&
    challenge.score_entered_by &&
    user?.id !== challenge.score_entered_by;

  // Determine current step and what user can do
  const getWorkflowState = () => {
    const status = challenge.score_confirmation_status || 'pending';

    switch (status) {
      case 'pending':
        return {
          step: 1,
          title: 'Bước 1: Nhập tỷ số toàn trận',
          description: 'Một trong hai người chơi cần nhập tỷ số hoàn chỉnh',
          canEnterScore: isParticipant && !challenge.score_entered_by,
          canConfirmScore: false,
          canClubConfirm: false,
          buttonText: 'Nhập tỷ số',
          statusColor: 'secondary',
        };
      case 'score_entered':
        return {
          step: 2,
          title: 'Bước 2: Xác nhận từ người chơi còn lại',
          description: isOtherPlayer
            ? 'Bạn cần xác nhận tỷ số đã được nhập bởi đối thủ'
            : 'Đang chờ đối thủ xác nhận tỷ số bạn đã nhập',
          canEnterScore: false,
          canConfirmScore: isOtherPlayer,
          canClubConfirm: false,
          buttonText: isOtherPlayer ? 'Xác nhận tỷ số' : 'Chờ đối thủ xác nhận',
          statusColor: isOtherPlayer ? 'default' : 'destructive',
        };
      case 'score_confirmed':
        return {
          step: 3,
          title: 'Bước 3: Xác nhận từ CLB',
          description: 'CLB cần xác nhận kết quả cuối cùng',
          canEnterScore: false,
          canConfirmScore: false,
          canClubConfirm: isClubOwner && !challenge.club_confirmed,
          buttonText: isClubOwner ? 'Xác nhận cuối cùng' : 'Chờ CLB xác nhận',
          statusColor: 'destructive',
        };
      case 'completed':
        return {
          step: 4,
          title: 'Hoàn thành',
          description: 'Kết quả đã được xác nhận và ELO/SPA đã cập nhật',
          canEnterScore: false,
          canConfirmScore: false,
          canClubConfirm: false,
          buttonText: 'Đã hoàn thành',
          statusColor: 'default',
        };
      default:
        console.log('🎯 ThreeStepScoreWorkflow Debug:', {
          challengeId: challenge.id,
          userId: user?.id,
          status: challenge.score_confirmation_status,
          isChallenger,
          isOpponent,
          isOtherPlayer,
          score_entered_by: challenge.score_entered_by,
        });
        return {
          step: 1,
          title: 'Chờ xử lý',
          description: '',
          canEnterScore: false,
          canConfirmScore: false,
          canClubConfirm: false,
          buttonText: 'Chờ xử lý',
          statusColor: 'secondary',
        };
    }
  };

  const handleStep1_EnterScore = async () => {
    if (!isParticipant) return;

    setIsSubmitting(true);
    try {
      console.log('🔥 SCORE SUBMISSION DEBUG:');
      console.log('Challenge ID:', challenge.id);
      console.log('BEFORE status:', challenge.score_confirmation_status);
      console.log('Submitting scores:', { challengerScore, opponentScore });

      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', challenge.id);

      console.log('Database update error:', error);
      if (error) throw error;

      // Send email notification to the other player
      await sendScoreConfirmationEmail('score_entered');

      // Also create in-app notification for the other player
      const otherPlayerId = isChallenger
        ? challenge.opponent_id
        : challenge.challenger_id;
      const currentPlayerName = user?.user_metadata?.full_name || 'Đối thủ';

      if (otherPlayerId) {
        await supabase.from('notifications').insert({
          user_id: otherPlayerId,
          type: 'score_confirmation_needed',
          title: '🎱 Cần xác nhận tỷ số',
          message: `${currentPlayerName} đã nhập tỷ số: ${challengerScore}-${opponentScore}. Vui lòng xác nhận hoặc chỉnh sửa.`,
          priority: 'high',
          metadata: {
            challenge_id: challenge.id,
            action_required: 'confirm_score',
            challenger_final_score: challengerScore,
            opponent_final_score: opponentScore,
          },
        });
      }

      console.log('✅ Score submitted successfully. Triggering UI refresh...');
      toast.success('Đã nhập tỷ số thành công! Đang chờ đối thủ xác nhận.');
      setIsOpen(false);

      console.log('🔄 Calling onScoreUpdated at:', Date.now());
      onScoreUpdated();
    } catch (error: any) {
      console.error('Error entering score:', error);
      toast.error('Lỗi khi nhập tỷ số: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2_ConfirmScore = async (confirmed: boolean) => {
    if (!isOtherPlayer) return;

    setIsSubmitting(true);
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (confirmed) {
        updates.score_confirmed_by = user?.id;
        updates.score_confirmation_timestamp = new Date().toISOString();
        updates.score_confirmation_status = 'score_confirmed';
      } else {
        // User disagreed, allow re-entering score
        updates.challenger_final_score = challengerScore;
        updates.opponent_final_score = opponentScore;
        updates.score_entered_by = user?.id;
        updates.score_entry_timestamp = new Date().toISOString();
        updates.score_confirmation_status = 'score_entered';
        updates.score_confirmed_by = null;
        updates.score_confirmation_timestamp = null;
      }

      const { error } = await supabase
        .from('challenges')
        .update(updates)
        .eq('id', challenge.id);

      if (error) throw error;

      // Send email notifications
      if (confirmed) {
        await sendScoreConfirmationEmail('score_confirmed');
        toast.success('Đã xác nhận tỷ số! Đang chờ CLB xác nhận cuối cùng.');
      } else {
        await sendScoreConfirmationEmail('score_entered');
        toast.success('Đã chỉnh sửa tỷ số! Đang chờ đối thủ xác nhận lại.');
      }

      setIsOpen(false);
      onScoreUpdated();
    } catch (error: any) {
      console.error('Error confirming score:', error);
      toast.error('Lỗi khi xác nhận tỷ số: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3_ClubConfirm = async () => {
    if (!isClubOwner) return;

    setIsSubmitting(true);
    try {
      const finalChallengerScore =
        editedChallengerScore || challenge.challenger_final_score || 0;
      const finalOpponentScore =
        editedOpponentScore || challenge.opponent_final_score || 0;
      const winnerId =
        finalChallengerScore > finalOpponentScore
          ? challenge.challenger_id
          : challenge.opponent_id;

      // Update challenge with potentially edited scores
      const { error } = await supabase
        .from('challenges')
        .update({
          club_confirmed: true,
          club_confirmed_by: user?.id,
          club_confirmed_at: new Date().toISOString(),
          score_confirmation_status: 'completed',
          status: 'completed',
          score_confirmation_timestamp: new Date().toISOString(),
          challenger_final_score: finalChallengerScore,
          opponent_final_score: finalOpponentScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', challenge.id);

      if (error) throw error;

      // Save player ratings if provided
      if (clubProfile && (challengerRating > 0 || opponentRating > 0)) {
        const ratings = [];

        if (challengerRating > 0 && challengerProfile) {
          ratings.push({
            rated_user_id: challengerProfile.user_id,
            rated_by_club_id: clubProfile.id,
            challenge_id: challenge.id,
            rating: challengerRating,
            comment: challengerComment.trim() || null,
          });
        }

        if (opponentRating > 0 && opponentProfile) {
          ratings.push({
            rated_user_id: opponentProfile.user_id,
            rated_by_club_id: clubProfile.id,
            challenge_id: challenge.id,
            rating: opponentRating,
            comment: opponentComment.trim() || null,
          });
        }

        if (ratings.length > 0) {
          const { error: ratingsError } = await supabase
            .from('mutual_ratings')
            .insert(ratings);

          if (ratingsError) {
            console.error('Error saving player ratings:', ratingsError);
          }
        }
      }

      // Send completion emails to both players
      await sendScoreConfirmationEmail('club_final_confirmation');

      // Notify both players
      const score = `${finalChallengerScore}-${finalOpponentScore}`;
      await Promise.all([
        supabase.from('notifications').insert({
          user_id: challenge.challenger_id,
          type: 'challenge_result_confirmed',
          title: 'Kết quả thách đấu đã được xác nhận',
          message: `Kết quả trận đấu: ${score}. ${winnerId === challenge.challenger_id ? 'Bạn đã thắng!' : 'Bạn đã thua!'}`,
          metadata: {
            challenge_id: challenge.id,
            final_score: score,
            winner: winnerId === challenge.challenger_id ? 'you' : 'opponent',
          },
        }),
        supabase.from('notifications').insert({
          user_id: challenge.opponent_id,
          type: 'challenge_result_confirmed',
          title: 'Kết quả thách đấu đã được xác nhận',
          message: `Kết quả trận đấu: ${score}. ${winnerId === challenge.opponent_id ? 'Bạn đã thắng!' : 'Bạn đã thua!'}`,
          metadata: {
            challenge_id: challenge.id,
            final_score: score,
            winner: winnerId === challenge.opponent_id ? 'you' : 'challenger',
          },
        }),
      ]);

      toast.success(
        'Đã xác nhận kết quả thành công! ELO/SPA đã được cập nhật.'
      );

      // Force refresh the parent component data
      if (onScoreUpdated) {
        onScoreUpdated();
      }

      // Invalidate and refetch queries to update UI immediately
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        await (window as any).queryClient.invalidateQueries([
          'club-challenges',
        ]);
      }

      setIsOpen(false);
    } catch (error: any) {
      console.error('Error club confirming:', error);
      toast.error('Lỗi khi xác nhận: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send email notification
  const sendScoreConfirmationEmail = async (
    actionType: 'score_entered' | 'score_confirmed' | 'club_final_confirmation'
  ) => {
    try {
      // Get player profiles for email data
      const { data: challengerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', challenge.challenger_id)
        .single();

      const { data: opponentProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', challenge.opponent_id)
        .single();

      const { data: clubProfile } = challenge.club_id
        ? await supabase
            .from('club_profiles')
            .select('club_name')
            .eq('id', challenge.club_id)
            .single()
        : { data: null };

      // Determine recipient based on action type
      let recipientEmail = '';
      let recipientName = '';

      if (actionType === 'score_entered') {
        // Send to the other player who needs to confirm
        if (user?.id === challenge.challenger_id && opponentProfile) {
          recipientEmail = opponentProfile.email;
          recipientName = opponentProfile.full_name;
        } else if (user?.id === challenge.opponent_id && challengerProfile) {
          recipientEmail = challengerProfile.email;
          recipientName = challengerProfile.full_name;
        }
      } else if (actionType === 'club_final_confirmation') {
        // Send to both players when match is completed
        const emails = [];
        if (challengerProfile?.email) {
          emails.push({
            email: challengerProfile.email,
            name: challengerProfile.full_name,
          });
        }
        if (opponentProfile?.email) {
          emails.push({
            email: opponentProfile.email,
            name: opponentProfile.full_name,
          });
        }

        // Send to all recipients
        for (const recipient of emails) {
          await supabase.functions.invoke('send-score-confirmation-email', {
            body: {
              challenge_id: challenge.id,
              recipient_email: recipient.email,
              recipient_name: recipient.name,
              challenger_name: challengerProfile?.full_name || 'Người chơi',
              opponent_name: opponentProfile?.full_name || 'Người chơi',
              challenger_score: challengerScore,
              opponent_score: opponentScore,
              club_name: clubProfile?.club_name,
              match_time: challenge.scheduled_time,
              action_type: actionType,
            },
          });
        }
        return;
      } else if (actionType === 'score_confirmed') {
        // Send to both players when score is confirmed
        const emails = [];
        if (challengerProfile?.email) {
          emails.push({
            email: challengerProfile.email,
            name: challengerProfile.full_name,
          });
        }
        if (opponentProfile?.email) {
          emails.push({
            email: opponentProfile.email,
            name: opponentProfile.full_name,
          });
        }

        // Send to all recipients
        for (const recipient of emails) {
          await supabase.functions.invoke('send-score-confirmation-email', {
            body: {
              challenge_id: challenge.id,
              recipient_email: recipient.email,
              recipient_name: recipient.name,
              challenger_name: challengerProfile?.full_name || 'Người chơi',
              opponent_name: opponentProfile?.full_name || 'Người chơi',
              challenger_score: challengerScore,
              opponent_score: opponentScore,
              club_name: clubProfile?.club_name,
              match_time: challenge.scheduled_time,
              action_type: actionType,
            },
          });
        }
        return;
      }

      if (!recipientEmail) {
        console.log(
          'No recipient email found for score confirmation notification'
        );
        return;
      }

      await supabase.functions.invoke('send-score-confirmation-email', {
        body: {
          challenge_id: challenge.id,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          challenger_name: challengerProfile?.full_name || 'Người chơi',
          opponent_name: opponentProfile?.full_name || 'Người chơi',
          challenger_score: challengerScore,
          opponent_score: opponentScore,
          club_name: clubProfile?.club_name,
          match_time: challenge.scheduled_time,
          action_type: actionType,
        },
      });
    } catch (error) {
      console.error('Error sending score confirmation email:', error);
      // Don't throw error to prevent blocking the main flow
    }
  };

  const workflowState = getWorkflowState();
  const canInteract =
    workflowState.canEnterScore ||
    workflowState.canConfirmScore ||
    workflowState.canClubConfirm;

  // Load player profiles when modal opens for club confirmation
  useEffect(() => {
    if (isOpen && workflowState.canClubConfirm) {
      loadPlayerProfiles();
    }
  }, [isOpen, workflowState.canClubConfirm]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isClubOwner ? 'default' : 'outline'}
          className='gap-2'
          disabled={!canInteract || challenge.status === 'completed'}
        >
          <Target className='w-4 h-4' />
          {workflowState.buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5' />
            {workflowState.title}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Workflow Steps */}
          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center justify-between text-sm'>
                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-1'>
                    <User className='w-3 h-3' />
                    <Badge
                      variant={
                        workflowState.step >= 2
                          ? 'default'
                          : workflowState.step === 1
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      1
                    </Badge>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Users className='w-3 h-3' />
                    <Badge
                      variant={
                        workflowState.step >= 3
                          ? 'default'
                          : workflowState.step === 2
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      2
                    </Badge>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Building2 className='w-3 h-3' />
                    <Badge
                      variant={
                        workflowState.step >= 4
                          ? 'default'
                          : workflowState.step === 3
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      3
                    </Badge>
                  </div>
                </div>
                <Badge variant={workflowState.statusColor as any}>
                  Bước {workflowState.step}/3
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground mt-2'>
                {workflowState.description}
              </p>
            </CardContent>
          </Card>

          {/* Current Status */}
          {challenge.score_entered_by && (
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Tỷ số đã được nhập: {challenge.challenger_final_score}-
                {challenge.opponent_final_score}
                {challenge.score_confirmed_by && ' • Đã được xác nhận'}
                {challenge.club_confirmed && ' • CLB đã xác nhận'}
              </AlertDescription>
            </Alert>
          )}

          {/* Player Cards with Full Info */}
          <div className='grid grid-cols-2 gap-4'>
            {/* Challenger Card */}
            <Card
              className={`transition-all duration-200 ${isChallenger ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-3'>
                  <Avatar className='w-12 h-12 border-2 border-background shadow-sm'>
                    <AvatarImage
                      src={
                        workflowState.canClubConfirm &&
                        challengerProfile?.avatar_url
                          ? challengerProfile.avatar_url
                          : challenge.challenger?.avatar_url
                      }
                      className='object-cover'
                    />
                    <AvatarFallback className='text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white'>
                      {workflowState.canClubConfirm && challengerProfile
                        ? challengerProfile.full_name?.[0] || 'C'
                        : challenge.challenger?.full_name?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-sm truncate'>
                      {workflowState.canClubConfirm && challengerProfile
                        ? challengerProfile.full_name
                        : challenge.challenger?.full_name || 'Người thách đấu'}
                    </p>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <span className='px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium'>
                        {workflowState.canClubConfirm &&
                        challengerProfile?.verified_rank
                          ? challengerProfile.verified_rank
                          : 'K'}
                      </span>
                      <span>•</span>
                      <span className='font-medium'>1000 ELO</span>
                    </div>
                    {isChallenger && (
                      <span className='text-xs text-primary font-medium'>
                        Bạn
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                <Label
                  htmlFor='challenger-score'
                  className='text-xs font-medium'
                >
                  Tỷ số
                </Label>
                <Input
                  id='challenger-score'
                  type='number'
                  min='0'
                  max={challenge.race_to || 22}
                  value={
                    workflowState.canClubConfirm
                      ? editedChallengerScore
                      : challengerScore
                  }
                  onChange={e => {
                    const value = parseInt(e.target.value) || 0;
                    if (workflowState.canClubConfirm) {
                      setEditedChallengerScore(value);
                    } else {
                      setChallengerScore(value);
                    }
                  }}
                  disabled={
                    !workflowState.canEnterScore &&
                    !(
                      workflowState.canConfirmScore &&
                      !workflowState.canEnterScore
                    ) &&
                    !workflowState.canClubConfirm
                  }
                  className='text-center font-bold text-xl h-12 border-2 focus:border-primary'
                />
              </CardContent>
            </Card>

            {/* Opponent Card */}
            <Card
              className={`transition-all duration-200 ${isOpponent ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-3'>
                  <Avatar className='w-12 h-12 border-2 border-background shadow-sm'>
                    <AvatarImage
                      src={
                        workflowState.canClubConfirm &&
                        opponentProfile?.avatar_url
                          ? opponentProfile.avatar_url
                          : challenge.opponent?.avatar_url
                      }
                      className='object-cover'
                    />
                    <AvatarFallback className='text-lg font-semibold bg-gradient-to-br from-green-500 to-teal-600 text-white'>
                      {workflowState.canClubConfirm && opponentProfile
                        ? opponentProfile.full_name?.[0] || 'O'
                        : challenge.opponent?.full_name?.[0] || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-sm truncate'>
                      {workflowState.canClubConfirm && opponentProfile
                        ? opponentProfile.full_name
                        : challenge.opponent?.full_name || 'Đối thủ'}
                    </p>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <span className='px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium'>
                        {workflowState.canClubConfirm &&
                        opponentProfile?.verified_rank
                          ? opponentProfile.verified_rank
                          : 'K'}
                      </span>
                      <span>•</span>
                      <span className='font-medium'>1000 ELO</span>
                    </div>
                    {isOpponent && (
                      <span className='text-xs text-primary font-medium'>
                        Bạn
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                <Label htmlFor='opponent-score' className='text-xs font-medium'>
                  Tỷ số
                </Label>
                <Input
                  id='opponent-score'
                  type='number'
                  min='0'
                  max={challenge.race_to || 22}
                  value={
                    workflowState.canClubConfirm
                      ? editedOpponentScore
                      : opponentScore
                  }
                  onChange={e => {
                    const value = parseInt(e.target.value) || 0;
                    if (workflowState.canClubConfirm) {
                      setEditedOpponentScore(value);
                    } else {
                      setOpponentScore(value);
                    }
                  }}
                  disabled={
                    !workflowState.canEnterScore &&
                    !(
                      workflowState.canConfirmScore &&
                      !workflowState.canEnterScore
                    ) &&
                    !workflowState.canClubConfirm
                  }
                  className='text-center font-bold text-xl h-12 border-2 focus:border-primary'
                />
              </CardContent>
            </Card>
          </div>

          {/* Club Score Editing Note */}
          {workflowState.canClubConfirm && (
            <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
              <p className='text-sm text-amber-800 font-medium'>
                💡 Điều chỉnh tỷ số nếu cần
              </p>
              <p className='text-xs text-amber-700 mt-1'>
                Chỉ chỉnh sửa nếu người chơi nhập sai tỷ số
              </p>
            </div>
          )}

          {/* Player Rating System for Club */}
          {workflowState.canClubConfirm &&
            challengerProfile &&
            opponentProfile && (
              <Card className='border-dashed'>
                <CardHeader>
                  <CardTitle className='text-lg'>Đánh giá người chơi</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Rating for challenger */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='font-medium'>
                        {challengerProfile.full_name}:
                      </span>
                      <StarRating
                        value={challengerRating}
                        onChange={setChallengerRating}
                        max={5}
                      />
                    </div>
                    <Textarea
                      placeholder='Nhận xét ngắn (VD: Người chơi lịch sự, văn minh)'
                      value={challengerComment}
                      onChange={e => setChallengerComment(e.target.value)}
                      maxLength={100}
                      className='text-sm h-16'
                    />
                  </div>

                  {/* Rating for opponent */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='font-medium'>
                        {opponentProfile.full_name}:
                      </span>
                      <StarRating
                        value={opponentRating}
                        onChange={setOpponentRating}
                        max={5}
                      />
                    </div>
                    <Textarea
                      placeholder='Nhận xét ngắn (VD: Người chơi lịch sự, văn minh)'
                      value={opponentComment}
                      onChange={e => setOpponentComment(e.target.value)}
                      maxLength={100}
                      className='text-sm h-16'
                    />
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Race to info */}
          <div className='text-center text-sm text-muted-foreground'>
            Race to {challenge.race_to || 8} • {challenge.bet_points} điểm SPA
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2'>
            {workflowState.canEnterScore && (
              <Button
                onClick={handleStep1_EnterScore}
                disabled={isSubmitting}
                className='flex-1'
              >
                {isSubmitting ? 'Đang xử lý...' : 'Nhập tỷ số'}
              </Button>
            )}

            {workflowState.canConfirmScore && (
              <>
                <Button
                  onClick={() => handleStep2_ConfirmScore(true)}
                  disabled={isSubmitting}
                  className='flex-1'
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đồng ý'}
                </Button>
                <Button
                  onClick={() => handleStep2_ConfirmScore(false)}
                  disabled={isSubmitting}
                  variant='outline'
                  className='flex-1'
                >
                  Chỉnh sửa
                </Button>
              </>
            )}

            {workflowState.canClubConfirm && (
              <Button
                onClick={handleStep3_ClubConfirm}
                disabled={isSubmitting}
                className='flex-1'
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận cuối cùng'}
              </Button>
            )}

            {!canInteract && workflowState.step < 4 && (
              <Button disabled className='flex-1'>
                {workflowState.buttonText}
              </Button>
            )}
          </div>

          {/* Helper text */}
          {workflowState.step === 3 && isClubOwner && (
            <p className='text-xs text-muted-foreground text-center'>
              Xác nhận kết quả sẽ hoàn tất trận đấu và cập nhật ELO/SPA cho cả
              hai người chơi.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThreeStepScoreWorkflow;
