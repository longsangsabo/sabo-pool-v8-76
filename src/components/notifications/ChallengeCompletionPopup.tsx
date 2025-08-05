import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trophy, Building, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ChallengeCompletionPopupProps {
  notification: {
    id: string;
    metadata: {
      challenge_id: string;
      opponent_id: string;
      club_id: string;
      final_score: string;
      requires_rating: boolean;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ChallengeCompletionPopup: React.FC<
  ChallengeCompletionPopupProps
> = ({ notification, isOpen, onClose }) => {
  const [opponentRating, setOpponentRating] = useState(0);
  const [clubRating, setClubRating] = useState(0);
  const [opponentComment, setOpponentComment] = useState('');
  const [clubComment, setClubComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get opponent data
  const { data: opponentData } = useQuery({
    queryKey: ['profile', notification.metadata.opponent_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, avatar_url')
        .eq('user_id', notification.metadata.opponent_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!notification.metadata.opponent_id,
  });

  // Get club data
  const { data: clubData } = useQuery({
    queryKey: ['club', notification.metadata.club_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('id, club_name, address')
        .eq('id', notification.metadata.club_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!notification.metadata.club_id,
  });

  // Submit ratings mutation
  const submitRatingsMutation = useMutation({
    mutationFn: async (ratings: { opponentRating: any; clubRating: any }) => {
      const promises = [];

      // Submit opponent rating if provided
      if (ratings.opponentRating.rating > 0) {
        // TODO: Implement rating system when mutual_ratings table is created
        console.log('Rating submission:', {
          rated_user: notification.metadata.opponent_id,
          rating: ratings.opponentRating.rating,
          comment: ratings.opponentRating.comment,
        });
      }

      // Submit club rating if provided
      if (ratings.clubRating.rating > 0) {
        // TODO: Implement rating system when mutual_ratings table is created
        console.log('Club rating submission:', {
          rated_club: notification.metadata.club_id,
          rating: ratings.clubRating.rating,
          comment: ratings.clubRating.comment,
        });
      }

      // Mark notification as read
      promises.push(
        supabase
          .from('notifications')
          .update({ is_read: true, auto_popup: false })
          .eq('id', notification.id)
      );

      const results = await Promise.all(promises);
      return results;
    },
    onSuccess: () => {
      toast({
        title: 'Cảm ơn bạn đã đánh giá!',
        description: 'Đánh giá của bạn đã được gửi thành công.',
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onClose();
    },
    onError: error => {
      console.error('Error submitting ratings:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi đánh giá. Vui lòng thử lại.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitRatings = async () => {
    if (opponentRating === 0 && clubRating === 0) {
      toast({
        title: 'Vui lòng đánh giá',
        description: 'Hãy đánh giá ít nhất đối thủ hoặc CLB.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRatingsMutation.mutateAsync({
        opponentRating: {
          rating: opponentRating,
          comment: opponentComment,
        },
        clubRating: {
          rating: clubRating,
          comment: clubComment,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, auto_popup: false })
        .eq('id', notification.id);

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onClose();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Trophy className='w-6 h-6 text-yellow-500' />
            Trận đấu đã hoàn thành!
          </DialogTitle>
          <div className='text-center py-2'>
            <div className='text-2xl font-bold text-primary'>
              {notification.metadata.final_score}
            </div>
            <p className='text-muted-foreground'>Tỷ số cuối cùng</p>
          </div>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Opponent Rating Section */}
          {opponentData && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='w-5 h-5' />
                  Đánh giá đối thủ
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <Avatar className='w-12 h-12'>
                    <AvatarImage src={opponentData.avatar_url} />
                    <AvatarFallback>
                      {opponentData.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='font-medium'>
                      {opponentData.full_name || opponentData.display_name}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Đối thủ của bạn
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>Đánh giá:</span>
                    <StarRating
                      value={opponentRating}
                      onChange={setOpponentRating}
                      size='md'
                    />
                  </div>
                  <Textarea
                    placeholder='Đối thủ chơi fair, lịch sự, kỹ thuật tốt...'
                    value={opponentComment}
                    onChange={e => setOpponentComment(e.target.value)}
                    className='min-h-[80px]'
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Club Rating Section */}
          {clubData && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building className='w-5 h-5' />
                  Đánh giá CLB
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                    <Building className='w-6 h-6 text-primary' />
                  </div>
                  <div>
                    <div className='font-medium'>{clubData.club_name}</div>
                    <div className='text-sm text-muted-foreground'>
                      {clubData.address}
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>Đánh giá:</span>
                    <StarRating
                      value={clubRating}
                      onChange={setClubRating}
                      size='md'
                    />
                  </div>
                  <Textarea
                    placeholder='CLB có không gian thoải mái, nhân viên nhiệt tình, bàn chơi tốt...'
                    value={clubComment}
                    onChange={e => setClubComment(e.target.value)}
                    className='min-h-[80px]'
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 justify-end'>
            <Button
              variant='ghost'
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Bỏ qua
            </Button>
            <Button
              onClick={handleSubmitRatings}
              disabled={
                isSubmitting || (opponentRating === 0 && clubRating === 0)
              }
              className='bg-primary hover:bg-primary/90'
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
