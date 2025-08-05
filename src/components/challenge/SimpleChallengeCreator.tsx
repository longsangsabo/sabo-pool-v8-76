import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SimpleChallengeForm {
  opponent_id: string;
  bet_points: number;
  message: string;
  scheduled_time: string;
}

interface SimpleChallenge {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SimpleChallengeCreator: React.FC<SimpleChallenge> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<SimpleChallengeForm>({
    opponent_id: '',
    bet_points: 100,
    message: '',
    scheduled_time: '',
  });

  const [opponents, setOpponents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOpponents();
  }, []);

  const fetchOpponents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name')
        .neq('user_id', user.id)
        .limit(20);

      if (error) throw error;
      setOpponents(data || []);
    } catch (error) {
      console.error('Failed to fetch opponents:', error);
    }
  };

  const updateField = (field: keyof SimpleChallengeForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (!formData.opponent_id || !formData.scheduled_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.bet_points < 100 || formData.bet_points > 650) {
      toast.error('Bet points must be between 100 and 650');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from('challenges').insert([
        {
          challenger_id: (await supabase.auth.getUser()).data.user?.id,
          opponent_id: formData.opponent_id,
          bet_points: formData.bet_points,
          challenge_message: formData.message,
          scheduled_time: formData.scheduled_time,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      toast.success('Challenge created successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Challenge creation failed:', error);
      toast.error('Failed to create challenge');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Challenge</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='opponent'>Opponent</Label>
            <Select
              value={formData.opponent_id}
              onValueChange={value => updateField('opponent_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select opponent' />
              </SelectTrigger>
              <SelectContent>
                {opponents.map(opponent => (
                  <SelectItem key={opponent.user_id} value={opponent.user_id}>
                    {opponent.full_name || opponent.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='bet_points'>Bet Points</Label>
              <Input
                id='bet_points'
                type='number'
                min='100'
                max='650'
                value={formData.bet_points}
                onChange={e =>
                  updateField('bet_points', parseInt(e.target.value))
                }
                required
              />
            </div>

            <div>
              <Label htmlFor='scheduled_time'>Scheduled Time</Label>
              <Input
                id='scheduled_time'
                type='datetime-local'
                value={formData.scheduled_time}
                onChange={e => updateField('scheduled_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor='message'>Message (Optional)</Label>
            <Textarea
              id='message'
              value={formData.message}
              onChange={e => updateField('message', e.target.value)}
              placeholder='Add a message to your challenge...'
            />
          </div>

          <div className='flex gap-2'>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Challenge'}
            </Button>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleChallengeCreator;
