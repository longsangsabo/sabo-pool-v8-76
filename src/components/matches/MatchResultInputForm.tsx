import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarIcon,
  Trophy,
  Users,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useMatchResults } from '@/hooks/useMatchResults';
import { MatchResultFormData } from '@/types/matchResult';
import { useToast } from '@/hooks/use-toast';

const matchResultSchema = z
  .object({
    tournament_id: z.string().optional(),
    player1_id: z.string().min(1, 'Vui lòng chọn người chơi 1'),
    player2_id: z.string().min(1, 'Vui lòng chọn người chơi 2'),
    player1_score: z
      .number()
      .min(0, 'Điểm số không hợp lệ')
      .max(50, 'Điểm số quá lớn'),
    player2_score: z
      .number()
      .min(0, 'Điểm số không hợp lệ')
      .max(50, 'Điểm số quá lớn'),
    match_format: z.enum([
      'race_to_5',
      'race_to_7',
      'race_to_9',
      'race_to_10',
      'race_to_11',
    ]),
    match_date: z.string().min(1, 'Vui lòng chọn ngày thi đấu'),
    duration_minutes: z.number().optional(),
    club_id: z.string().optional(),
    referee_id: z.string().optional(),
    match_notes: z.string().optional(),
    // Player stats
    player1_longest_run: z.number().optional(),
    player1_total_shots: z.number().optional(),
    player1_potting_percentage: z.number().min(0).max(100).optional(),
    player1_safety_shots: z.number().optional(),
    player1_fouls: z.number().optional(),
    player2_longest_run: z.number().optional(),
    player2_total_shots: z.number().optional(),
    player2_potting_percentage: z.number().min(0).max(100).optional(),
    player2_safety_shots: z.number().optional(),
    player2_fouls: z.number().optional(),
  })
  .refine(data => data.player1_id !== data.player2_id, {
    message: 'Không thể chọn cùng một người chơi',
    path: ['player2_id'],
  })
  .refine(data => data.player1_score !== data.player2_score, {
    message: 'Không thể có điểm hòa trong hệ thống này',
    path: ['player2_score'],
  });

type FormData = z.infer<typeof matchResultSchema>;

interface Player {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  verified_rank?: string;
  elo?: number;
}

interface Club {
  id: string;
  club_name: string;
  address: string;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface MatchResultInputFormProps {
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
  initialData?: Partial<MatchResultFormData>;
}

export const MatchResultInputForm: React.FC<MatchResultInputFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [searchPlayer1, setSearchPlayer1] = useState('');
  const [searchPlayer2, setSearchPlayer2] = useState('');

  const { createMatchResult, loading } = useMatchResults();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(matchResultSchema),
    defaultValues: {
      match_format: 'race_to_5',
      match_date: new Date().toISOString().split('T')[0],
      player1_score: 0,
      player2_score: 0,
      ...initialData,
    },
  });

  const watchedValues = watch();
  const selectedPlayer1 = players.find(
    p => p.user_id === watchedValues.player1_id
  );
  const selectedPlayer2 = players.find(
    p => p.user_id === watchedValues.player2_id
  );

  // Fetch players, clubs, and tournaments
  useEffect(() => {
    fetchPlayers();
    fetchClubs();
    fetchActiveTournaments();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, verified_rank, elo')
        .order('display_name');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('id, club_name, address')
        .order('club_name');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const fetchActiveTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status')
        .in('status', ['ongoing', 'registration_open'])
        .order('name');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const getFilteredPlayers = (searchTerm: string, excludeId?: string) => {
    return players.filter(
      player =>
        player.user_id !== excludeId &&
        player.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getMatchFormatLabel = (format: string) => {
    const labels = {
      race_to_5: 'Race to 5',
      race_to_7: 'Race to 7',
      race_to_9: 'Race to 9',
      race_to_10: 'Race to 10',
      race_to_11: 'Race to 11',
    };
    return labels[format as keyof typeof labels] || format;
  };

  const getWinnerInfo = () => {
    if (watchedValues.player1_score > watchedValues.player2_score) {
      return { winner: selectedPlayer1, isPlayer1Winner: true };
    } else if (watchedValues.player2_score > watchedValues.player1_score) {
      return { winner: selectedPlayer2, isPlayer1Winner: false };
    }
    return { winner: null, isPlayer1Winner: false };
  };

  const onSubmit = async (data: FormData) => {
    try {
      const formData: MatchResultFormData = {
        tournament_id: data.tournament_id,
        player1_id: data.player1_id,
        player2_id: data.player2_id,
        player1_score: data.player1_score,
        player2_score: data.player2_score,
        match_format: data.match_format,
        match_date: data.match_date,
        duration_minutes: data.duration_minutes,
        club_id: data.club_id,
        referee_id: data.referee_id,
        match_notes: data.match_notes,
        player1_stats: {
          longest_run: data.player1_longest_run,
          total_shots: data.player1_total_shots,
          potting_percentage: data.player1_potting_percentage,
          safety_shots: data.player1_safety_shots,
          fouls: data.player1_fouls,
        },
        player2_stats: {
          longest_run: data.player2_longest_run,
          total_shots: data.player2_total_shots,
          potting_percentage: data.player2_potting_percentage,
          safety_shots: data.player2_safety_shots,
          fouls: data.player2_fouls,
        },
      };

      const result = await createMatchResult(formData);
      if (result) {
        onSuccess?.(result);
        reset();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const winnerInfo = getWinnerInfo();

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-6 w-6 text-primary' />
            Nhập Kết Quả Trận Đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Tournament Selection */}
            <div className='space-y-2'>
              <Label htmlFor='tournament'>Giải đấu (tùy chọn)</Label>
              <Select
                value={watchedValues.tournament_id || ''}
                onValueChange={value =>
                  setValue('tournament_id', value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn giải đấu...' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>Trận đấu thường</SelectItem>
                  {tournaments.map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                      <Badge variant='outline' className='ml-2'>
                        {tournament.status === 'ongoing'
                          ? 'Đang diễn ra'
                          : 'Mở đăng ký'}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Player Selection */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Player 1 */}
              <div className='space-y-3'>
                <Label>Người chơi 1</Label>
                <div className='space-y-2'>
                  <Input
                    placeholder='Tìm kiếm người chơi...'
                    value={searchPlayer1}
                    onChange={e => setSearchPlayer1(e.target.value)}
                  />
                  {searchPlayer1 && (
                    <div className='border rounded-lg max-h-40 overflow-y-auto'>
                      {getFilteredPlayers(
                        searchPlayer1,
                        watchedValues.player2_id
                      )
                        .slice(0, 5)
                        .map(player => (
                          <div
                            key={player.user_id}
                            className='p-2 hover:bg-muted cursor-pointer flex items-center gap-2'
                            onClick={() => {
                              setValue('player1_id', player.user_id);
                              setSearchPlayer1('');
                            }}
                          >
                            <Avatar className='h-8 w-8'>
                              <AvatarImage src={player.avatar_url} />
                              <AvatarFallback>
                                {player.display_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='font-medium'>
                                {player.display_name}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                {player.verified_rank} • ELO:{' '}
                                {player.elo || 1000}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  {selectedPlayer1 && (
                    <div className='p-3 border rounded-lg bg-muted/50'>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={selectedPlayer1.avatar_url} />
                          <AvatarFallback>
                            {selectedPlayer1.display_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>
                            {selectedPlayer1.display_name}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Hạng: {selectedPlayer1.verified_rank} • ELO:{' '}
                            {selectedPlayer1.elo || 1000}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {errors.player1_id && (
                  <p className='text-sm text-destructive'>
                    {errors.player1_id.message}
                  </p>
                )}
              </div>

              {/* Player 2 */}
              <div className='space-y-3'>
                <Label>Người chơi 2</Label>
                <div className='space-y-2'>
                  <Input
                    placeholder='Tìm kiếm người chơi...'
                    value={searchPlayer2}
                    onChange={e => setSearchPlayer2(e.target.value)}
                  />
                  {searchPlayer2 && (
                    <div className='border rounded-lg max-h-40 overflow-y-auto'>
                      {getFilteredPlayers(
                        searchPlayer2,
                        watchedValues.player1_id
                      )
                        .slice(0, 5)
                        .map(player => (
                          <div
                            key={player.user_id}
                            className='p-2 hover:bg-muted cursor-pointer flex items-center gap-2'
                            onClick={() => {
                              setValue('player2_id', player.user_id);
                              setSearchPlayer2('');
                            }}
                          >
                            <Avatar className='h-8 w-8'>
                              <AvatarImage src={player.avatar_url} />
                              <AvatarFallback>
                                {player.display_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='font-medium'>
                                {player.display_name}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                {player.verified_rank} • ELO:{' '}
                                {player.elo || 1000}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  {selectedPlayer2 && (
                    <div className='p-3 border rounded-lg bg-muted/50'>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={selectedPlayer2.avatar_url} />
                          <AvatarFallback>
                            {selectedPlayer2.display_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>
                            {selectedPlayer2.display_name}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Hạng: {selectedPlayer2.verified_rank} • ELO:{' '}
                            {selectedPlayer2.elo || 1000}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {errors.player2_id && (
                  <p className='text-sm text-destructive'>
                    {errors.player2_id.message}
                  </p>
                )}
              </div>
            </div>

            {/* Match Format and Date */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label>Hình thức thi đấu</Label>
                <Select
                  value={watchedValues.match_format}
                  onValueChange={value =>
                    setValue('match_format', value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='race_to_5'>Race to 5</SelectItem>
                    <SelectItem value='race_to_7'>Race to 7</SelectItem>
                    <SelectItem value='race_to_9'>Race to 9</SelectItem>
                    <SelectItem value='race_to_10'>Race to 10</SelectItem>
                    <SelectItem value='race_to_11'>Race to 11</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Ngày thi đấu</Label>
                <Input type='datetime-local' {...register('match_date')} />
                {errors.match_date && (
                  <p className='text-sm text-destructive'>
                    {errors.match_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Score Input */}
            <div className='space-y-4'>
              <Label className='text-lg font-semibold'>Kết quả thi đấu</Label>
              <div className='grid grid-cols-3 gap-4 items-center'>
                <div className='text-center'>
                  <Label className='text-sm font-medium'>
                    {selectedPlayer1?.display_name || 'Người chơi 1'}
                  </Label>
                  <Input
                    type='number'
                    min='0'
                    max='50'
                    {...register('player1_score', { valueAsNumber: true })}
                    className='text-center text-2xl font-bold mt-2'
                  />
                  {errors.player1_score && (
                    <p className='text-sm text-destructive mt-1'>
                      {errors.player1_score.message}
                    </p>
                  )}
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-muted-foreground'>
                    VS
                  </div>
                </div>

                <div className='text-center'>
                  <Label className='text-sm font-medium'>
                    {selectedPlayer2?.display_name || 'Người chơi 2'}
                  </Label>
                  <Input
                    type='number'
                    min='0'
                    max='50'
                    {...register('player2_score', { valueAsNumber: true })}
                    className='text-center text-2xl font-bold mt-2'
                  />
                  {errors.player2_score && (
                    <p className='text-sm text-destructive mt-1'>
                      {errors.player2_score.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Winner Display */}
              {winnerInfo.winner && (
                <div className='text-center p-4 bg-primary/10 border border-primary/20 rounded-lg'>
                  <div className='flex items-center justify-center gap-2 mb-2'>
                    <Trophy className='h-5 w-5 text-primary' />
                    <span className='font-semibold text-primary'>
                      Người thắng cuộc
                    </span>
                  </div>
                  <div className='flex items-center justify-center gap-3'>
                    <Avatar>
                      <AvatarImage src={winnerInfo.winner.avatar_url} />
                      <AvatarFallback>
                        {winnerInfo.winner.display_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-bold'>
                        {winnerInfo.winner.display_name}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Hạng: {winnerInfo.winner.verified_rank}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label>Câu lạc bộ (tùy chọn)</Label>
                <Select
                  value={watchedValues.club_id || ''}
                  onValueChange={value =>
                    setValue('club_id', value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn câu lạc bộ...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>Không có</SelectItem>
                    {clubs.map(club => (
                      <SelectItem key={club.id} value={club.id}>
                        <div>
                          <div className='font-medium'>{club.club_name}</div>
                          <div className='text-sm text-muted-foreground'>
                            {club.address}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Thời gian thi đấu (phút)</Label>
                <Input
                  type='number'
                  min='1'
                  max='300'
                  placeholder='Ví dụ: 45'
                  {...register('duration_minutes', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Advanced Stats Toggle */}
            <div className='space-y-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                className='w-full'
              >
                <Target className='h-4 w-4 mr-2' />
                {showAdvancedStats
                  ? 'Ẩn thống kê chi tiết'
                  : 'Thêm thống kê chi tiết'}
              </Button>

              {showAdvancedStats && (
                <div className='space-y-6 p-4 border rounded-lg bg-muted/20'>
                  <h3 className='font-semibold text-lg'>Thống kê chi tiết</h3>

                  {/* Player 1 Stats */}
                  <div className='space-y-4'>
                    <h4 className='font-medium'>
                      Thống kê của{' '}
                      {selectedPlayer1?.display_name || 'Người chơi 1'}
                    </h4>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                      <div className='space-y-2'>
                        <Label className='text-sm'>Run dài nhất</Label>
                        <Input
                          type='number'
                          min='0'
                          {...register('player1_longest_run', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm'>Tổng số shot</Label>
                        <Input
                          type='number'
                          min='0'
                          {...register('player1_total_shots', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm'>% Pot thành công</Label>
                        <Input
                          type='number'
                          min='0'
                          max='100'
                          {...register('player1_potting_percentage', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm'>Shot an toàn</Label>
                        <Input
                          type='number'
                          min='0'
                          {...register('player1_safety_shots', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm'>Số lỗi</Label>
                        <Input
                          type='number'
                          min='0'
                          {...register('player1_fouls', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Player 2 Stats */}
                  <div className='space-y-4'>
                    <h4 className='font-medium'>
                      Thống kê của{' '}
                      {selectedPlayer2?.display_name || 'Người chơi 2'}
                    </h4>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                      <div className='space-y-2'>
                        <Label className='text-sm'>Run dài nhất</Label>
                        <Input
                          type='number'
                          min='0'
                          {...register('player2_longest_run', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm'>Tổng số shot</Label>
                        <Input
                          type='number'
                          min='0'
                          {...register('player2_total_shots', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm'>% Pot thành công</Label>
                        <Input
                          type='number'
                          min='0'
                          max='100'
                          {...register('player2_potting_percentage', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm'>Shot an toàn</Label>
                        <Input
                          type='number'
                          min='0'
                          {...register('player2_safety_shots', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm'>Số lỗi</Label>
                        <Input
                          type='number'
                          min='0'
                          {...register('player2_fouls', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Match Notes */}
            <div className='space-y-2'>
              <Label>Ghi chú về trận đấu (tùy chọn)</Label>
              <Textarea
                placeholder='Ghi chú về trận đấu, điều kiện thi đấu, hoặc những điểm đặc biệt...'
                {...register('match_notes')}
                className='min-h-20'
              />
            </div>

            {/* Validation Summary */}
            {!isValid && Object.keys(errors).length > 0 && (
              <div className='p-4 bg-destructive/10 border border-destructive/20 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <AlertCircle className='h-4 w-4 text-destructive' />
                  <span className='font-medium text-destructive'>
                    Vui lòng kiểm tra lại thông tin
                  </span>
                </div>
                <ul className='text-sm text-destructive space-y-1'>
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Form Actions */}
            <div className='flex gap-4 pt-4'>
              <Button
                type='submit'
                disabled={loading || !isValid}
                className='flex-1'
              >
                {loading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Tạo Kết Quả
                  </>
                )}
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
    </div>
  );
};
