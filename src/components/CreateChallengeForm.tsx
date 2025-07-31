import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Swords, Target, Users, Calendar, MapPin } from 'lucide-react';
import {
  CreateChallengeRequest,
  getChallengeConfig,
  isValidBetPoints,
  CHALLENGE_CONFIGS,
} from '../types/challenge';
import { Club } from '../types/tournament';
import { supabase } from '../integrations/supabase/client';

interface CreateChallengeFormProps {
  onChallengeCreated?: (challenge: any) => void;
  onCancel?: () => void;
}

export const CreateChallengeForm: React.FC<CreateChallengeFormProps> = ({
  onChallengeCreated,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateChallengeRequest>({
    opponent_id: '',
    club_id: '',
    bet_points: 100,
    scheduled_time: '',
    message: '',
  });

  const [opponents, setOpponents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConfig = getChallengeConfig(formData.bet_points);

  useEffect(() => {
    fetchOpponents();
    fetchClubs();
  }, []);

  const fetchOpponents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .order('full_name');

      if (error) throw error;
      setOpponents(data || []);
    } catch (err) {
      console.error('Failed to fetch opponents:', err);
    }
  };

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (error) throw error;
      setClubs(data || []);
    } catch (err) {
      console.error('Failed to fetch clubs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isValidBetPoints(formData.bet_points)) {
        throw new Error('Điểm cược phải từ 100 đến 650');
      }

      if (!formData.opponent_id) {
        throw new Error('Vui lòng chọn đối thủ');
      }

      if (!formData.club_id) {
        throw new Error('Vui lòng chọn CLB');
      }

      const { data, error } = await supabase
        .from('challenges')
        .insert([
          {
            challenger_id: (await supabase.auth.getUser()).data.user?.id,
            opponent_id: formData.opponent_id,
            challenge_message: formData.message,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      onChallengeCreated?.(data);

      // Reset form
      setFormData({
        opponent_id: '',
        club_id: '',
        bet_points: 100,
        scheduled_time: '',
        message: '',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create challenge'
      );
    } finally {
      setLoading(false);
    }
  };

  const getBetPointsColor = (betPoints: number) => {
    if (betPoints >= 600)
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (betPoints >= 500)
      return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
    if (betPoints >= 400)
      return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
    if (betPoints >= 300)
      return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
    if (betPoints >= 200)
      return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
  };

  return (
    <Card className='w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Swords className='w-5 h-5 text-red-600' />
          Tạo Thách Đấu Mới
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Opponent Selection */}
          <div className='space-y-2'>
            <Label htmlFor='opponent'>Chọn đối thủ</Label>
            <Select
              value={formData.opponent_id}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, opponent_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Chọn đối thủ...' />
              </SelectTrigger>
              <SelectContent>
                {opponents.map(opponent => (
                  <SelectItem key={opponent.user_id} value={opponent.user_id}>
                    <div className='flex items-center gap-2'>
                      <span>{opponent.full_name}</span>
                      <Badge variant='outline'>{opponent.current_rank}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Club Selection */}
          <div className='space-y-2'>
            <Label htmlFor='club'>Chọn CLB</Label>
            <Select
              value={formData.club_id}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, club_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Chọn CLB...' />
              </SelectTrigger>
              <SelectContent>
                {clubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>
                    <div className='flex items-center gap-2'>
                      <MapPin className='w-4 h-4' />
                      <span>{club.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bet Points Selection */}
          <div className='space-y-2'>
            <Label>Điểm cược</Label>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
              {CHALLENGE_CONFIGS.map(config => (
                <div
                  key={config.bet_range.min}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.bet_points >= config.bet_range.min &&
                    formData.bet_points <= config.bet_range.max
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      bet_points: config.bet_range.min,
                    }))
                  }
                >
                  <div className='text-center'>
                    <Badge className={getBetPointsColor(config.bet_range.min)}>
                      {config.bet_range.min}-{config.bet_range.max}
                    </Badge>
                    <div className='text-sm font-medium mt-1'>
                      Race to {config.race_to}
                    </div>
                    <div className='text-xs text-gray-600'>
                      Chấp: {config.handicap_1_rank}/{config.handicap_05_rank}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge Configuration Display */}
          {currentConfig && (
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <Target className='w-5 h-5 text-blue-600' />
                <span className='font-semibold text-blue-800'>
                  Cấu hình thách đấu
                </span>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div>
                  <div className='text-blue-700 font-medium'>Điểm cược:</div>
                  <div className='text-blue-600 font-bold'>
                    {formData.bet_points}
                  </div>
                </div>
                <div>
                  <div className='text-blue-700 font-medium'>Race to:</div>
                  <div className='text-blue-600 font-bold'>
                    {currentConfig.race_to}
                  </div>
                </div>
                <div>
                  <div className='text-blue-700 font-medium'>Chấp 1 hạng:</div>
                  <div className='text-blue-600 font-bold'>
                    {currentConfig.handicap_1_rank}
                  </div>
                </div>
                <div>
                  <div className='text-blue-700 font-medium'>
                    Chấp 0.5 hạng:
                  </div>
                  <div className='text-blue-600 font-bold'>
                    {currentConfig.handicap_05_rank}
                  </div>
                </div>
              </div>

              <div className='mt-3 text-xs text-blue-600'>
                {currentConfig.description}
              </div>
            </div>
          )}

          {/* Scheduled Time */}
          <div className='space-y-2'>
            <Label htmlFor='scheduled_time'>Thời gian dự kiến (tùy chọn)</Label>
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
            />
          </div>

          {/* Message */}
          <div className='space-y-2'>
            <Label htmlFor='message'>Lời nhắn (tùy chọn)</Label>
            <Textarea
              id='message'
              placeholder='Nhắn gì đó cho đối thủ...'
              value={formData.message}
              onChange={e =>
                setFormData(prev => ({ ...prev, message: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm'>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className='flex gap-3'>
            <Button type='submit' className='flex-1' disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo thách đấu'}
            </Button>

            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={loading}
              >
                Hủy
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
