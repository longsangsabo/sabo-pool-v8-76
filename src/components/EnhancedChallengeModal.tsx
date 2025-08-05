import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Send,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface Opponent {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  current_rank: string;
  trust_percentage?: number;
}

interface Club {
  id: string;
  name: string;
  address: string;
}

interface EnhancedChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponent: Opponent | null;
}

const EnhancedChallengeModal = ({
  isOpen,
  onClose,
  opponent,
}: EnhancedChallengeModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bet_points: 50,
    message: '',
    scheduled_time: '',
    location: '',
    stake_type: 'friendly' as 'friendly' | 'money' | 'drinks',
    stake_amount: 0,
    club_id: '',
  });
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNearbyClubs();
    }
  }, [isOpen]);

  const fetchNearbyClubs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('clubs')
        .select('id, name, address')
        .eq('verified', true)
        .limit(10);

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || !opponent) return;

    // Validation
    if (formData.stake_type === 'money' && formData.stake_amount <= 0) {
      toast.error('Vui lòng nhập số tiền cược');
      return;
    }

    setLoading(true);

    try {
      const challengeData = {
        challenger_id: user.id,
        opponent_id: opponent.user_id,
        challenge_message: formData.message || null,
        status: 'pending',
      };

      const { error } = await supabase.from('challenges').insert(challengeData);

      if (error) throw error;

      toast.success('Đã gửi thách đấu!');
      handleClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Lỗi khi gửi thách đấu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      bet_points: 50,
      message: '',
      scheduled_time: '',
      location: '',
      stake_type: 'friendly',
      stake_amount: 0,
      club_id: '',
    });
    onClose();
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // At least 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  if (!opponent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center'>
            <Send className='w-5 h-5 mr-2' />
            Thách đấu {opponent.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Opponent Info */}
          <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
            <Avatar>
              <AvatarImage src={opponent.avatar_url} />
              <AvatarFallback>{opponent.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className='font-semibold'>{opponent.full_name}</h3>
              <p className='text-sm text-gray-600'>
                {opponent.current_rank}
                {opponent.trust_percentage && (
                  <span className='ml-2'>
                    • {opponent.trust_percentage}% tin cậy
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Bet Points */}
          <div>
            <Label className='text-base font-medium mb-3 block'>
              Điểm cược (Ranking Points)
            </Label>
            <div className='grid grid-cols-4 gap-2 mb-3'>
              {[25, 50, 100, 200].map(points => (
                <Button
                  key={points}
                  variant={
                    formData.bet_points === points ? 'default' : 'outline'
                  }
                  onClick={() =>
                    setFormData(prev => ({ ...prev, bet_points: points }))
                  }
                  className='h-12'
                >
                  {points}
                </Button>
              ))}
            </div>
            <Input
              type='range'
              min='10'
              max='500'
              step='5'
              value={formData.bet_points}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  bet_points: parseInt(e.target.value),
                }))
              }
              className='w-full'
            />
            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              <span>10</span>
              <span className='font-semibold'>{formData.bet_points} điểm</span>
              <span>500</span>
            </div>
          </div>

          {/* Stake Type */}
          <div>
            <Label className='text-base font-medium mb-3 block'>
              Loại cược
            </Label>
            <RadioGroup
              value={formData.stake_type}
              onValueChange={(value: 'friendly' | 'money' | 'drinks') =>
                setFormData(prev => ({
                  ...prev,
                  stake_type: value,
                  stake_amount: 0,
                }))
              }
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='friendly' id='friendly' />
                <Label htmlFor='friendly'>Giao hữu (không cược tiền)</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='drinks' id='drinks' />
                <Label htmlFor='drinks'>Cơm nước</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='money' id='money' />
                <Label htmlFor='money'>Cược tiền</Label>
              </div>
            </RadioGroup>

            {formData.stake_type === 'money' && (
              <div className='mt-3'>
                <Label htmlFor='stake_amount'>Số tiền cược (VNĐ)</Label>
                <Input
                  id='stake_amount'
                  type='number'
                  min='0'
                  step='10000'
                  value={formData.stake_amount}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      stake_amount: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder='100,000'
                />
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <Label
              htmlFor='scheduled_time'
              className='text-base font-medium mb-2 block'
            >
              <Calendar className='w-4 h-4 inline mr-2' />
              Thời gian đề xuất
            </Label>
            <Input
              id='scheduled_time'
              type='datetime-local'
              value={formData.scheduled_time}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  scheduled_time: e.target.value,
                }))
              }
              min={getMinDateTime()}
            />
          </div>

          {/* Location Options */}
          <div className='space-y-3'>
            <Label className='text-base font-medium block'>
              <MapPin className='w-4 h-4 inline mr-2' />
              Địa điểm
            </Label>

            <Select
              value={formData.club_id}
              onValueChange={value =>
                setFormData(prev => ({
                  ...prev,
                  club_id: value,
                  location: value ? '' : prev.location,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Chọn câu lạc bộ' />
              </SelectTrigger>
              <SelectContent>
                {clubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>
                    <div>
                      <div className='font-medium'>{club.name}</div>
                      <div className='text-sm text-gray-500'>
                        {club.address}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='text-center text-sm text-gray-500'>hoặc</div>

            <div>
              <Label htmlFor='custom_location'>Địa điểm khác</Label>
              <Input
                id='custom_location'
                value={formData.location}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    location: e.target.value,
                    club_id: e.target.value ? '' : prev.club_id,
                  }))
                }
                placeholder='Nhập địa chỉ tự chọn...'
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <Label
              htmlFor='message'
              className='text-base font-medium mb-2 block'
            >
              Lời nhắn (tùy chọn)
            </Label>
            <Textarea
              id='message'
              value={formData.message}
              onChange={e =>
                setFormData(prev => ({ ...prev, message: e.target.value }))
              }
              placeholder='Gửi lời thách đấu...'
              rows={3}
              maxLength={200}
            />
            <p className='text-xs text-gray-500 mt-1'>
              {formData.message.length}/200 ký tự
            </p>
          </div>

          {/* Warning for money stakes */}
          {formData.stake_type === 'money' && formData.stake_amount > 0 && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
              <div className='flex'>
                <AlertCircle className='w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5' />
                <div className='text-xs text-yellow-800'>
                  <strong>Lưu ý:</strong> Đây là trận đấu có cược tiền thật. Hãy
                  chắc chắn bạn và đối thủ đều đồng ý về số tiền cược trước khi
                  bắt đầu.
                </div>
              </div>
            </div>
          )}

          {/* Auto-expire info */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
            <div className='flex'>
              <Clock className='w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5' />
              <div className='text-xs text-blue-800'>
                Thách đấu sẽ tự động hết hạn sau 48 giờ nếu không được phản hồi.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3'>
            <Button
              variant='outline'
              onClick={handleClose}
              className='flex-1'
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className='flex-1'
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Gửi thách đấu'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedChallengeModal;
