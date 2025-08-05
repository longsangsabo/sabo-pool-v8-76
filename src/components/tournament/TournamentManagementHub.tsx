import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Trophy,
  Calendar,
  Users,
  Settings,
  Eye,
  ArrowLeft,
  RefreshCw,
  Play,
  Target,
  Clock,
  Shuffle,
  Save,
  User,
  Hash,
  Gavel,
  Medal,
  Star,
  Crown,
  Plus,
  Check,
  MapPin,
  X,
  Edit,
  Loader2,
  Wrench,
  CreditCard,
} from 'lucide-react';
import TournamentCompletionButton from './TournamentCompletionButton';
import ForceStartTournamentButton from './ForceStartTournamentButton';
import RepairBracketButton from './RepairBracketButton';
import UserAvatar from '@/components/UserAvatar';
import TableAssignmentDisplay from './TableAssignmentDisplay';
import TournamentPlayerAvatar from './TournamentPlayerAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import TournamentResults from '@/components/tournament/TournamentResults';
import { TournamentBracket } from '@/components/tournament/TournamentBracket';
import { TournamentDetailsModal } from '@/components/tournament/TournamentDetailsModal';
import { EnhancedMatchCard } from '@/components/tournament/EnhancedMatchCard';
import { EditTournamentModal } from '@/components/tournament/EditTournamentModal';
import { TournamentAdapter } from '@/utils/tournamentAdapter';
import { Tournament as TournamentType } from '@/types/tournament';
import { BracketGenerator } from '@/components/tournament/BracketGenerator';
import { TournamentBracketFlow } from '@/components/tournament/TournamentBracketFlow';
import { useBracketGeneration } from '@/hooks/useBracketGeneration';

interface Tournament {
  id: string;
  name: string;
  description: string;
  tournament_type: string;
  status: string;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
  created_at: string;
}

interface Player {
  id: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  elo: number;
  rank?: string;
  verified_rank?: string;
  current_rank?: string;
}

interface BracketMatch {
  round: number;
  match_number: number;
  player1: Player | null;
  player2: Player | null;
  winner?: Player | null;
}

export interface TournamentManagementHubRef {
  refreshTournaments: () => void;
}

const TournamentManagementHub = forwardRef<TournamentManagementHubRef>(
  (props, ref) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { generateBracket, isGenerating } = useBracketGeneration();

    // Tournament List State
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [clubId, setClubId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState('active');
    const [selectedTournament, setSelectedTournament] =
      useState<Tournament | null>(null);
    const [editingTournament, setEditingTournament] =
      useState<Tournament | null>(null);

    // Bracket Generation State
    const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
    const [tournamentSize, setTournamentSize] = useState<number>(8);
    const [bracketType, setBracketType] = useState<
      'single_elimination' | 'double_elimination'
    >('single_elimination');
    const [generatedBracket, setGeneratedBracket] = useState<BracketMatch[]>(
      []
    );
    const [existingMatches, setExistingMatches] = useState<any[]>([]);
    const [bracketLoading, setBracketLoading] = useState(false);

    // Current View State
    const [currentView, setCurrentView] = useState<
      'list' | 'bracket-generator' | 'bracket-viewer' | 'bracket-manager'
    >('list');

    // Detail Tab State - for tabbed interface within tournament details
    const [detailActiveTab, setDetailActiveTab] = useState('overview');

    // Table Assignment State
    const [autoAssigning, setAutoAssigning] = useState(false);

    // Direct score input state
    const [matchScores, setMatchScores] = useState<{
      [key: string]: { player1: number; player2: number };
    }>({});

    // Individual tournament generating state
    const [generatingTournaments, setGeneratingTournaments] = useState<
      Set<string>
    >(new Set());
    const [isSubmittingScore, setIsSubmittingScore] = useState<{
      [key: string]: boolean;
    }>({});

    // Participants view state
    const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
    const [tournamentParticipants, setTournamentParticipants] = useState<any[]>(
      []
    );

    // Results view state
    const [resultsModalOpen, setResultsModalOpen] = useState(false);
    const [selectedTournamentForResults, setSelectedTournamentForResults] =
      useState<Tournament | null>(null);

    // Details view state
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedTournamentForDetails, setSelectedTournamentForDetails] =
      useState<Tournament | null>(null);

    useEffect(() => {
      if (user?.id) {
        loadClubAndTournaments();
      }
    }, [user?.id]);

    // Auto-refresh tournaments every 30 seconds to keep data updated
    useEffect(() => {
      if (!clubId) return;

      const interval = setInterval(() => {
        loadTournaments(clubId);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }, [clubId]);

    const loadClubAndTournaments = async () => {
      try {
        const id = await getClubId();
        setClubId(id);

        if (id) {
          await loadTournaments(id);
        }
      } catch (error) {
        console.error('Error loading club data:', error);
      } finally {
        setLoading(false);
      }
    };

    const getClubId = async () => {
      try {
        const { data, error } = await supabase
          .from('club_profiles')
          .select('id')
          .eq('user_id', user?.id)
          .eq('verification_status', 'approved')
          .maybeSingle(); // Use maybeSingle instead of single

        if (error) {
          console.error('Error fetching club ID:', error);
          return null;
        }
        return data?.id || null;
      } catch (error) {
        console.error('Error fetching club ID:', error);
        return null;
      }
    };

    const loadTournaments = async (explicitClubId?: string) => {
      const targetClubId = explicitClubId || clubId;
      if (!targetClubId) return;

      try {
        // Get all tournaments with optional registration counts
        const { data, error } = await supabase
          .from('tournaments')
          .select(
            `
          id, name, status, max_participants, entry_fee, prize_pool,
          registration_start, registration_end, start_date, end_date,
          tournament_type, created_at, description,
          tournament_registrations(payment_status)
        `
          )
          .eq('club_id', targetClubId)
          .is('deleted_at', null)
          .or('is_visible.is.null,is_visible.eq.true')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate actual participant counts - count all registrations regardless of payment status
        const tournamentsWithCounts = (data || []).map(tournament => {
          const allRegistrations =
            tournament.tournament_registrations?.length || 0;

          return {
            ...tournament,
            current_participants: allRegistrations,
            tournament_registrations: undefined, // Remove from display object
          };
        });

        setTournaments(tournamentsWithCounts as any[]);
      } catch (error) {
        console.error('Error loading tournaments:', error);
        // Fallback to basic query if the join fails
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('tournaments')
            .select(
              `
            id, name, status, max_participants, entry_fee, prize_pool,
            registration_start, registration_end, start_date, end_date,
            tournament_type, created_at, description, current_participants
          `
            )
            .eq('club_id', targetClubId)
            .is('deleted_at', null)
            .eq('is_visible', true)
            .order('created_at', { ascending: false });

          if (fallbackError) throw fallbackError;
          setTournaments((fallbackData as any[]) || []);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          toast.error('Không thể tải danh sách giải đấu');
        }
      }
    };

    const fetchTournaments = () => loadTournaments();

    // Expose refresh function via ref
    useImperativeHandle(ref, () => ({
      refreshTournaments: fetchTournaments,
    }));

    const getStatusBadge = (status: string) => {
      const statusMap = {
        upcoming: { label: 'Sắp diễn ra', variant: 'default' as const },
        registration_open: {
          label: 'Đang mở đăng ký',
          variant: 'default' as const,
        },
        registration_closed: {
          label: 'Đã đóng đăng ký',
          variant: 'secondary' as const,
        },
        ongoing: { label: 'Đang diễn ra', variant: 'default' as const },
        completed: { label: 'Đã kết thúc', variant: 'outline' as const },
        cancelled: { label: 'Đã hủy', variant: 'destructive' as const },
      };

      const statusInfo = statusMap[status as keyof typeof statusMap] || {
        label: status,
        variant: 'outline' as const,
      };
      return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    const getTournamentTypeLabel = (type: string) => {
      const typeMap = {
        single_elimination: 'Loại trực tiếp',
        double_elimination: 'Loại kép',
        round_robin: 'Vòng tròn',
        swiss: 'Swiss',
      };
      return typeMap[type as keyof typeof typeMap] || type;
    };

    // Tournament Actions
    const handleCreateTournament = () => {
      if (clubId) {
        navigate('/tournaments');
      } else {
        toast.error('Bạn phải là CLB thì mới sử dụng được tính năng này');
      }
    };

    const handleGenerateBracket = async (tournament: Tournament) => {
      setSelectedTournament(tournament);
      setCurrentView('bracket-generator');

      // Load tournament participants
      try {
        const { data: participants, error } = await supabase
          .from('tournament_registrations')
          .select(
            `
          user_id,
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
          .eq('tournament_id', tournament.id)
          .eq('registration_status', 'confirmed');

        if (error) throw error;

        const formattedPlayers =
          participants?.map(participant => ({
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
          })) || [];

        setAvailablePlayers(formattedPlayers);
        setSelectedPlayers(formattedPlayers);

        // Auto-adjust tournament size
        if (formattedPlayers.length <= 4) setTournamentSize(4);
        else if (formattedPlayers.length <= 8) setTournamentSize(8);
        else if (formattedPlayers.length <= 16) setTournamentSize(16);
        else setTournamentSize(32);
      } catch (error) {
        console.error('Error loading participants:', error);
        toast.error('Lỗi khi tải danh sách người tham gia');
      }
    };

    const handleViewBracket = async (tournament: Tournament) => {
      setSelectedTournament(tournament);
      setCurrentView('bracket-viewer');

      // Load existing tournament matches with enhanced player data
      try {
        const { data: matches, error } = await supabase
          .from('tournament_matches')
          .select(
            `
          *,
          player1:profiles!tournament_matches_player1_id_fkey(
            user_id, full_name, display_name, avatar_url, elo, verified_rank
          ),
          player2:profiles!tournament_matches_player2_id_fkey(
            user_id, full_name, display_name, avatar_url, elo, verified_rank
          ),
          winner:profiles!tournament_matches_winner_id_fkey(
            user_id, full_name, display_name, avatar_url, elo, verified_rank
          ),
          assigned_table:club_tables!tournament_matches_assigned_table_id_fkey(table_number, table_name, status)
        `
          )
          .eq('tournament_id', tournament.id)
          .order('round_number')
          .order('match_number');

        if (error) throw error;

        // Enhance match data with player rankings
        const enhancedMatches = await Promise.all(
          (matches || []).map(async match => {
            const playerIds = [match.player1_id, match.player2_id].filter(
              Boolean
            );

            if (playerIds.length > 0) {
              const { data: rankings } = await supabase
                .from('player_rankings')
                .select('user_id, verified_rank, spa_points, elo_points')
                .in('user_id', playerIds);

              // Merge ranking data with profile data
              if (match.player1 && rankings) {
                const p1Ranking = rankings.find(
                  r => r.user_id === match.player1_id
                );
                if (p1Ranking) {
                  (match.player1 as any).ranking_verified_rank =
                    p1Ranking.verified_rank;
                  (match.player1 as any).spa_points = p1Ranking.spa_points;
                  (match.player1 as any).ranking_elo = p1Ranking.elo_points;
                }
              }

              if (match.player2 && rankings) {
                const p2Ranking = rankings.find(
                  r => r.user_id === match.player2_id
                );
                if (p2Ranking) {
                  (match.player2 as any).ranking_verified_rank =
                    p2Ranking.verified_rank;
                  (match.player2 as any).spa_points = p2Ranking.spa_points;
                  (match.player2 as any).ranking_elo = p2Ranking.elo_points;
                }
              }
            }

            return match;
          })
        );

        setExistingMatches(enhancedMatches);
      } catch (error) {
        console.error('Error loading tournament matches:', error);
        toast.error('Lỗi khi tải dữ liệu bảng đấu');
      }
    };

    // Auto-assign tables to tournament matches
    const handleAutoAssignTables = async (tournamentId: string) => {
      if (!clubId) {
        toast.error('Không tìm thấy thông tin câu lạc bộ');
        return;
      }

      setAutoAssigning(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          'tournament-table-manager',
          {
            body: {
              action: 'auto_assign_tables',
              club_id: clubId,
              tournament_id: tournamentId,
            },
          }
        );

        if (error) throw error;

        if (data.success) {
          toast.success(`Đã phân bàn cho ${data.assignments_made} trận đấu`);
          // Refresh the bracket view to show updated table assignments
          if (selectedTournament) {
            await handleViewBracket(selectedTournament);
          }
        } else {
          throw new Error(data.error || 'Failed to auto-assign tables');
        }
      } catch (error) {
        console.error('Error auto-assigning tables:', error);
        toast.error('Không thể tự động phân bàn');
      } finally {
        setAutoAssigning(false);
      }
    };

    // Direct score input functions
    const updateScore = (
      matchId: string,
      player: 'player1' | 'player2',
      value: string
    ) => {
      const numValue = parseInt(value) || 0;
      setMatchScores(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [player]: numValue,
        },
      }));
    };

    const submitScore = async (matchId: string) => {
      if (!user) return;

      const scores = matchScores[matchId];
      if (!scores) return;

      const { player1, player2 } = scores;

      // Validate scores
      if (player1 < 0 || player2 < 0) {
        toast.error('Tỷ số không thể âm');
        return;
      }

      if (player1 === player2) {
        toast.error('Trận đấu phải có người thắng cuộc');
        return;
      }

      setIsSubmittingScore(prev => ({ ...prev, [matchId]: true }));
      try {
        const match = existingMatches.find(m => m.id === matchId);
        if (!match) return;

        // Determine winner
        const winnerId =
          player1 > player2 ? match.player1_id : match.player2_id;

        const { error } = await supabase
          .from('tournament_matches')
          .update({
            score_player1: player1,
            score_player2: player2,
            winner_id: winnerId,
            score_input_by: user.id,
            score_status: 'confirmed',
            score_submitted_at: new Date().toISOString(),
            score_confirmed_at: new Date().toISOString(),
            status: 'completed',
          })
          .eq('id', matchId);

        if (error) throw error;

        toast.success('✅ Tỷ số đã được xác nhận!');

        // Clear scores for this match
        setMatchScores(prev => {
          const newScores = { ...prev };
          delete newScores[matchId];
          return newScores;
        });

        // Refresh matches
        if (selectedTournament) {
          await handleViewBracket(selectedTournament);
        }
      } catch (error) {
        console.error('Error submitting score:', error);
        toast.error('Lỗi khi gửi tỷ số: ' + (error as any)?.message);
      } finally {
        setIsSubmittingScore(prev => ({ ...prev, [matchId]: false }));
      }
    };

    const confirmScore = async (matchId: string) => {
      if (!user) return;

      try {
        // Get the match data first to determine winner
        const matchToConfirm = existingMatches.find(m => m.id === matchId);
        if (!matchToConfirm) {
          toast.error('Không tìm thấy thông tin trận đấu');
          return;
        }

        const winnerId =
          matchToConfirm.score_player1 > matchToConfirm.score_player2
            ? matchToConfirm.player1_id
            : matchToConfirm.player2_id;

        const { error } = await supabase
          .from('tournament_matches')
          .update({
            score_confirmed_by: user.id,
            score_status: 'confirmed',
            score_confirmed_at: new Date().toISOString(),
            status: 'completed',
            winner_id: winnerId,
            actual_end_time: new Date().toISOString(),
          })
          .eq('id', matchId);

        if (error) throw error;

        toast.success('Tỷ số đã được xác nhận');

        // Advance tournament winner if needed
        try {
          const { error: advanceError } = await supabase.rpc(
            'submit_sabo_match_score',
            {
              p_match_id: matchId,
              p_player1_score: 1,
              p_player2_score: 0,
              p_submitted_by: winnerId,
            }
          );

          if (advanceError) {
            console.error('Error advancing tournament winner:', advanceError);
          }
        } catch (error) {
          console.error('Error in tournament advancement:', error);
        }

        // Refresh matches
        if (selectedTournament) {
          await handleViewBracket(selectedTournament);
        }
      } catch (error) {
        console.error('Error confirming score:', error);
        toast.error('Lỗi khi xác nhận tỷ số');
      }
    };

    const disputeScore = async (matchId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('tournament_matches')
          .update({
            score_status: 'disputed',
            status: 'scheduled', // Reset to scheduled for re-entry
          })
          .eq('id', matchId);

        if (error) throw error;

        toast.success('Tỷ số đã được phản đối, cần nhập lại');

        // Refresh matches
        if (selectedTournament) {
          await handleViewBracket(selectedTournament);
        }
      } catch (error) {
        console.error('Error disputing score:', error);
        toast.error('Lỗi khi phản đối tỷ số');
      }
    };

    // Participants management functions
    const handleViewParticipants = async (tournament: Tournament) => {
      setSelectedTournament(tournament);

      try {
        // Check if user has club access first
        const clubId = await getClubId();
        if (!clubId) {
          toast.error('Bạn cần có club được duyệt để xem danh sách thành viên');
          return;
        }

        const { data: participants, error } = await supabase
          .from('tournament_registrations')
          .select(
            `
          id,
          user_id,
          registration_status,
          registration_date,
          payment_status,
          notes,
          tournaments!tournament_registrations_tournament_id_fkey (
            entry_fee
          ),
          profiles!tournament_registrations_user_id_fkey (
            user_id,
            full_name,
            display_name,
            avatar_url,
            phone,
            email,
            elo,
            verified_rank
          )
        `
          )
          .eq('tournament_id', tournament.id)
          .order('registration_date', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('🔥 Participants loaded:', participants);
        setTournamentParticipants(participants || []);
        setParticipantsModalOpen(true);
      } catch (error) {
        console.error('Error loading participants:', error);
        toast.error(
          'Lỗi khi tải danh sách thành viên: ' + (error as any)?.message
        );
      }
    };

    // Auto-detect tournament data completeness for details view
    const handleShowDetails = (tournament: Tournament) => {
      setSelectedTournamentForDetails(tournament);
      setDetailsModalOpen(true);
    };

    const confirmParticipant = async (registrationId: string) => {
      try {
        const { error } = await supabase
          .from('tournament_registrations')
          .update({
            registration_status: 'confirmed',
          })
          .eq('id', registrationId);

        if (error) throw error;

        toast.success('Đã xác nhận thành viên!');

        // Refresh participants list
        if (selectedTournament) {
          await handleViewParticipants(selectedTournament);
        }
      } catch (error) {
        console.error('Error confirming participant:', error);
        toast.error('Lỗi khi xác nhận thành viên');
      }
    };

    const confirmPayment = async (registrationId: string) => {
      try {
        const { error } = await supabase
          .from('tournament_registrations')
          .update({
            payment_status: 'paid',
          })
          .eq('id', registrationId);

        if (error) throw error;

        toast.success('Đã xác nhận thanh toán!');

        // Refresh participants list
        if (selectedTournament) {
          await handleViewParticipants(selectedTournament);
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
        toast.error('Lỗi khi xác nhận thanh toán');
      }
    };

    // Close registration function
    const closeRegistration = async (tournament: any) => {
      try {
        const { error } = await supabase
          .from('tournaments')
          .update({ status: 'registration_closed' })
          .eq('id', tournament.id);

        if (error) throw error;

        toast.success('Đã đóng đăng ký giải đấu');

        // Refresh the tournaments list
        await loadTournaments();
      } catch (error) {
        console.error('Error closing registration:', error);
        toast.error('Lỗi khi đóng đăng ký');
      }
    };

    // Open registration function
    const openRegistration = async (tournament: any) => {
      try {
        const { error } = await supabase
          .from('tournaments')
          .update({ status: 'registration_open' })
          .eq('id', tournament.id);

        if (error) throw error;

        toast.success('Đã mở đăng ký giải đấu');

        // Refresh the tournaments list
        await loadTournaments();
      } catch (error) {
        console.error('Error opening registration:', error);
        toast.error('Lỗi khi mở đăng ký');
      }
    };

    // Player Selection
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

    // Bracket Generation
    const shuffleArray = (array: any[]) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    const generateRandomBracket = () => {
      if (selectedPlayers.length < 2) {
        toast.error('Cần ít nhất 2 người chơi để tạo bảng đấu');
        return;
      }

      try {
        const shuffledPlayers = shuffleArray(selectedPlayers);
        const nextPowerOf2 = Math.pow(
          2,
          Math.ceil(Math.log2(shuffledPlayers.length))
        );

        while (shuffledPlayers.length < nextPowerOf2) {
          shuffledPlayers.push(null);
        }

        const matches: BracketMatch[] = [];
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
          matches.push({
            round: 1,
            match_number: Math.floor(i / 2) + 1,
            player1: shuffledPlayers[i],
            player2: shuffledPlayers[i + 1],
          });
        }

        setGeneratedBracket(matches);
        toast.success('Đã tạo bảng đấu ngẫu nhiên thành công!');
      } catch (error) {
        console.error('Error generating bracket:', error);
        toast.error('Lỗi khi tạo bảng đấu');
      }
    };

    const generateSeededBracket = () => {
      if (selectedPlayers.length < 2) {
        toast.error('Cần ít nhất 2 người chơi để tạo bảng đấu');
        return;
      }

      try {
        const sortedPlayers = [...selectedPlayers].sort(
          (a, b) => b.elo - a.elo
        );
        const seededPlayers = [];
        const totalPlayers = Math.pow(
          2,
          Math.ceil(Math.log2(sortedPlayers.length))
        );

        for (let i = 0; i < totalPlayers / 2; i++) {
          seededPlayers.push(sortedPlayers[i] || null);
          seededPlayers.push(sortedPlayers[totalPlayers - 1 - i] || null);
        }

        const matches: BracketMatch[] = [];
        for (let i = 0; i < seededPlayers.length; i += 2) {
          matches.push({
            round: 1,
            match_number: Math.floor(i / 2) + 1,
            player1: seededPlayers[i],
            player2: seededPlayers[i + 1],
          });
        }

        setGeneratedBracket(matches);
        toast.success('Đã tạo bảng đấu theo seeding thành công!');
      } catch (error) {
        console.error('Error generating seeded bracket:', error);
        toast.error('Lỗi khi tạo bảng đấu theo seeding');
      }
    };

    const saveBracketToTournament = async () => {
      if (!selectedTournament || generatedBracket.length === 0) {
        toast.error('Vui lòng chọn giải đấu và tạo bảng đấu trước');
        return;
      }

      setBracketLoading(true);
      try {
        const matchesToInsert = generatedBracket.map(match => ({
          tournament_id: selectedTournament.id,
          round_number: match.round,
          match_number: match.match_number,
          player1_id: match.player1?.id || null,
          player2_id: match.player2?.id || null,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // First, delete existing matches for this tournament
        const { error: deleteError } = await supabase
          .from('tournament_matches')
          .delete()
          .eq('tournament_id', selectedTournament.id);

        if (deleteError) throw deleteError;

        // Then insert new matches
        const { error: matchError } = await supabase
          .from('tournament_matches')
          .insert(matchesToInsert);

        if (matchError) throw matchError;

        const { error: updateError } = await supabase
          .from('tournaments')
          .update({
            status: 'registration_closed',
            current_participants: selectedPlayers.length,
          })
          .eq('id', selectedTournament.id);

        if (updateError) throw updateError;

        toast.success('Đã lưu bảng đấu vào giải đấu thành công!');
        setCurrentView('bracket-viewer');
      } catch (error) {
        console.error('Error saving bracket:', error);
        toast.error('Lỗi khi lưu bảng đấu');
      } finally {
        setBracketLoading(false);
      }
    };

    // Helper functions for player data
    const getPlayerName = (playerId: string | null) => {
      if (!playerId) return 'Chờ kết quả';
      const match = existingMatches.find(
        m =>
          (m.player1_id === playerId && m.player1) ||
          (m.player2_id === playerId && m.player2)
      );
      if (match?.player1_id === playerId)
        return match.player1?.full_name || 'Chưa có tên';
      if (match?.player2_id === playerId)
        return match.player2?.full_name || 'Chưa có tên';
      return 'Chưa có tên';
    };

    const getPlayerData = (playerId: string | null) => {
      if (!playerId) return null;
      const match = existingMatches.find(
        m =>
          (m.player1_id === playerId && m.player1) ||
          (m.player2_id === playerId && m.player2)
      );
      if (match?.player1_id === playerId) return match.player1;
      if (match?.player2_id === playerId) return match.player2;
      return null;
    };

    const getPlayerRank = (playerData: any) => {
      if (!playerData) return 'K';
      // Priority: ranking_verified_rank > verified_rank > fallback based on ELO
      if (playerData.ranking_verified_rank)
        return playerData.ranking_verified_rank;
      if (playerData.verified_rank) return playerData.verified_rank;

      // Fallback rank based on ELO if no verified rank
      const elo = playerData.elo || playerData.ranking_elo || 1000;
      if (elo >= 1800) return 'A';
      if (elo >= 1600) return 'B';
      if (elo >= 1400) return 'C';
      if (elo >= 1200) return 'D';
      if (elo >= 1100) return 'E';
      if (elo >= 1050) return 'F';
      if (elo >= 1000) return 'G';
      if (elo >= 950) return 'H';
      if (elo >= 900) return 'I';
      return 'K';
    };

    const getMatchStatusText = (status: string) => {
      const statusMap = {
        completed: '✅ Hoàn thành',
        ongoing: '⏳ Đang thi đấu',
        scheduled: '📅 Đã lên lịch',
      };
      return statusMap[status as keyof typeof statusMap] || status;
    };

    const getMatchStatusVariant = (status: string) => {
      const variantMap = {
        completed: 'default' as const,
        ongoing: 'secondary' as const,
        scheduled: 'outline' as const,
      };
      return (
        variantMap[status as keyof typeof variantMap] || ('outline' as const)
      );
    };

    const isFinalsMatch = (
      match: any,
      roundNumber: number,
      totalMatches: number
    ) => {
      return roundNumber === 4 && !match.is_third_place_match;
    };

    // Group matches by round for better organization
    const groupMatchesByRound = () => {
      const rounds = existingMatches.reduce(
        (acc, match) => {
          if (!acc[match.round_number]) {
            acc[match.round_number] = [];
          }
          acc[match.round_number].push(match);
          return acc;
        },
        {} as Record<number, any[]>
      );

      return Object.entries(rounds).map(([roundNum, matches]) => ({
        round_number: parseInt(roundNum),
        matches: (matches as any[]).sort(
          (a, b) => a.match_number - b.match_number
        ),
      }));
    };

    // Filtering logic
    const statusFilters = {
      active: [
        'registration_open',
        'registration_closed',
        'ongoing',
        'upcoming',
      ],
      upcoming: ['upcoming', 'registration_open'],
      completed: ['completed'],
      all: null,
    };

    const filteredTournaments = React.useMemo(() => {
      if (!statusFilters[activeFilter as keyof typeof statusFilters]) {
        return tournaments;
      }

      return tournaments.filter(tournament =>
        statusFilters[activeFilter as keyof typeof statusFilters]?.includes(
          tournament.status
        )
      );
    }, [tournaments, activeFilter]);

    // Helper function to safely format dates
    const formatTournamentDate = (dateString: string | null) => {
      if (!dateString) return 'Chưa xác định';
      try {
        const date = new Date(dateString);
        // Check if date is valid and not epoch
        if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
          return 'Chưa xác định';
        }
        return format(date, 'dd/MM/yyyy', { locale: vi });
      } catch (error) {
        return 'Chưa xác định';
      }
    };

    // Tournament Card Component
    const TournamentCard: React.FC<{ tournament: Tournament }> = ({
      tournament,
    }) => (
      <Card className='hover:shadow-lg transition-shadow'>
        <CardContent className='p-6'>
          <div className='flex items-start justify-between mb-4'>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                {tournament.name}
              </h3>
              <p className='text-muted-foreground text-sm mb-3'>
                {tournament.description}
              </p>
              <div className='flex flex-wrap gap-2 mb-4'>
                {getStatusBadge(tournament.status)}
                <Badge variant='outline'>
                  {getTournamentTypeLabel(tournament.tournament_type)}
                </Badge>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4 text-sm mb-4'>
            <div className='flex items-center gap-2'>
              <Users className='w-4 h-4 text-muted-foreground' />
              <span>
                {tournament.current_participants}/{tournament.max_participants}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Calendar className='w-4 h-4 text-muted-foreground' />
              <span
                className={
                  tournament.tournament_start ? '' : 'text-destructive'
                }
              >
                {formatTournamentDate(tournament.tournament_start)}
                {!tournament.tournament_start && ' - Cần cập nhật'}
              </span>
            </div>
          </div>

          <div className='flex gap-2 flex-wrap'>
            {/* Edit Tournament Button for Missing Data */}
            {(!tournament.tournament_start || !tournament.tournament_end) && (
              <Button
                size='sm'
                variant='outline'
                className='border-orange-500 text-orange-600 hover:bg-orange-50'
                onClick={() => setEditingTournament(tournament)}
              >
                <Edit className='w-3 h-3 mr-1' />
                Cập nhật thời gian
              </Button>
            )}
            {tournament.status === 'upcoming' && (
              <Button
                size='sm'
                variant='default'
                onClick={() => openRegistration(tournament)}
                className='bg-green-600 hover:bg-green-700 text-white border-green-600'
              >
                <Play className='w-4 h-4 mr-2' />
                Mở đăng ký
              </Button>
            )}
            {tournament.status === 'registration_open' && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => closeRegistration(tournament)}
                className='border-orange-300 text-orange-600 hover:bg-orange-50'
              >
                <X className='w-4 h-4 mr-2' />
                Đóng đăng ký
              </Button>
            )}
            {/* View Details Button - Smart rendering based on tournament data */}
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleShowDetails(tournament)}
              className='hover:bg-primary/10'
              onMouseEnter={() => {
                // Auto-preload tournament details on hover for better UX
                console.log(
                  'Preloading tournament details for:',
                  tournament.id
                );
              }}
            >
              <Eye className='w-4 h-4 mr-2' />
              Xem chi tiết
            </Button>

            <Button
              size='sm'
              variant='outline'
              onClick={() => handleGenerateBracket(tournament)}
              disabled={tournament.status === 'completed'}
            >
              <Shuffle className='w-4 h-4 mr-2' />
              Tạo bảng đấu
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleViewBracket(tournament)}
            >
              <Target className='w-4 h-4 mr-2' />
              Xem bảng đấu
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleViewParticipants(tournament)}
            >
              <Users className='w-4 h-4 mr-2' />
              Xem thành viên
            </Button>

            {/* Force Start Tournament Button */}
            <ForceStartTournamentButton
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              currentStatus={tournament.status}
              onStatusChanged={() => {
                fetchTournaments();
              }}
            />

            {/* Tournament Completion Button - fallback for completed status */}
            <TournamentCompletionButton
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              tournamentStatus={tournament.status}
              onCompleted={() => {
                fetchTournaments();
              }}
            />

            {/* Repair Bracket Button - for fixing double elimination tournament progression issues */}
            <RepairBracketButton
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              tournamentStatus={tournament.status}
              tournamentType={tournament.tournament_type}
              onRepaired={() => {
                fetchTournaments();
              }}
            />
          </div>
        </CardContent>
      </Card>
    );

    // Match Card Component for Bracket Display
    const MatchCard: React.FC<{ match: BracketMatch }> = ({ match }) => (
      <Card className='border-2 hover:shadow-lg transition-all'>
        <CardContent className='p-4'>
          <Badge variant='outline' className='mb-3'>
            Trận {match.match_number}
          </Badge>

          <div className='space-y-2'>
            <div
              className={`p-2 rounded-lg border-l-4 ${
                match.player1
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-muted border-muted-foreground'
              }`}
            >
              <div className='text-sm font-medium'>
                {match.player1
                  ? `🎱 ${match.player1.full_name}`
                  : '⏳ Chờ kết quả'}
              </div>
            </div>

            <div className='text-center text-xs font-bold text-primary'>VS</div>

            <div
              className={`p-2 rounded-lg border-l-4 ${
                match.player2
                  ? 'bg-purple-50 border-purple-400'
                  : 'bg-muted border-muted-foreground'
              }`}
            >
              <div className='text-sm font-medium'>
                {match.player2
                  ? `🎱 ${match.player2.full_name}`
                  : '⏳ Chờ kết quả'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    if (loading) {
      return (
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          <p className='ml-2'>Đang tải...</p>
        </div>
      );
    }

    if (!clubId) {
      return (
        <div className='text-center py-8'>
          <p>Không tìm thấy thông tin club. Vui lòng kiểm tra profile.</p>
        </div>
      );
    }

    // Render different views
    if (currentView === 'bracket-generator' && selectedTournament) {
      return (
        <div className='space-y-6'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={e => {
                e.stopPropagation();
                setCurrentView('list');
              }}
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại danh sách
            </Button>
            <div>
              <h2 className='text-2xl font-bold text-foreground'>
                Tạo bảng đấu cho {selectedTournament.name}
              </h2>
              <p className='text-muted-foreground'>
                {selectedTournament.description}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shuffle className='w-5 h-5' />
                Cấu hình bảng đấu
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
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
                      <SelectItem value='double_elimination'>
                        Loại kép
                      </SelectItem>
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
                    Chọn người chơi ({selectedPlayers.length}/
                    {availablePlayers.length})
                  </Label>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setSelectedPlayers([])}
                    disabled={selectedPlayers.length === 0}
                  >
                    Xóa đã chọn
                  </Button>
                </div>

                <div className='max-h-64 overflow-y-auto border rounded-md p-4'>
                  {availablePlayers.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Users className='w-8 h-8 mx-auto mb-2' />
                      <p>Chưa có người chơi nào đăng ký giải đấu này</p>
                    </div>
                  ) : (
                    <div className='grid gap-2'>
                      {availablePlayers.map(player => (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPlayers.some(p => p.id === player.id)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => handlePlayerToggle(player)}
                        >
                          <div className='flex items-center gap-3'>
                            <Avatar className='w-8 h-8'>
                              <AvatarImage
                                src={player.avatar_url || undefined}
                              />
                              <AvatarFallback className='text-xs'>
                                {(
                                  player.display_name ||
                                  player.full_name ||
                                  'U'
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium'>
                                {player.display_name || player.full_name}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                ELO: {player.elo || 1000}
                              </p>
                            </div>
                          </div>
                          {selectedPlayers.some(p => p.id === player.id) && (
                            <Check className='w-4 h-4 text-primary' />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Generation Actions */}
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
                  Tạo bảng đấu theo ELO
                </Button>
              </div>

              {/* Generated Bracket Preview */}
              {generatedBracket.length > 0 && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label>Bảng đấu đã tạo (Vòng 1)</Label>
                    <Button
                      onClick={saveBracketToTournament}
                      disabled={bracketLoading}
                    >
                      <Save className='w-4 h-4 mr-2' />
                      {bracketLoading ? 'Đang lưu...' : 'Lưu bảng đấu'}
                    </Button>
                  </div>

                  <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {generatedBracket.map((match, index) => (
                      <MatchCard key={index} match={match} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === 'bracket-manager') {
      const singleEliminationTournaments = tournaments.filter(
        t => t.tournament_type === 'single_elimination'
      );
      const doubleEliminationTournaments = tournaments.filter(
        t => t.tournament_type === 'double_elimination'
      );

      return (
        <div className='space-y-6'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentView('list')}
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại danh sách
            </Button>
            <div>
              <h2 className='text-2xl font-bold text-foreground'>
                Quản lý Bảng đấu
              </h2>
              <p className='text-muted-foreground'>
                Tạo và quản lý bảng đấu cho các loại giải đấu khác nhau
              </p>
            </div>
          </div>

          <Tabs defaultValue='single' className='space-y-4'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='single' className='flex items-center gap-2'>
                <Trophy className='w-4 h-4' />
                Single Elimination
                <Badge variant='outline' className='ml-2'>
                  {singleEliminationTournaments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='double' className='flex items-center gap-2'>
                <Crown className='w-4 h-4' />
                Double Elimination
                <Badge variant='outline' className='ml-2'>
                  {doubleEliminationTournaments.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Single Elimination Tab */}
            <TabsContent value='single' className='space-y-4'>
              <Card className='border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-blue-700 dark:text-blue-300'>
                    <Trophy className='w-5 h-5' />
                    Single Elimination - Loại trực tiếp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3 text-sm text-blue-600 dark:text-blue-400'>
                    <p>• Mỗi người chơi chỉ có một cơ hội duy nhất</p>
                    <p>• Thua 1 trận = bị loại khỏi giải đấu</p>
                    <p>• Phù hợp cho giải đấu nhanh gọn, ít thời gian</p>
                    <p>• Số người chơi lý tưởng: 4, 8, 16, 32</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle>Giải đấu Single Elimination</CardTitle>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => loadTournaments()}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                      />
                      Làm mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className='text-center py-8'>
                      <div className='animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto'></div>
                      <p className='mt-2 text-muted-foreground'>Đang tải...</p>
                    </div>
                  ) : singleEliminationTournaments.length === 0 ? (
                    <div className='text-center py-8'>
                      <Trophy className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                      <p className='text-muted-foreground'>
                        Chưa có giải đấu Single Elimination nào
                      </p>
                    </div>
                  ) : (
                    <div className='grid gap-4'>
                      {singleEliminationTournaments.map(tournament => (
                        <Card
                          key={tournament.id}
                          className='hover:shadow-md transition-shadow border-blue-200'
                        >
                          <CardContent className='p-4'>
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-3 mb-2'>
                                  <h4 className='font-medium'>
                                    {tournament.name}
                                  </h4>
                                  {getStatusBadge(tournament.status)}
                                  <Badge
                                    variant='outline'
                                    className='text-blue-600 border-blue-300'
                                  >
                                    Single Elimination
                                  </Badge>
                                </div>

                                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                  <div className='flex items-center gap-1'>
                                    <Users className='h-4 w-4' />
                                    <span>
                                      {tournament.current_participants}/
                                      {tournament.max_participants}
                                    </span>
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <Calendar className='h-4 w-4' />
                                    <span>
                                      {formatTournamentDate(
                                        tournament.tournament_start
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className='flex gap-2'>
                                {tournament.current_participants >= 2 &&
                                  [4, 8, 16, 32].includes(
                                    tournament.current_participants
                                  ) && (
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      className='border-blue-500 text-blue-600 hover:bg-blue-50'
                                      onClick={() => {
                                        setSelectedTournament(tournament);
                                        setCurrentView('bracket-generator');
                                      }}
                                    >
                                      <Settings className='h-4 w-4 mr-1' />
                                      Tạo bảng đấu
                                    </Button>
                                  )}

                                <Button
                                  size='sm'
                                  onClick={() => {
                                    setSelectedTournament(tournament);
                                    setCurrentView('bracket-viewer');
                                  }}
                                >
                                  <Eye className='h-4 w-4 mr-1' />
                                  Xem bảng đấu
                                </Button>
                              </div>
                            </div>

                            {tournament.current_participants > 0 &&
                              ![4, 8, 16, 32].includes(
                                tournament.current_participants
                              ) && (
                                <div className='mt-3 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg'>
                                  <p className='text-sm text-orange-700 dark:text-orange-300'>
                                    ⚠️ Số người chơi (
                                    {tournament.current_participants}) không phù
                                    hợp cho Single Elimination. Cần: 4, 8, 16,
                                    hoặc 32 người chơi.
                                  </p>
                                </div>
                              )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Double Elimination Tab */}
            <TabsContent value='double' className='space-y-4'>
              <Card className='border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-purple-700 dark:text-purple-300'>
                    <Crown className='w-5 h-5' />
                    Double Elimination - Loại kép
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3 text-sm text-purple-600 dark:text-purple-400'>
                    <p>
                      • Mỗi người chơi có 2 cơ hội (Winners Bracket + Losers
                      Bracket)
                    </p>
                    <p>
                      • Thua 1 trận = rơi xuống Losers Bracket, thua 2 trận = bị
                      loại
                    </p>
                    <p>• Công bằng hơn, cho phép comeback</p>
                    <p>• Phù hợp cho giải đấu chuyên nghiệp, quan trọng</p>
                    <p>• Số người chơi linh hoạt: từ 3 người trở lên</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle>Giải đấu Double Elimination</CardTitle>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => loadTournaments()}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                      />
                      Làm mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className='text-center py-8'>
                      <div className='animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto'></div>
                      <p className='mt-2 text-muted-foreground'>Đang tải...</p>
                    </div>
                  ) : doubleEliminationTournaments.length === 0 ? (
                    <div className='text-center py-8'>
                      <Crown className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                      <p className='text-muted-foreground'>
                        Chưa có giải đấu Double Elimination nào
                      </p>
                    </div>
                  ) : (
                    <div className='grid gap-4'>
                      {doubleEliminationTournaments.map(tournament => (
                        <Card
                          key={tournament.id}
                          className='hover:shadow-md transition-shadow border-purple-200'
                        >
                          <CardContent className='p-4'>
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-3 mb-2'>
                                  <h4 className='font-medium'>
                                    {tournament.name}
                                  </h4>
                                  {getStatusBadge(tournament.status)}
                                  <Badge
                                    variant='outline'
                                    className='text-purple-600 border-purple-300'
                                  >
                                    Double Elimination
                                  </Badge>
                                </div>

                                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                  <div className='flex items-center gap-1'>
                                    <Users className='h-4 w-4' />
                                    <span>
                                      {tournament.current_participants}/
                                      {tournament.max_participants}
                                    </span>
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <Calendar className='h-4 w-4' />
                                    <span>
                                      {formatTournamentDate(
                                        tournament.tournament_start
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className='flex gap-2'>
                                {tournament.current_participants >= 3 && (
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='border-purple-500 text-purple-600 hover:bg-purple-50'
                                    onClick={async () => {
                                      const tournamentId = tournament.id;

                                      // Check if this specific tournament is already generating
                                      if (
                                        generatingTournaments.has(tournamentId)
                                      ) {
                                        return;
                                      }

                                      try {
                                        // Set generating state for this specific tournament
                                        setGeneratingTournaments(prev =>
                                          new Set(prev).add(tournamentId)
                                        );

                                        // Call edge function directly instead of hook
                                        const { data: result, error } =
                                          await supabase.functions.invoke(
                                            'generate-tournament-bracket',
                                            {
                                              body: {
                                                tournament_id: tournamentId,
                                                generation_type: 'elo_based',
                                              },
                                            }
                                          );

                                        if (error) {
                                          console.error(
                                            'Edge function error:',
                                            error
                                          );
                                          toast.error(
                                            'Lỗi khi gọi API tạo bảng đấu'
                                          );
                                          return;
                                        }

                                        if (result?.error) {
                                          console.error(
                                            'Bracket generation error:',
                                            result.error
                                          );
                                          toast.error(result.error);
                                          return;
                                        }

                                        if (result?.success) {
                                          toast.success(
                                            'Tạo bảng đấu Double Elimination thành công!'
                                          );
                                          setSelectedTournament(tournament);
                                          setCurrentView('bracket-viewer');
                                          fetchTournaments(); // Refresh tournament list
                                        }
                                      } catch (error) {
                                        console.error(
                                          'Error generating double elimination bracket:',
                                          error
                                        );
                                        toast.error(
                                          'Lỗi khi tạo bảng đấu Double Elimination'
                                        );
                                      } finally {
                                        // Remove generating state for this tournament
                                        setGeneratingTournaments(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(tournamentId);
                                          return newSet;
                                        });
                                      }
                                    }}
                                    disabled={generatingTournaments.has(
                                      tournament.id
                                    )}
                                  >
                                    {generatingTournaments.has(
                                      tournament.id
                                    ) ? (
                                      <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                                    ) : (
                                      <Crown className='h-4 w-4 mr-1' />
                                    )}
                                    {generatingTournaments.has(tournament.id)
                                      ? 'Đang tạo...'
                                      : 'Tạo bảng đấu'}
                                  </Button>
                                )}

                                {/* Repair Double Elimination Button */}
                                {tournament.tournament_type ===
                                  'double_elimination' &&
                                  tournament.status === 'ongoing' && (
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      className='border-orange-500 text-orange-600 hover:bg-orange-50'
                                      onClick={async () => {
                                        const tournamentId = tournament.id;

                                        try {
                                          setGeneratingTournaments(prev =>
                                            new Set(prev).add(tournamentId)
                                          );

                                          const { data: result, error } =
                                            await supabase.functions.invoke(
                                              'repair-double-elimination',
                                              {
                                                body: {
                                                  tournament_id: tournamentId,
                                                },
                                              }
                                            );

                                          if (error) {
                                            console.error(
                                              'Repair function error:',
                                              error
                                            );
                                            toast.error(
                                              'Lỗi khi sửa chữa bảng đấu'
                                            );
                                            return;
                                          }

                                          if (result?.error) {
                                            console.error(
                                              'Repair error:',
                                              result.error
                                            );
                                            toast.error(result.error);
                                            return;
                                          }

                                          if (result?.success) {
                                            toast.success(
                                              'Đã sửa chữa bảng đấu Double Elimination thành công!'
                                            );
                                            fetchTournaments(); // Refresh tournament list
                                          }
                                        } catch (error) {
                                          console.error(
                                            'Error repairing double elimination:',
                                            error
                                          );
                                          toast.error(
                                            'Lỗi khi sửa chữa bảng đấu'
                                          );
                                        } finally {
                                          setGeneratingTournaments(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(tournamentId);
                                            return newSet;
                                          });
                                        }
                                      }}
                                      disabled={generatingTournaments.has(
                                        tournament.id
                                      )}
                                    >
                                      {generatingTournaments.has(
                                        tournament.id
                                      ) ? (
                                        <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                                      ) : (
                                        <Wrench className='h-4 w-4 mr-1' />
                                      )}
                                      {generatingTournaments.has(tournament.id)
                                        ? 'Đang sửa...'
                                        : 'Sửa chữa bảng đấu'}
                                    </Button>
                                  )}

                                <Button
                                  size='sm'
                                  onClick={() => {
                                    setSelectedTournament(tournament);
                                    setCurrentView('bracket-viewer');
                                  }}
                                >
                                  <Eye className='h-4 w-4 mr-1' />
                                  Xem bảng đấu
                                </Button>
                              </div>
                            </div>

                            {tournament.current_participants < 3 && (
                              <div className='mt-3 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg'>
                                <p className='text-sm text-orange-700 dark:text-orange-300'>
                                  ⚠️ Cần ít nhất 3 người chơi để tạo bảng đấu
                                  Double Elimination. Hiện có:{' '}
                                  {tournament.current_participants} người.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      );
    }

    if (currentView === 'bracket-viewer' && selectedTournament) {
      return (
        <div className='space-y-6'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={e => {
                e.stopPropagation();
                setCurrentView('list');
                setDetailActiveTab('overview'); // Reset tab when going back
              }}
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại danh sách
            </Button>
            <div>
              <h2 className='text-2xl font-bold text-foreground'>
                Quản lý giải đấu: {selectedTournament.name}
              </h2>
              <p className='text-muted-foreground'>
                {selectedTournament.description}
              </p>
            </div>
          </div>

          {/* Tournament Header */}
          <Card className='bg-gradient-primary text-primary-foreground'>
            <CardContent className='p-8 text-center'>
              <div className='flex items-center justify-center gap-3 mb-4'>
                <Trophy className='w-8 h-8' />
                <h1 className='text-3xl font-bold'>
                  {selectedTournament.name}
                </h1>
              </div>
              <p className='text-lg opacity-90'>
                {selectedTournament.max_participants} Người chơi -{' '}
                {getTournamentTypeLabel(selectedTournament.tournament_type)}
              </p>
            </CardContent>
          </Card>

          {/* Tabbed Interface */}
          <Tabs
            value={detailActiveTab}
            onValueChange={setDetailActiveTab}
            className='space-y-4'
          >
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='overview' className='flex items-center gap-2'>
                <Target className='w-4 h-4' />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger
                value='participants'
                className='flex items-center gap-2'
              >
                <Users className='w-4 h-4' />
                Người tham gia
              </TabsTrigger>
              <TabsTrigger value='matches' className='flex items-center gap-2'>
                <Calendar className='w-4 h-4' />
                Trận đấu
              </TabsTrigger>
              <TabsTrigger value='bracket' className='flex items-center gap-2'>
                <Trophy className='w-4 h-4' />
                Sơ đồ giải đấu
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value='overview' className='space-y-6'>
              {/* Tournament Info */}
              <Card className='border-primary/20'>
                <CardContent className='p-6'>
                  <h3 className='text-xl font-bold text-foreground mb-4 flex items-center gap-2'>
                    <Target className='w-5 h-5 text-primary' />
                    Thông tin giải đấu
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='bg-gradient-subtle border-border rounded-lg p-4'>
                      <div className='flex items-center gap-3'>
                        <Users className='w-5 h-5 text-primary' />
                        <div>
                          <div className='text-sm text-muted-foreground'>
                            Số người chơi
                          </div>
                          <div className='font-semibold text-foreground'>
                            {selectedTournament.current_participants}/
                            {selectedTournament.max_participants}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='bg-gradient-subtle border-border rounded-lg p-4'>
                      <div className='flex items-center gap-3'>
                        <Target className='w-5 h-5 text-primary' />
                        <div>
                          <div className='text-sm text-muted-foreground'>
                            Loại giải
                          </div>
                          <div className='font-semibold text-foreground'>
                            {getTournamentTypeLabel(
                              selectedTournament.tournament_type
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='bg-gradient-subtle border-border rounded-lg p-4'>
                      <div className='flex items-center gap-3'>
                        <Hash className='w-5 h-5 text-primary' />
                        <div>
                          <div className='text-sm text-muted-foreground'>
                            Tổng số trận
                          </div>
                          <div className='font-semibold text-foreground'>
                            {existingMatches.length}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='bg-gradient-subtle border-border rounded-lg p-4'>
                      <div className='flex items-center gap-3'>
                        <Trophy className='w-5 h-5 text-primary' />
                        <div>
                          <div className='text-sm text-muted-foreground'>
                            Trạng thái
                          </div>
                          <div className='font-semibold text-foreground'>
                            {getStatusBadge(selectedTournament.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table Assignment Display */}
              {clubId && (
                <div className='space-y-4'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center justify-between'>
                        <span>Quản lý phân bàn</span>
                        <Button
                          onClick={() =>
                            handleAutoAssignTables(selectedTournament.id)
                          }
                          variant='outline'
                          size='sm'
                          disabled={autoAssigning}
                        >
                          {autoAssigning ? (
                            <>
                              <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                              Đang phân bàn...
                            </>
                          ) : (
                            <>
                              <Shuffle className='w-4 h-4 mr-2' />
                              Tự động phân bàn
                            </>
                          )}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <TableAssignmentDisplay
                    clubId={clubId}
                    tournamentId={selectedTournament.id}
                    showManagement={true}
                  />
                </div>
              )}
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value='participants' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='w-5 h-5' />
                    Danh sách người tham gia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center py-8 text-muted-foreground'>
                    <Users className='w-12 h-12 mx-auto mb-4' />
                    <p>
                      Tính năng quản lý người tham gia sẽ được triển khai sớm
                    </p>
                    <p className='text-sm'>
                      Hiện tại có {selectedTournament.current_participants}{' '}
                      người đăng ký
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value='matches' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Calendar className='w-5 h-5' />
                    Quản lý trận đấu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center py-8 text-muted-foreground'>
                    <Calendar className='w-12 h-12 mx-auto mb-4' />
                    <p>
                      Tính năng quản lý trận đấu chi tiết sẽ được triển khai sớm
                    </p>
                    <p className='text-sm'>
                      Hiện tại có {existingMatches.length} trận đấu trong giải
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tournament Bracket Tab */}
            <TabsContent value='bracket' className='space-y-6'>
              <TournamentBracket
                tournamentId={selectedTournament.id}
                adminMode={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      );
    }

    // Default list view
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-foreground'>
              Tournament Management Hub
            </h2>
            <p className='text-muted-foreground'>
              Quản lý giải đấu, tạo bảng đấu và theo dõi kết quả trong một nơi
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => setCurrentView('bracket-manager')}
            >
              <Trophy className='w-4 h-4 mr-2' />
              Quản lý Bảng đấu
            </Button>
            <Button onClick={handleCreateTournament}>
              <Plus className='w-4 h-4 mr-2' />
              Tạo giải đấu mới
            </Button>
          </div>
        </div>

        <div className='flex items-center justify-between bg-card border rounded-lg p-4'>
          <div className='flex items-center gap-4'>
            <div className='text-sm text-muted-foreground'>
              <span className='font-medium'>{tournaments.length}</span> giải đấu
              được tìm thấy
            </div>
          </div>
          <Button variant='outline' size='sm' onClick={fetchTournaments}>
            <RefreshCw className='w-4 h-4 mr-2' />
            Đồng bộ
          </Button>
        </div>

        <Tabs
          value={activeFilter}
          onValueChange={setActiveFilter}
          className='space-y-4'
        >
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='active'>Đang hoạt động</TabsTrigger>
            <TabsTrigger value='upcoming'>Sắp diễn ra</TabsTrigger>
            <TabsTrigger value='completed'>Đã kết thúc</TabsTrigger>
            <TabsTrigger value='all'>Tất cả</TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilter} className='space-y-4'>
            {filteredTournaments.length === 0 ? (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <Trophy className='h-12 w-12 text-muted-foreground mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>
                    Chưa có giải đấu nào
                  </h3>
                  <p className='text-muted-foreground text-center mb-4'>
                    {tournaments.length === 0
                      ? 'Hiện tại chưa có giải đấu nào. Tạo giải đấu mới để bắt đầu.'
                      : 'Không có giải đấu nào trong danh mục này.'}
                  </p>
                  <Button onClick={handleCreateTournament}>
                    <Plus className='w-4 h-4 mr-2' />
                    Tạo giải đấu đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className='grid gap-4'>
                {filteredTournaments.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Participants Modal */}
        <Dialog
          open={participantsModalOpen}
          onOpenChange={setParticipantsModalOpen}
        >
          <DialogContent className='sm:max-w-2xl max-h-[600px]'>
            <DialogHeader>
              <DialogTitle>
                Danh sách thành viên - {selectedTournament?.name}
              </DialogTitle>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div className='text-center'>
                  <div className='font-semibold text-foreground'>Tổng số</div>
                  <div className='text-muted-foreground'>
                    {tournamentParticipants.length}
                  </div>
                </div>
                <div className='text-center'>
                  <div className='font-semibold text-green-600'>
                    Đã xác nhận
                  </div>
                  <div className='text-muted-foreground'>
                    {
                      tournamentParticipants.filter(
                        p => p.registration_status === 'confirmed'
                      ).length
                    }
                  </div>
                </div>
                <div className='text-center'>
                  <div className='font-semibold text-blue-600'>
                    Đã thanh toán
                  </div>
                  <div className='text-muted-foreground'>
                    {
                      tournamentParticipants.filter(
                        p => p.payment_status === 'paid'
                      ).length
                    }
                  </div>
                </div>
                <div className='text-center'>
                  <div className='font-semibold text-primary'>Tổng thu</div>
                  <div className='text-muted-foreground'>
                    {(
                      tournamentParticipants.filter(
                        p => p.payment_status === 'paid'
                      ).length *
                      (tournamentParticipants[0]?.tournaments?.entry_fee || 0)
                    ).toLocaleString('vi-VN')}{' '}
                    VND
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className='space-y-4 max-h-[400px] overflow-y-auto'>
              {tournamentParticipants.length === 0 ? (
                <div className='text-center py-8'>
                  <Users className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
                  <p className='text-muted-foreground'>Chưa có ai đăng ký</p>
                </div>
              ) : (
                tournamentParticipants.map(participant => (
                  <Card key={participant.id} className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <UserAvatar
                          userId={participant.user_id}
                          size='md'
                          showRank={true}
                          showName={false}
                        />
                        <div>
                          <div className='font-semibold'>
                            {participant.profiles?.display_name ||
                              participant.profiles?.full_name ||
                              'Chưa có tên'}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            📞 {participant.profiles?.phone || 'Chưa có SĐT'}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            📅{' '}
                            {format(
                              new Date(participant.registration_date),
                              'dd/MM/yyyy HH:mm',
                              { locale: vi }
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            💰 Phí:{' '}
                            {(
                              participant.tournaments?.entry_fee || 0
                            ).toLocaleString('vi-VN')}{' '}
                            VND
                          </div>
                        </div>
                      </div>

                      <div className='flex flex-col gap-2'>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant={
                              participant.registration_status === 'confirmed'
                                ? 'default'
                                : participant.registration_status === 'pending'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {participant.registration_status === 'confirmed'
                              ? '✅ Đã xác nhận'
                              : participant.registration_status === 'pending'
                                ? '⏳ Chờ xác nhận'
                                : participant.registration_status}
                          </Badge>

                          <Badge
                            variant={
                              participant.payment_status === 'paid'
                                ? 'default'
                                : participant.payment_status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {participant.payment_status === 'paid'
                              ? '✅ Đã thanh toán'
                              : participant.payment_status === 'pending'
                                ? '⏳ Chờ thanh toán'
                                : participant.payment_status === 'unpaid'
                                  ? '❌ Chưa thanh toán'
                                  : participant.payment_status}
                          </Badge>
                        </div>

                        <div className='flex items-center gap-2'>
                          {participant.registration_status === 'pending' && (
                            <Button
                              size='sm'
                              onClick={() => confirmParticipant(participant.id)}
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <Check className='w-4 h-4 mr-1' />
                              Xác nhận ĐK
                            </Button>
                          )}

                          {(participant.payment_status === 'pending' ||
                            participant.payment_status === 'unpaid') && (
                            <Button
                              size='sm'
                              onClick={() => confirmPayment(participant.id)}
                              className='bg-blue-600 hover:bg-blue-700'
                            >
                              <CreditCard className='w-4 h-4 mr-1' />
                              Xác nhận TT
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {participant.notes && (
                      <div className='mt-2 p-2 bg-muted rounded text-sm'>
                        💬 {participant.notes}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>

            <div className='flex justify-end'>
              <Button
                variant='outline'
                onClick={() => setParticipantsModalOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Results Modal */}
        <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
          <DialogContent className='max-w-7xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Trophy className='w-6 h-6 text-yellow-500' />
                Kết quả giải đấu: {selectedTournamentForResults?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedTournamentForResults && (
              <div className='mt-4'>
                <TournamentResults
                  tournamentId={selectedTournamentForResults.id}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Tournament Details Modal - Auto-sync with real-time updates */}
        {selectedTournamentForDetails && (
          <TournamentDetailsModal
            tournament={selectedTournamentForDetails as any}
            isOpen={detailsModalOpen}
            onClose={() => {
              setDetailsModalOpen(false);
              setSelectedTournamentForDetails(null);
            }}
          />
        )}

        {/* Edit Tournament Modal */}
        {editingTournament && (
          <EditTournamentModal
            tournament={TournamentAdapter.toEnhanced(
              editingTournament as TournamentType
            )}
            isOpen={!!editingTournament}
            onClose={() => setEditingTournament(null)}
            onTournamentUpdated={updatedTournament => {
              setEditingTournament(null);
              fetchTournaments();
            }}
          />
        )}
      </div>
    );
  }
);

TournamentManagementHub.displayName = 'TournamentManagementHub';

export default TournamentManagementHub;
