import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Trophy, 
  MapPin, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Target,
  DollarSign
} from 'lucide-react';

interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  club_id?: string;
  bet_points: number;
  race_to: number;
  status: string;
  message?: string;
  scheduled_time?: string;
  created_at: string;
  expires_at: string;
  challenger_profile?: {
    full_name: string;
    avatar_url?: string;
    current_rank?: string;
    spa_points?: number;
  };
  opponent_profile?: {
    full_name: string;
    avatar_url?: string;
    current_rank?: string;
    spa_points?: number;
  };
  club_profiles?: {
    club_name: string;
    address: string;
  };
}

interface ChallengeDetailsModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ChallengeDetailsModal: React.FC<ChallengeDetailsModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!challenge) return null;

  const isChallenger = user?.id === challenge.challenger_id;
  const isOpponent = user?.id === challenge.opponent_id;
  const canRespond = isOpponent && challenge.status === 'pending';
  
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Chờ phản hồi', color: 'bg-yellow-100 text-yellow-800' };
      case 'accepted':
        return { text: 'Đã chấp nhận', color: 'bg-green-100 text-green-800' };
      case 'declined':
        return { text: 'Đã từ chối', color: 'bg-red-100 text-red-800' };
      case 'completed':
        return { text: 'Hoàn thành', color: 'bg-blue-100 text-blue-800' };
      case 'expired':
        return { text: 'Hết hạn', color: 'bg-gray-100 text-gray-800' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleResponse = async (response: 'accepted' | 'declined') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          status: response,
          response_message: responseMessage || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', challenge.id);

      if (error) throw error;

      toast.success(response === 'accepted' ? 'Đã chấp nhận thách đấu!' : 'Đã từ chối thách đấu!');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error responding to challenge:', error);
      toast.error('Lỗi khi phản hồi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!isChallenger) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challenge.id);

      if (error) throw error;

      toast.success('Đã hủy thách đấu!');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error cancelling challenge:', error);
      toast.error('Lỗi khi hủy thách đấu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = getStatusInfo(challenge.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Chi tiết thách đấu
            </span>
            <Badge className={statusInfo.color}>
              {statusInfo.text}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Players */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Challenger */}
            <div className="text-center space-y-2">
              <Avatar className="w-16 h-16 mx-auto">
                <AvatarImage src={challenge.challenger_profile?.avatar_url} />
                <AvatarFallback>
                  {challenge.challenger_profile?.full_name?.[0] || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {challenge.challenger_profile?.full_name || 'Người thách đấu'}
                </div>
                <div className="text-sm text-gray-500">
                  Hạng {challenge.challenger_profile?.current_rank || 'K'}
                </div>
                <div className="text-xs text-gray-400">
                  {challenge.challenger_profile?.spa_points || 0} SPA
                </div>
              </div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400 mb-2">VS</div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-800">
                  {challenge.bet_points} điểm
                </span>
              </div>
            </div>

            {/* Opponent */}
            <div className="text-center space-y-2">
              <Avatar className="w-16 h-16 mx-auto">
                <AvatarImage src={challenge.opponent_profile?.avatar_url} />
                <AvatarFallback>
                  {challenge.opponent_profile?.full_name?.[0] || 'O'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {challenge.opponent_profile?.full_name || 'Đối thủ'}
                </div>
                <div className="text-sm text-gray-500">
                  Hạng {challenge.opponent_profile?.current_rank || 'K'}
                </div>
                <div className="text-xs text-gray-400">
                  {challenge.opponent_profile?.spa_points || 0} SPA
                </div>
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Luật chơi: Race to {challenge.race_to}</span>
            </div>
            
            {challenge.club_profiles && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">{challenge.club_profiles.club_name}</div>
                  <div className="text-sm text-gray-600">{challenge.club_profiles.address}</div>
                </div>
              </div>
            )}

            {challenge.scheduled_time && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>
                  Thời gian: {new Date(challenge.scheduled_time).toLocaleString('vi-VN')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                Tạo: {new Date(challenge.created_at).toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                Hết hạn: {new Date(challenge.expires_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Original Message */}
          {challenge.message && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">Lời nhắn từ người thách đấu:</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                <p className="message-text">"{challenge.message}"</p>
              </div>
            </div>
          )}

          {/* Response Section */}
          {canRespond && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phản hồi (tùy chọn):</label>
                <Textarea
                  placeholder="Thêm lời nhắn phản hồi..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleResponse('declined')}
                  disabled={loading}
                  className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Từ chối
                </Button>
                <Button
                  onClick={() => handleResponse('accepted')}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Chấp nhận
                </Button>
              </div>
            </div>
          )}

          {/* Cancel Section for Challenger */}
          {isChallenger && challenge.status === 'pending' && (
            <div className="border-t pt-4">
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={loading}
                className="w-full"
              >
                Hủy thách đấu
              </Button>
            </div>
          )}

          {/* Close Button */}
          {!canRespond && !(isChallenger && challenge.status === 'pending') && (
            <div className="border-t pt-4">
              <Button variant="outline" onClick={onClose} className="w-full">
                Đóng
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeDetailsModal;