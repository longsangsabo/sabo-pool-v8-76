import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TournamentFormData, TournamentDraft, TournamentValidationErrors, TournamentRewards, EnhancedTournament } from '@/types/tournament-extended';
import { TournamentTier, TournamentType, GameFormat, TournamentStatus } from '@/types/tournament-enums';
import { RankCode } from '@/utils/eloConstants';
import { toast } from 'sonner';

interface TournamentContextType {
  // Current tournament state
  tournament: TournamentFormData | null;
  isDraft: boolean;
  isValid: boolean;
  currentStep: number;
  validationErrors: TournamentValidationErrors;
  
  // Draft management
  draft: TournamentDraft | null;
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;
  
  // Tournament operations
  updateTournament: (data: Partial<TournamentFormData>) => void;
  updateRewards: (rewards: TournamentRewards) => void;
  loadRewardsFromDatabase: (tournamentId: string) => Promise<TournamentRewards>;
  validateTournament: () => boolean;
  resetTournament: () => void;
  
  // Form navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Auto-calculation
  calculateRewards: () => TournamentRewards;
  recalculateOnChange: boolean;
  setRecalculateOnChange: (value: boolean) => void;
  
  // Actions
  createTournament: () => Promise<EnhancedTournament | null>;
  updateExistingTournament: (id: string) => Promise<EnhancedTournament | null>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Default tournament data
const getDefaultTournamentData = (): TournamentFormData => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    name: '',
    description: '',
    tier_level: TournamentTier.K,
    max_participants: 16,
    tournament_type: TournamentType.SINGLE_ELIMINATION,
    game_format: GameFormat.NINE_BALL,
    entry_fee: 100000,
    prize_pool: 0,
    has_third_place_match: true,
    registration_start: now.toISOString().slice(0, 16),
    registration_end: tomorrow.toISOString().slice(0, 16),
    tournament_start: nextWeek.toISOString().slice(0, 16),
    tournament_end: nextWeek.toISOString().slice(0, 16),
    venue_address: '',
    eligible_ranks: [],
    allow_all_ranks: true,
    requires_approval: false,
    is_public: true,
  };
};

// Auto-calculate rewards based on tournament parameters
const calculateTournamentRewards = async (
  tier: TournamentTier, 
  entryFee: number, 
  maxParticipants: number,
  gameFormat: GameFormat,
  maxRankRequirement?: RankCode
): Promise<TournamentRewards> => {
  // Import RewardsService dynamically to avoid circular imports
  try {
    const { RewardsService } = await import('@/services/RewardsService');
    return RewardsService.calculateTournamentRewards(
      'champion',
      maxRankRequirement || 'K',
      maxParticipants,
      entryFee
    );
  } catch (error) {
    console.error('Error loading RewardsService:', error);
    // Fallback to basic calculation
    return {
      totalPrize: Math.round(entryFee * maxParticipants * 0.75),
      showPrizes: entryFee > 0,
      positions: [
        {
          position: 1,
          name: 'Vô địch',
          eloPoints: 100,
          spaPoints: 1000,
          cashPrize: Math.round(entryFee * maxParticipants * 0.75 * 0.5),
          items: ['Cúp vô địch'],
          isVisible: true,
        },
      ],
      specialAwards: [],
    };
  }
};

// Get SPA points based on tier and position
const getSpaPoints = (tier: TournamentTier, position: number): number => {
  const spaPointsMap = {
    [TournamentTier.K]: { 1: 900, 2: 700, 3: 500, 4: 350 },
    [TournamentTier.I]: { 1: 1000, 2: 800, 3: 600, 4: 400 },
    [TournamentTier.H]: { 1: 1200, 2: 950, 3: 700, 4: 450 },
    [TournamentTier.G]: { 1: 1500, 2: 1200, 3: 900, 4: 600 },
    [TournamentTier.F]: { 1: 1800, 2: 1400, 3: 1100, 4: 750 },
    [TournamentTier.E]: { 1: 2100, 2: 1650, 3: 1300, 4: 900 },
  };
  
  return spaPointsMap[tier]?.[position as keyof typeof spaPointsMap[TournamentTier]] || 0;
};

// Enhanced validation function
const validateTournamentData = (data: Partial<TournamentFormData>): TournamentValidationErrors => {
  console.log('🔍 validateTournamentData called with:', data);
  const errors: TournamentValidationErrors = {};
  
  if (!data.name?.trim()) {
    console.log('❌ Name validation failed');
    errors.name = 'Tên giải đấu là bắt buộc';
  }
  
  if (!data.venue_address?.trim()) {
    console.log('❌ Venue address validation failed');
    errors.venue_address = 'Địa điểm tổ chức là bắt buộc';
  }
  
  if (!data.tournament_start) {
    console.log('❌ Tournament start date validation failed');
    errors.tournament_start = 'Ngày bắt đầu giải đấu là bắt buộc';
  }
  
  if (!data.tournament_end) {
    console.log('❌ Tournament end date validation failed');
    errors.tournament_end = 'Ngày kết thúc giải đấu là bắt buộc';
  }
  
  if (!data.max_participants || data.max_participants < 2) {
    console.log('❌ Max participants validation failed');
    errors.max_participants = 'Số lượng người chơi phải ít nhất là 2';
  }
  
  if (data.tournament_start && data.tournament_end) {
    if (new Date(data.tournament_end) <= new Date(data.tournament_start)) {
      console.log('❌ Tournament end date validation failed');
      errors.tournament_end = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
  }
  
  if (data.registration_end && data.tournament_start) {
    if (new Date(data.registration_end) > new Date(data.tournament_start)) {
      console.log('❌ Registration end date validation failed');
      errors.registration_end = 'Thời gian đóng đăng ký phải trước khi giải đấu bắt đầu';
    }
  }
  
  if (!data.allow_all_ranks && (!data.eligible_ranks || data.eligible_ranks.length === 0)) {
    console.log('❌ Eligible ranks validation failed');
    errors.eligible_ranks = 'Vui lòng chọn ít nhất một hạng hoặc cho phép tất cả hạng';
  }
  
  console.log('🔍 Validation errors:', errors);
  return errors;
};

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<TournamentFormData | null>(getDefaultTournamentData());
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<TournamentValidationErrors>({});
  const [draft, setDraft] = useState<TournamentDraft | null>(null);
  const [recalculateOnChange, setRecalculateOnChange] = useState(true);
  
  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);
  
  // Auto-save draft when tournament changes
  useEffect(() => {
    if (tournament) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 1000); // Auto-save after 1 second of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [tournament]);
  
  const saveDraft = useCallback(() => {
    if (!tournament) return;
    
    const newDraft: TournamentDraft = {
      ...tournament,
      lastModified: new Date().toISOString(),
      isValid: Object.keys(validateTournamentData(tournament)).length === 0,
      step: currentStep,
    };
    
    setDraft(newDraft);
    localStorage.setItem('tournament-draft', JSON.stringify(newDraft));
  }, [tournament, currentStep]);
  
  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem('tournament-draft');
      if (savedDraft) {
        const parsedDraft: TournamentDraft = JSON.parse(savedDraft);
        setDraft(parsedDraft);
        
        // Load draft data into tournament state
        const { lastModified, isValid, step, ...draftData } = parsedDraft;
        setTournament({ ...getDefaultTournamentData(), ...draftData });
        setCurrentStep(step || 0);
        
        toast.success('Đã tải bản nháp từ lần trước');
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);
  
  const clearDraft = useCallback(() => {
    localStorage.removeItem('tournament-draft');
    setDraft(null);
    setTournament(getDefaultTournamentData());
    setCurrentStep(0);
    setValidationErrors({});
    toast.success('Đã xóa bản nháp');
  }, []);
  
  const updateTournament = useCallback((data: Partial<TournamentFormData>) => {
    setTournament(prev => {
      if (!prev) return getDefaultTournamentData();
      
      const updated = { ...prev, ...data };
      
      // Auto-calculate rewards if relevant fields changed and auto-calc is enabled
      if (recalculateOnChange && (
        data.tier_level !== undefined ||
        data.entry_fee !== undefined ||
        data.max_participants !== undefined ||
        data.game_format !== undefined
      )) {
        // For synchronous updates, use basic calculation to avoid async issues
        // We'll calculate rewards asynchronously in the background
        calculateTournamentRewards(
          updated.tier_level,
          updated.entry_fee || 0,
          updated.max_participants || 16,
          updated.game_format,
          updated.max_rank_requirement
        ).then(rewards => {
          setTournament(current => current ? { ...current, rewards } : current);
        }).catch(console.error);
      }
      
      // Validate updated data
      const errors = validateTournamentData(updated);
      setValidationErrors(errors);
      
      return updated;
    });
  }, [recalculateOnChange]);
  
  const updateRewards = useCallback((rewards: TournamentRewards) => {
    console.log('🔄 [TournamentContext] updateRewards called with:', rewards);
    setTournament(prev => {
      console.log('🔍 [TournamentContext] Previous tournament state:', prev);
      if (!prev) return null;
      const updated = { ...prev, rewards };
      console.log('✅ [TournamentContext] Updated tournament state:', updated);
      return updated;
    });
  }, []);

  const loadRewardsFromDatabase = useCallback(async (tournamentId: string): Promise<TournamentRewards> => {
    try {
      console.log('🔍 Loading rewards from database for tournament:', tournamentId);
      
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Fetch tournament with prize distribution
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select('prize_pool, entry_fee, max_participants')
        .eq('id', tournamentId)
        .maybeSingle();
        
      if (error) {
        console.error('❌ Error fetching tournament rewards:', error);
        throw error;
      }
      
      if (!tournament) {
        console.warn('⚠️ Tournament not found, returning default rewards');
        return {
          totalPrize: 0,
          showPrizes: false,
          positions: [],
          specialAwards: []
        };
      }
      
      console.log('📊 Raw tournament data:', tournament);
      
      // Parse prize_distribution based on format
      let rewards: TournamentRewards;
      
      if (tournament.prize_distribution) {
        // Check if it's new format (TournamentRewards object)
        if (typeof tournament.prize_distribution === 'object' && 
            !Array.isArray(tournament.prize_distribution) &&
            tournament.prize_distribution.hasOwnProperty('totalPrize')) {
          console.log('✅ Found new format rewards');
          rewards = tournament.prize_distribution as unknown as TournamentRewards;
        }
        // Check if it's old format {1: 2000000, 2: 1200000}
        else if (typeof tournament.prize_distribution === 'object' && !Array.isArray(tournament.prize_distribution)) {
          console.log('🔄 Converting old format to new format');
          const positions: any[] = [];
          const prizeData = tournament.prize_distribution as unknown as Record<string, number>;
          
          Object.entries(prizeData).forEach(([positionStr, cashPrize]) => {
            const position = parseInt(positionStr);
            if (!isNaN(position)) {
              positions.push({
                position,
                name: position === 1 ? 'Vô địch' : 
                      position === 2 ? 'Á quân' : 
                      position === 3 ? 'Hạng 3' : `Hạng ${position}`,
                eloPoints: position === 1 ? 100 : position === 2 ? 75 : position === 3 ? 50 : 25,
                spaPoints: position === 1 ? 1000 : position === 2 ? 700 : position === 3 ? 500 : 300,
                cashPrize: Number(cashPrize) || 0,
                items: position <= 3 ? ['Huy chương'] : [],
                isVisible: true
              });
            }
          });
          
          rewards = {
            totalPrize: tournament.prize_pool || 0,
            showPrizes: true,
            positions: positions.sort((a, b) => a.position - b.position),
            specialAwards: []
          };
        }
        else {
          console.warn('⚠️ Unknown prize_distribution format, using fallback');
          rewards = await calculateTournamentRewards(
            1, // Default tier
            tournament.entry_fee || 0,
            tournament.max_participants || 16,
            GameFormat.NINE_BALL
          );
        }
      } else {
        console.log('📝 No prize_distribution found, calculating default');
        rewards = await calculateTournamentRewards(
          1, // Default tier
          tournament.entry_fee || 0,
          tournament.max_participants || 16,
          GameFormat.NINE_BALL
        );
      }
      
      console.log('✅ Loaded rewards:', rewards);
      return rewards;
      
    } catch (error) {
      console.error('❌ Error loading rewards from database:', error);
      // Return fallback rewards
      return {
        totalPrize: 0,
        showPrizes: false,
        positions: [
          {
            position: 1,
            name: 'Vô địch',
            eloPoints: 100,
            spaPoints: 1000,
            cashPrize: 0,
            items: ['Cúp vô địch'],
            isVisible: true
          }
        ],
        specialAwards: []
      };
    }
  }, []);
  
  const calculateRewards = useCallback((): TournamentRewards => {
    if (!tournament) {
      return {
        totalPrize: 0,
        showPrizes: false,
        positions: [],
        specialAwards: [],
      };
    }
    
    // Use basic calculation for synchronous operation
    const totalPrize = Math.round(tournament.entry_fee * tournament.max_participants * 0.75);
    return {
      totalPrize,
      showPrizes: tournament.entry_fee > 0,
      positions: [
        {
          position: 1,
          name: 'Vô địch',
          eloPoints: 100,
          spaPoints: getSpaPoints(tournament.tier_level, 1),
          cashPrize: Math.round(totalPrize * 0.5),
          items: ['Cúp vô địch'],
          isVisible: true,
        },
        {
          position: 2,
          name: 'Á quân',
          eloPoints: 75,
          spaPoints: getSpaPoints(tournament.tier_level, 2),
          cashPrize: Math.round(totalPrize * 0.3),
          items: ['Cúp á quân'],
          isVisible: true,
        },
      ],
      specialAwards: [],
    };
  }, [tournament]);
  
  const validateTournament = useCallback((): boolean => {
    console.log('🔍 validateTournament called');
    if (!tournament) {
      console.log('❌ No tournament data');
      return false;
    }
    
    console.log('🔍 Tournament data in validation:', tournament);
    const errors = validateTournamentData(tournament);
    console.log('🔍 Validation errors:', errors);
    setValidationErrors(errors);
    
    const isValid = Object.keys(errors).length === 0;
    console.log('🔍 Is valid:', isValid);
    return isValid;
  }, [tournament]);
  
  const resetTournament = useCallback(() => {
    setTournament(getDefaultTournamentData());
    setCurrentStep(0);
    setValidationErrors({});
    clearDraft();
  }, [clearDraft]);
  
  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);
  
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);
  
  const createTournament = useCallback(async (): Promise<EnhancedTournament | null> => {
    console.log('🏗️ createTournament function called');
    console.log('📝 Tournament data:', tournament);
    
    if (!tournament) {
      console.error('❌ No tournament data');
      throw new Error('No tournament data available');
    }
    
    const validationResult = validateTournament();
    console.log('🔍 Validation result:', validationResult);
    
    if (!validationResult) {
      console.error('❌ Validation failed in createTournament');
      console.error('❌ Tournament data:', tournament);
      console.error('❌ Validation errors:', validationErrors);
      throw new Error('Validation failed');
    }
    
    try {
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);
      
      if (userError || !user) {
        console.error('❌ User authentication error:', userError);
        throw new Error('User not authenticated');
      }
      
      // Get user's club profile to set club_id
      console.log('🏢 Fetching user club profile...');
      const { data: clubProfile, error: clubError } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (clubError) {
        console.error('❌ Error fetching club profile:', clubError);
        throw new Error('Error fetching club information');
      }
      
      if (!clubProfile) {
        console.error('❌ User does not have a club profile');
        throw new Error('You must have a club profile to create tournaments');
      }
      
      console.log('🏢 Found club profile:', clubProfile.id);
      
      // Use user-entered prize pool directly, no calculation needed
      console.log('🔍 Using direct prize_pool from form:', tournament.prize_pool);

      // Map rewards to database format (keeping existing structure for compatibility)
      const prizeDistribution: Record<string, number> = {};
      const spaPointsConfig: Record<string, number> = {};
      const eloPointsConfig: Record<string, number> = {};
      const physicalPrizes: Record<string, any> = {};

      // Convert rewards to database format if they exist
      if (tournament.rewards?.positions) {
        tournament.rewards.positions.forEach(position => {
          const posKey = position.position.toString();
          prizeDistribution[posKey] = position.cashPrize || 0;
          spaPointsConfig[posKey] = position.spaPoints || 0;
          eloPointsConfig[posKey] = position.eloPoints || 0;
          
          if (position.items && position.items.length > 0) {
            physicalPrizes[posKey] = {
              name: position.items[0],
              icon: position.position === 1 ? '🏆' : position.position === 2 ? '🥈' : '🥉',
              color: position.position === 1 ? 'text-tournament-gold' : 
                     position.position === 2 ? 'text-tournament-silver' : 'text-tournament-bronze'
            };
          }
        });
      }

      // Add default values if no specific positions
      if (Object.keys(prizeDistribution).length === 0) {
        prizeDistribution['default'] = 0;
        spaPointsConfig['default'] = 100;
        eloPointsConfig['default'] = 1;
      }

      // Calculate registration_end: 1 day before tournament start if not provided
      const startDate = new Date(tournament.tournament_start);
      const calculatedRegistrationEnd = new Date(startDate);
      calculatedRegistrationEnd.setDate(calculatedRegistrationEnd.getDate() - 1);
      
      // Prepare tournament data for database (map fields correctly)
      console.log('🔍 PRIZE_POOL DEBUG - tournament object:', tournament);
      console.log('🔍 PRIZE_POOL DEBUG - tournament.prize_pool:', tournament.prize_pool);
      console.log('🔍 PRIZE_POOL DEBUG - typeof tournament.prize_pool:', typeof tournament.prize_pool);
      
      const tournamentData = {
        name: tournament.name,
        description: tournament.description || '',
        tournament_type: tournament.tournament_type,
        game_format: tournament.game_format,
        max_participants: parseInt(tournament.max_participants.toString()) || 8,
        entry_fee: parseFloat(tournament.entry_fee?.toString() || '0') || 0,
        prize_pool: parseFloat(tournament.prize_pool?.toString() || '0') || 0, // Ensure proper number conversion
        start_date: tournament.tournament_start,
        end_date: tournament.tournament_end,
        registration_start: tournament.registration_start,
        registration_end: tournament.registration_end || calculatedRegistrationEnd.toISOString(),
        venue_address: tournament.venue_address,
        is_public: tournament.is_public,
        tier_level: tournament.tier_level,
        requires_approval: tournament.requires_approval || false,
        has_third_place_match: tournament.has_third_place_match || false,
        status: 'upcoming',
        current_participants: 0,
        created_by: user.id,
        club_id: clubProfile.id,
        tier: 'I', // Default tier mapping
        max_rank_requirement: tournament.max_rank_requirement,
        min_rank_requirement: tournament.min_rank_requirement,
        // Store rewards in correct database fields
        // Note: prize_distribution column removed - using tournament_prize_tiers table
        spa_points_config: spaPointsConfig,
        elo_points_config: eloPointsConfig,
        physical_prizes: physicalPrizes,
      };
      
      console.log('📦 Tournament payload:', tournamentData);
      console.log('🔍 CRITICAL DEBUG - original tournament object:', tournament);
      console.log('🔍 CRITICAL DEBUG - tournament.tournament_type:', tournament.tournament_type);
      console.log('🔍 CRITICAL DEBUG - tournamentData.tournament_type:', tournamentData.tournament_type);
      console.log('🔍 CRITICAL DEBUG - typeof tournament.tournament_type:', typeof tournament.tournament_type);
      console.log('🔍 CRITICAL DEBUG - TournamentType enum values:', TournamentType);
      console.log('🔍 CRITICAL DEBUG - enum comparison - SINGLE:', TournamentType.SINGLE_ELIMINATION);
      console.log('🔍 CRITICAL DEBUG - enum comparison - DOUBLE:', TournamentType.DOUBLE_ELIMINATION);
      
      // Create tournament in database
      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournamentData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Tournament inserted successfully:', data);
      
      toast.success('Tạo giải đấu thành công!');
      clearDraft();
      
      // Map database response to EnhancedTournament
      const enhancedTournament: EnhancedTournament = {
        ...data,
        tournament_type: data.tournament_type as TournamentType,
        game_format: data.game_format as GameFormat,
        tier_level: data.tier_level as TournamentTier,
        status: data.status as TournamentStatus,
        contact_info: typeof data.contact_info === 'string' ? data.contact_info : JSON.stringify(data.contact_info || ''),
        min_rank_requirement: data.min_rank_requirement as RankCode,
        max_rank_requirement: data.max_rank_requirement as RankCode,
        tournament_start: data.start_date,
        tournament_end: data.end_date,
        rewards: tournament.rewards || { totalPrize: tournament.prize_pool || 0, showPrizes: true, positions: [], specialAwards: [] },
        eligible_ranks: tournament.eligible_ranks || [],
        allow_all_ranks: tournament.allow_all_ranks || true,
        available_slots: data.max_participants - data.current_participants,
        registration_status: 'not_started' as const,
      };
      
      return enhancedTournament;
    } catch (error) {
      console.error('❌ Failed to create tournament:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Tournament creation failed: ${errorMessage}`);
    }
  }, [tournament, validateTournament, calculateRewards, clearDraft, validationErrors]);
  
  const updateExistingTournament = useCallback(async (id: string): Promise<EnhancedTournament | null> => {
    if (!tournament || !validateTournament()) {
      toast.error('Vui lòng kiểm tra lại thông tin giải đấu');
      return null;
    }
    
    try {
      // TODO: Implement actual API call to update tournament
      toast.success('Cập nhật giải đấu thành công!');
      return null;
    } catch (error) {
      console.error('Failed to update tournament:', error);
      toast.error('Có lỗi xảy ra khi cập nhật giải đấu');
      return null;
    }
  }, [tournament, validateTournament]);
  
  const value: TournamentContextType = {
    tournament,
    isDraft: !!draft,
    isValid: Object.keys(validationErrors).length === 0,
    currentStep,
    validationErrors,
    
    draft,
    saveDraft,
    loadDraft,
    clearDraft,
    
    updateTournament,
    updateRewards,
    loadRewardsFromDatabase,
    validateTournament,
    resetTournament,
    
    setCurrentStep,
    nextStep,
    prevStep,
    
    calculateRewards,
    recalculateOnChange,
    setRecalculateOnChange,
    
    createTournament,
    updateExistingTournament,
  };
  
  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

export default TournamentProvider;