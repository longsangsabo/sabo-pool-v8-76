import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Users, Globe, Target } from 'lucide-react';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [challengeType, setChallengeType] = useState<'direct' | 'open'>('direct');
  
  const [formData, setFormData] = useState({
    opponent_id: '',
    opponent_search: '',
    bet_points: 100,
    race_to: 8,
    message: '',
    club_id: '',
    scheduled_time: '',
    is_sabo: false,
    handicap_1_rank: 0,
    handicap_05_rank: 0
  });

  // Search opponents
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const saboConfigs = [
    { bet_range: { min: 100, max: 150 }, race_to: 8, handicap_1_rank: 1, handicap_05_rank: 0.5 },
    { bet_range: { min: 200, max: 250 }, race_to: 12, handicap_1_rank: 1.5, handicap_05_rank: 1 },
    { bet_range: { min: 300, max: 350 }, race_to: 14, handicap_1_rank: 2, handicap_05_rank: 1.5 },
    { bet_range: { min: 400, max: 450 }, race_to: 16, handicap_1_rank: 2.5, handicap_05_rank: 1.5 },
    { bet_range: { min: 500, max: 550 }, race_to: 18, handicap_1_rank: 3, handicap_05_rank: 2 },
    { bet_range: { min: 600, max: 650 }, race_to: 22, handicap_1_rank: 3.5, handicap_05_rank: 2.5 }
  ];

  const handleBetPointsChange = (value: number) => {
    const config = saboConfigs.find(c => value >= c.bet_range.min && value <= c.bet_range.max);
    
    setFormData(prev => ({
      ...prev,
      bet_points: value,
      race_to: config?.race_to || 8,
      handicap_1_rank: formData.is_sabo ? (config?.handicap_1_rank || 0) : 0,
      handicap_05_rank: formData.is_sabo ? (config?.handicap_05_rank || 0) : 0
    }));
  };

  const searchOpponents = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 SEARCH DEBUG: Starting search for:', searchTerm);
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, avatar_url, verified_rank')
        .or(`full_name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .neq('user_id', user?.id)
        .order('verified_rank', { ascending: false, nullsFirst: false })
        .limit(10);

      console.log('🔍 SEARCH DEBUG: Query result:', { data, error });
      
      if (error) throw error;
      setSearchResults(data || []);
      console.log('🔍 SEARCH DEBUG: Search results set:', data?.length || 0, 'results');
    } catch (error) {
      console.error('Error searching opponents:', error);
      toast.error('Lỗi khi tìm kiếm đối thủ');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (challengeType === 'direct' && !formData.opponent_id) {
      toast.error('Vui lòng chọn đối thủ');
      return;
    }

    if (formData.bet_points < 100 || formData.bet_points > 650) {
      toast.error('Điểm cược phải từ 100 đến 650');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Creating challenge with data:', formData);
      
      const challengeData = {
        challenger_id: user.id,
        opponent_id: challengeType === 'direct' ? formData.opponent_id : null,
        bet_points: formData.bet_points,
        race_to: formData.race_to,
        message: formData.message || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        // Fix: Convert handicap values to strings as expected by the database
        handicap_1_rank: formData.is_sabo ? formData.handicap_1_rank.toString() : null,
        handicap_05_rank: formData.is_sabo ? formData.handicap_05_rank.toString() : null,
        is_open_challenge: challengeType === 'open'
      };

      console.log('📊 Final challenge data:', challengeData);

      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert(challengeData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Challenge created successfully:', challenge);

      // Send notification to opponent (for direct challenges)
      if (challengeType === 'direct' && formData.opponent_id) {
        try {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: formData.opponent_id,
              type: 'challenge_received',
              title: 'Thách đấu mới',
              message: `Bạn có một thách đấu mới với mức cược ${formData.bet_points} điểm SPA`,
              priority: 'high',
              action_url: `/challenges/${challenge.id}`
            });

          if (notificationError) {
            console.error('❌ Notification error:', notificationError);
          } else {
            console.log('📬 Notification sent to opponent');
          }
        } catch (notifError) {
          console.error('❌ Failed to send notification:', notifError);
          // Don't fail the whole challenge creation for notification errors
        }
      }

      toast.success(
        challengeType === 'open' 
          ? 'Đã tạo thách đấu mở thành công!' 
          : 'Đã gửi thách đấu thành công!'
      );
      
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        opponent_id: '',
        opponent_search: '',
        bet_points: 100,
        race_to: 8,
        message: '',
        club_id: '',
        scheduled_time: '',
        is_sabo: false,
        handicap_1_rank: 0,
        handicap_05_rank: 0
      });
      setChallengeType('direct');
      
    } catch (error) {
      console.error('❌ Error creating challenge:', error);
      toast.error('Lỗi khi tạo thách đấu: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Tạo thách đấu mới
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Challenge Type Selection */}
          <div className="space-y-3">
            <Label>Loại thách đấu</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={challengeType === 'direct' ? 'default' : 'outline'}
                onClick={() => setChallengeType('direct')}
                className="h-16 flex-col gap-1"
              >
                <Users className="w-5 h-5" />
                <span>Thách đấu trực tiếp</span>
              </Button>
              <Button
                type="button"
                variant={challengeType === 'open' ? 'default' : 'outline'}
                onClick={() => setChallengeType('open')}
                className="h-16 flex-col gap-1"
              >
                <Globe className="w-5 h-5" />
                <span>Thách đấu mở</span>
              </Button>
            </div>
          </div>

          {/* Opponent Selection (only for direct challenges) */}
          {challengeType === 'direct' && (
            <div className="space-y-3">
              <Label htmlFor="opponent_search">Chọn đối thủ</Label>
              <div className="space-y-2">
                <Input
                  id="opponent_search"
                  placeholder="Tìm kiếm người chơi..."
                  value={formData.opponent_search}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, opponent_search: e.target.value }));
                    searchOpponents(e.target.value);
                  }}
                />
                
                {searching && (
                  <div className="text-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.map(result => (
                      <div
                        key={result.user_id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                          formData.opponent_id === result.user_id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          opponent_id: result.user_id,
                          opponent_search: result.full_name
                        }))}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={result.avatar_url} alt={result.full_name} />
                            <AvatarFallback className="text-sm font-medium">
                              {result.full_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{result.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Hạng: {result.verified_rank || 'Chưa xác minh'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SABO System Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Hệ thống SABO</Label>
              <p className="text-sm text-muted-foreground">
                Sử dụng handicap chuyên nghiệp
              </p>
            </div>
            <Switch
              checked={formData.is_sabo}
              onCheckedChange={(checked) => {
                setFormData(prev => ({ ...prev, is_sabo: checked }));
                if (checked) {
                  handleBetPointsChange(formData.bet_points);
                }
              }}
            />
          </div>

          {/* Bet Points */}
          <div className="space-y-3">
            <Label htmlFor="bet_points">Điểm cược (100-650 SPA)</Label>
            <Select
              value={formData.bet_points.toString()}
              onValueChange={(value) => handleBetPointsChange(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 điểm - Race to 8</SelectItem>
                <SelectItem value="200">200 điểm - Race to 12</SelectItem>
                <SelectItem value="300">300 điểm - Race to 14</SelectItem>
                <SelectItem value="400">400 điểm - Race to 16</SelectItem>
                <SelectItem value="500">500 điểm - Race to 18</SelectItem>
                <SelectItem value="600">600 điểm - Race to 22</SelectItem>
              </SelectContent>
            </Select>
            
            {formData.is_sabo && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <strong>SABO Handicap:</strong> 1.0 rank: {formData.handicap_1_rank} • 0.5 rank: {formData.handicap_05_rank}
              </div>
            )}
          </div>

          {/* Scheduled Time */}
          <div className="space-y-3">
            <Label htmlFor="scheduled_time">Thời gian thi đấu (tùy chọn)</Label>
            <Input
              id="scheduled_time"
              type="datetime-local"
              value={formData.scheduled_time}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
            />
          </div>

          {/* Message */}
          <div className="space-y-3">
            <Label htmlFor="message">Lời nhắn (tùy chọn)</Label>
            <Textarea
              id="message"
              placeholder="Viết lời nhắn cho đối thủ..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || (challengeType === 'direct' && !formData.opponent_id)}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {challengeType === 'open' ? 'Tạo thách đấu mở' : 'Gửi thách đấu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeModal;