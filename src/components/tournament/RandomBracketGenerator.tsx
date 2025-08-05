import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Shuffle,
  Trophy,
  Users,
  Target,
  RefreshCw,
  Save,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Player {
  id: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  elo: number;
  rank?: string;
}

interface BracketMatch {
  round: number;
  match_number: number;
  player1: Player | null;
  player2: Player | null;
}

const RandomBracketGenerator = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [tournamentSize, setTournamentSize] = useState<number>(8);
  const [bracketType, setBracketType] = useState<
    'single_elimination' | 'double_elimination'
  >('single_elimination');
  const [generatedBracket, setGeneratedBracket] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();

    // Add Real-time Subscription for tournaments
    const channel = supabase
      .channel('tournament-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
        },
        payload => {
          console.log('🔄 Tournament updated:', payload);
          // Refresh tournament list
          fetchTournaments();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from tournament updates');
      channel.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (selectedTournament) {
      console.log('🎯 Selected tournament changed:', selectedTournament);
      fetchTournamentParticipants();

      // Add Real-time Subscription for tournament registrations
      const regChannel = supabase
        .channel('tournament-registrations-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tournament_registrations',
            filter: `tournament_id=eq.${selectedTournament}`,
          },
          payload => {
            console.log('🔄 Tournament registration updated:', payload);
            // Refresh participants list
            fetchTournamentParticipants();
          }
        )
        .subscribe();

      return () => {
        console.log('🔌 Unsubscribing from registration updates');
        regChannel.unsubscribe();
      };
    } else {
      setAvailablePlayers([]);
      setSelectedPlayers([]);
    }
  }, [selectedTournament]);

  // Debug logging for component state
  useEffect(() => {
    console.log('🔍 Component state:', {
      tournamentsCount: tournaments?.length,
      selectedTournament: selectedTournament,
      availablePlayersCount: availablePlayers?.length,
      selectedPlayersCount: selectedPlayers?.length,
      buttonDisabled: selectedPlayers.length < 2,
      generatedBracketCount: generatedBracket?.length,
    });
  }, [
    tournaments,
    selectedTournament,
    availablePlayers,
    selectedPlayers,
    generatedBracket,
  ]);

  const fetchTournaments = async () => {
    if (!user) return;

    try {
      console.log('🔄 Fetching tournaments...');

      const { data: clubData } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('🏢 Club data:', clubData);

      if (clubData) {
        const { data: tournaments, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('club_id', clubData.id)
          .in('status', ['registration_open', 'registration_closed', 'ongoing']) // ← Add ongoing status
          .order('created_at', { ascending: false });

        console.log('📊 Tournaments loaded:', tournaments?.length, tournaments);

        if (error) {
          console.error('❌ Error fetching tournaments:', error);
          toast.error('Lỗi khi tải danh sách giải đấu: ' + error.message);
          return;
        }

        setTournaments(tournaments || []);
      }
    } catch (error) {
      console.error('💥 Error fetching tournaments:', error);
      toast.error('Lỗi khi tải danh sách giải đấu');
    }
  };

  const fetchTournamentParticipants = async () => {
    if (!selectedTournament) return;

    try {
      console.log(
        '🔄 Fetching tournament participants for:',
        selectedTournament
      );

      const { data: participants, error } = await supabase
        .from('tournament_registrations')
        .select(
          `
          user_id,
          registration_date,
          profiles!tournament_registrations_user_id_fkey(
            user_id,
            full_name,
            display_name,
            avatar_url,
            elo,
            verified_rank
          )
        `
        )
        .eq('tournament_id', selectedTournament)
        .eq('registration_status', 'confirmed');

      console.log('👥 Tournament participants result:', {
        participants,
        error,
      });

      if (error) {
        console.error('❌ Error fetching tournament participants:', error);
        toast.error('Lỗi khi tải danh sách người tham gia: ' + error.message);
        return;
      }

      const formattedPlayers =
        participants?.map(participant => {
          console.log('🔍 Raw participant data:', participant);
          console.log('🔍 Participant profiles:', participant.profiles);

          const player = {
            id: participant.user_id,
            full_name:
              (participant.profiles as any)?.full_name ||
              (participant.profiles as any)?.[0]?.full_name ||
              'Chưa có tên',
            display_name:
              (participant.profiles as any)?.display_name ||
              (participant.profiles as any)?.[0]?.display_name,
            avatar_url:
              (participant.profiles as any)?.avatar_url ||
              (participant.profiles as any)?.[0]?.avatar_url,
            elo:
              (participant.profiles as any)?.elo ||
              (participant.profiles as any)?.[0]?.elo ||
              1000,
            rank:
              (participant.profiles as any)?.verified_rank ||
              (participant.profiles as any)?.[0]?.verified_rank ||
              'Chưa xác thực',
          };

          console.log('✅ Formatted player:', player);
          return player;
        }) || [];

      console.log(
        '✅ All formatted tournament participants:',
        formattedPlayers
      );
      setAvailablePlayers(formattedPlayers);

      // Auto-select all participants
      setSelectedPlayers(formattedPlayers);

      // Auto update tournament size based on participants
      if (formattedPlayers.length <= 4) {
        setTournamentSize(4);
      } else if (formattedPlayers.length <= 8) {
        setTournamentSize(8);
      } else if (formattedPlayers.length <= 16) {
        setTournamentSize(16);
      } else {
        setTournamentSize(32);
      }
    } catch (error) {
      console.error(
        '💥 Unexpected error fetching tournament participants:',
        error
      );
      toast.error('Lỗi khi tải danh sách người tham gia giải đấu');
    }
  };

  const handlePlayerToggle = (player: Player) => {
    const isSelected = selectedPlayers.find(p => p.id === player.id);

    if (isSelected) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (selectedPlayers.length < tournamentSize) {
      setSelectedPlayers([...selectedPlayers, player]);
    } else {
      toast.warning(`Chỉ có thể chọn tối đa ${tournamentSize} người chơi`);
    }
  };

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateRandomBracket = () => {
    console.log('🎲 Creating random bracket...');

    if (selectedPlayers.length < 2) {
      console.log('❌ Not enough players:', selectedPlayers.length);
      toast.error('Cần ít nhất 2 người chơi để tạo bảng đấu');
      return;
    }

    console.log('👥 Players for bracket:', selectedPlayers?.length);

    try {
      // Shuffle players randomly
      const shuffledPlayers = shuffleArray(selectedPlayers);

      // Pad to next power of 2 if needed
      const nextPowerOf2 = Math.pow(
        2,
        Math.ceil(Math.log2(shuffledPlayers.length))
      );
      while (shuffledPlayers.length < nextPowerOf2) {
        shuffledPlayers.push(null); // Bye players
      }

      console.log('🔀 Shuffled players count:', shuffledPlayers.length);

      // Generate first round matches
      const matches: BracketMatch[] = [];
      for (let i = 0; i < shuffledPlayers.length; i += 2) {
        matches.push({
          round: 1,
          match_number: Math.floor(i / 2) + 1,
          player1: shuffledPlayers[i],
          player2: shuffledPlayers[i + 1],
        });
      }

      console.log('✅ Generated matches:', matches.length);
      setGeneratedBracket(matches);
      toast.success('Đã tạo bảng đấu ngẫu nhiên thành công!');
    } catch (error) {
      console.error('💥 Error generating random bracket:', error);
      toast.error('Lỗi khi tạo bảng đấu ngẫu nhiên');
    }
  };

  const generateSeededBracket = () => {
    console.log('🎯 Creating seeded bracket...');

    if (selectedPlayers.length < 2) {
      console.log('❌ Not enough players for seeding:', selectedPlayers.length);
      toast.error('Cần ít nhất 2 người chơi để tạo bảng đấu');
      return;
    }

    console.log('👥 Players for seeded bracket:', selectedPlayers?.length);

    try {
      // Sort players by ELO descending
      const sortedPlayers = [...selectedPlayers].sort((a, b) => b.elo - a.elo);
      console.log(
        '📊 Players sorted by ELO:',
        sortedPlayers.map(p => `${p.full_name}: ${p.elo}`)
      );

      // Seed arrangement: 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5 for 8 players
      const seededPlayers = [];
      const totalPlayers = Math.pow(
        2,
        Math.ceil(Math.log2(sortedPlayers.length))
      );

      console.log('🏆 Tournament bracket size:', totalPlayers);

      // Create seeding bracket
      for (let i = 0; i < totalPlayers / 2; i++) {
        seededPlayers.push(sortedPlayers[i] || null);
        seededPlayers.push(sortedPlayers[totalPlayers - 1 - i] || null);
      }

      console.log(
        '🔢 Seeded arrangement:',
        seededPlayers.map(p => p?.full_name || 'BYE')
      );

      // Generate first round matches
      const matches: BracketMatch[] = [];
      for (let i = 0; i < seededPlayers.length; i += 2) {
        matches.push({
          round: 1,
          match_number: Math.floor(i / 2) + 1,
          player1: seededPlayers[i],
          player2: seededPlayers[i + 1],
        });
      }

      console.log('✅ Generated seeded matches:', matches.length);
      setGeneratedBracket(matches);
      toast.success('Đã tạo bảng đấu theo seeding thành công!');
    } catch (error) {
      console.error('💥 Error generating seeded bracket:', error);
      toast.error('Lỗi khi tạo bảng đấu theo seeding');
    }
  };

  const saveBracketToTournament = async () => {
    if (!selectedTournament || generatedBracket.length === 0) {
      toast.error('Vui lòng chọn giải đấu và tạo bảng đấu trước');
      return;
    }

    setLoading(true);
    try {
      // Create tournament matches
      const matchesToInsert = generatedBracket.map((match, index) => ({
        tournament_id: selectedTournament,
        round_number: match.round,
        match_number: match.match_number,
        player1_id: match.player1?.id || null,
        player2_id: match.player2?.id || null,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: matchError } = await supabase
        .from('tournament_matches')
        .upsert(matchesToInsert, {
          onConflict: 'tournament_id,round_number,match_number',
          ignoreDuplicates: false,
        });

      if (matchError) throw matchError;

      // Register players for tournament
      const registrationsToInsert = selectedPlayers.map(player => ({
        tournament_id: selectedTournament,
        user_id: player.id,
        registration_status: 'confirmed',
        created_at: new Date().toISOString(),
      }));

      const { error: regError } = await supabase
        .from('tournament_registrations')
        .upsert(registrationsToInsert, {
          onConflict: 'tournament_id,user_id',
          ignoreDuplicates: true,
        });

      if (regError) throw regError;

      // Update tournament status
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({
          status: 'registration_closed',
          current_participants: selectedPlayers.length,
        })
        .eq('id', selectedTournament);

      if (updateError) throw updateError;

      toast.success('Đã lưu bảng đấu vào giải đấu thành công!');
      setGeneratedBracket([]);
      setSelectedPlayers([]);
      setSelectedTournament('');
    } catch (error) {
      console.error('Error saving bracket:', error);
      toast.error('Lỗi khi lưu bảng đấu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shuffle className='w-5 h-5' />
            Tạo bảng đấu ngẫu nhiên
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Tournament Selection */}
          <div className='space-y-2'>
            <Label>Chọn giải đấu</Label>
            <Select
              value={selectedTournament}
              onValueChange={setSelectedTournament}
            >
              <SelectTrigger>
                <SelectValue placeholder='Chọn giải đấu để tạo bảng đấu' />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map(tournament => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name} ({tournament.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tournament Settings */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label>Số lượng người chơi</Label>
              <Select
                value={tournamentSize.toString()}
                onValueChange={value => setTournamentSize(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='4'>4 người chơi</SelectItem>
                  <SelectItem value='8'>8 người chơi</SelectItem>
                  <SelectItem value='16'>16 người chơi</SelectItem>
                  <SelectItem value='32'>32 người chơi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Loại bảng đấu</Label>
              <Select
                value={bracketType}
                onValueChange={(value: any) => setBracketType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='single_elimination'>
                    Loại trực tiếp
                  </SelectItem>
                  <SelectItem value='double_elimination'>Loại kép</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Đã chọn</Label>
              <div className='flex items-center gap-2 h-10 px-3 border rounded-md bg-muted'>
                <Users className='w-4 h-4' />
                <span>
                  {selectedPlayers.length}/{tournamentSize}
                </span>
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label>
                Người chơi tham gia giải đấu ({selectedPlayers.length}/
                {availablePlayers.length})
              </Label>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={fetchTournamentParticipants}
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Tải lại danh sách
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedPlayers([])}
                  disabled={selectedPlayers.length === 0}
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Xóa đã chọn
                </Button>
              </div>
            </div>

            <div className='max-h-64 overflow-y-auto border rounded-md p-4'>
              {availablePlayers.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Users className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p className='text-lg mb-2'>
                    Chưa có người nào đăng ký giải đấu này
                  </p>
                  <p className='text-sm mb-4'>
                    Vui lòng chọn giải đấu khác hoặc kiểm tra lại danh sách đăng
                    ký
                  </p>
                  <Button
                    variant='outline'
                    onClick={fetchTournamentParticipants}
                    size='sm'
                  >
                    <RefreshCw className='w-4 h-4 mr-2' />
                    Tải lại
                  </Button>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                  {availablePlayers.map(player => {
                    const isSelected = selectedPlayers.find(
                      p => p.id === player.id
                    );
                    return (
                      <div
                        key={player.id}
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handlePlayerToggle(player)}
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-10 w-10'>
                            <AvatarImage
                              src={player.avatar_url}
                              alt={player.display_name || player.full_name}
                            />
                            <AvatarFallback>
                              <User className='h-4 w-4' />
                            </AvatarFallback>
                          </Avatar>

                          <div className='flex-1'>
                            <div className='flex items-center justify-between'>
                              <div>
                                <div className='font-medium'>
                                  {player.display_name || player.full_name}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  Hạng: {player.rank}
                                </div>
                              </div>
                              <Badge variant='secondary'>{player.elo}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Generate Buttons */}
          <div className='flex gap-4'>
            <Button
              onClick={generateRandomBracket}
              disabled={selectedPlayers.length < 2}
              className='flex-1'
            >
              <Shuffle className='w-4 h-4 mr-2' />
              Tạo bảng đấu ngẫu nhiên
            </Button>

            <Button
              onClick={generateSeededBracket}
              disabled={selectedPlayers.length < 2}
              variant='outline'
              className='flex-1'
            >
              <Target className='w-4 h-4 mr-2' />
              Tạo bảng đấu theo seeding
            </Button>
          </div>

          {/* Generated Bracket Preview */}
          {generatedBracket.length > 0 && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label className='text-lg font-semibold'>Bảng đấu đã tạo</Label>
                <Button
                  onClick={saveBracketToTournament}
                  disabled={!selectedTournament || loading}
                  className='flex items-center gap-2'
                >
                  <Save className='w-4 h-4' />
                  {loading ? 'Đang lưu...' : 'Lưu vào giải đấu'}
                </Button>
              </div>

              <div className='border rounded-md p-4 bg-muted/20'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {generatedBracket.map((match, index) => (
                    <div
                      key={index}
                      className='border rounded-md p-3 bg-background'
                    >
                      <div className='text-sm font-medium text-muted-foreground mb-2'>
                        Trận {match.match_number} - Vòng {match.round}
                      </div>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-3 p-3 border rounded-md'>
                          {match.player1 ? (
                            <>
                              <Avatar className='h-8 w-8'>
                                <AvatarImage
                                  src={match.player1.avatar_url}
                                  alt={
                                    match.player1.display_name ||
                                    match.player1.full_name
                                  }
                                />
                                <AvatarFallback>
                                  <User className='h-4 w-4' />
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex-1'>
                                <div className='font-medium'>
                                  {match.player1.display_name ||
                                    match.player1.full_name}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  Hạng: {match.player1.rank}
                                </div>
                              </div>
                              <Badge variant='outline'>
                                {match.player1.elo}
                              </Badge>
                            </>
                          ) : (
                            <div className='flex-1 text-center text-muted-foreground py-2'>
                              BYE
                            </div>
                          )}
                        </div>

                        <div className='text-center text-muted-foreground font-medium'>
                          vs
                        </div>

                        <div className='flex items-center gap-3 p-3 border rounded-md'>
                          {match.player2 ? (
                            <>
                              <Avatar className='h-8 w-8'>
                                <AvatarImage
                                  src={match.player2.avatar_url}
                                  alt={
                                    match.player2.display_name ||
                                    match.player2.full_name
                                  }
                                />
                                <AvatarFallback>
                                  <User className='h-4 w-4' />
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex-1'>
                                <div className='font-medium'>
                                  {match.player2.display_name ||
                                    match.player2.full_name}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  Hạng: {match.player2.rank}
                                </div>
                              </div>
                              <Badge variant='outline'>
                                {match.player2.elo}
                              </Badge>
                            </>
                          ) : (
                            <div className='flex-1 text-center text-muted-foreground py-2'>
                              BYE
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RandomBracketGenerator;
