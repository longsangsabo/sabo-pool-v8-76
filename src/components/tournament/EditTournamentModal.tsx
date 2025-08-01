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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Trophy,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { QuickRewardAllocation } from './QuickRewardAllocation';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { format } from 'date-fns';

import {
  EnhancedTournament,
  TournamentFormData,
} from '@/types/tournament-extended';
import {
  TournamentStatus,
  TournamentType,
  GameFormat,
  TournamentTier,
} from '@/types/tournament-enums';

interface EditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: EnhancedTournament;
  onTournamentUpdated: (tournament: EnhancedTournament) => void;
}

const formSchema = z.object({
  name: z.string().min(3, {
    message: 'Tournament name must be at least 3 characters.',
  }),
  description: z.string().optional(),
  tournament_type: z.nativeEnum(TournamentType),
  game_format: z.nativeEnum(GameFormat),
  tier_level: z
    .preprocess(val => Number(val), z.number().min(1).max(6))
    .transform(val => val as TournamentTier),
  max_participants: z.preprocess(
    val => Number(val),
    z
      .number()
      .min(2, { message: 'Min participants is 2' })
      .max(256, { message: 'Max participants is 256' })
  ),
  current_participants: z.number().optional(),
  registration_start: z.string(),
  registration_end: z.string(),
  tournament_start: z.string(),
  tournament_end: z.string(),
  club_id: z.string().optional(),
  venue_address: z.string(),
  entry_fee: z.preprocess(val => Number(val), z.number().min(0)),
  prize_pool: z.preprocess(val => Number(val), z.number().min(0)),
  status: z.nativeEnum(TournamentStatus),
  management_status: z.string().optional(),
  rules: z.string().optional(),
  contact_info: z.string().optional(),
  banner_image: z.string().optional(),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  has_third_place_match: z.boolean().optional(),
});

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onTournamentUpdated,
}) => {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: tournament.name,
    description: tournament.description || '',
    tournament_type: tournament.tournament_type,
    game_format: tournament.game_format,
    tier_level: tournament.tier_level,
    max_participants: tournament.max_participants,
    registration_start: tournament.registration_start,
    registration_end: tournament.registration_end,
    tournament_start: tournament.tournament_start,
    tournament_end: tournament.tournament_end,
    venue_address: tournament.venue_address,
    entry_fee: tournament.entry_fee,
    prize_pool: tournament.prize_pool,
    rules: tournament.rules || '',
    contact_info: tournament.contact_info || '',
    eligible_ranks: tournament.eligible_ranks || [],
    allow_all_ranks: tournament.allow_all_ranks || true,
    min_rank_requirement: tournament.min_rank_requirement,
    max_rank_requirement: tournament.max_rank_requirement,
    requires_approval: tournament.requires_approval || false,
    is_public: tournament.is_public || true,
  });
  const [prizeTiers, setPrizeTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showQuickAllocation, setShowQuickAllocation] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tournament.name,
      description: tournament.description || '',
      tournament_type: tournament.tournament_type,
      game_format: tournament.game_format,
      tier_level: tournament.tier_level,
      max_participants: tournament.max_participants,
      registration_start: tournament.registration_start,
      registration_end: tournament.registration_end,
      tournament_start: tournament.tournament_start,
      tournament_end: tournament.tournament_end,
      venue_address: tournament.venue_address,
      entry_fee: tournament.entry_fee,
      prize_pool: tournament.prize_pool,
      status: tournament.status,
      management_status: tournament.management_status || '',
      rules: tournament.rules || '',
      contact_info: tournament.contact_info || '',
      has_third_place_match: tournament.has_third_place_match || false,
    },
  });

  useEffect(() => {
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      tournament_type: tournament.tournament_type,
      game_format: tournament.game_format,
      tier_level: tournament.tier_level,
      max_participants: tournament.max_participants,
      registration_start: tournament.registration_start,
      registration_end: tournament.registration_end,
      tournament_start: tournament.tournament_start,
      tournament_end: tournament.tournament_end,
      venue_address: tournament.venue_address,
      entry_fee: tournament.entry_fee,
      prize_pool: tournament.prize_pool,
      rules: tournament.rules || '',
      contact_info: tournament.contact_info || '',
      eligible_ranks: tournament.eligible_ranks || [],
      allow_all_ranks: tournament.allow_all_ranks || true,
      min_rank_requirement: tournament.min_rank_requirement,
      max_rank_requirement: tournament.max_rank_requirement,
      requires_approval: tournament.requires_approval || false,
      is_public: tournament.is_public || true,
    });
  }, [tournament]);

  useEffect(() => {
    fetchPrizeTiers();
  }, [tournament.id]);

  const fetchPrizeTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_prize_tiers')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('position', { ascending: true });

      if (error) throw error;
      setPrizeTiers(data || []);
    } catch (error) {
      console.error('Error fetching prize tiers:', error);
      toast.error('Failed to load prize tiers');
    }
  };

  const updateTournament = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .update({
          ...values,
          tier_level: Number(values.tier_level),
          max_participants: Number(values.max_participants),
          entry_fee: Number(values.entry_fee),
          prize_pool: Number(values.prize_pool),
        })
        .eq('id', tournament.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state and close modal
      const enhancedData = {
        ...data,
        tournament_type: data.tournament_type as TournamentType,
        game_format: data.game_format as GameFormat,
        status: data.status as TournamentStatus,
        rewards: {
          totalPrize: data.prize_pool,
          showPrizes: true,
          positions: [],
          specialAwards: [],
        },
        available_slots: data.max_participants - data.current_participants,
        registration_status: 'open' as const,
        eligible_ranks: [],
        allow_all_ranks: true,
        requires_approval: false,
        is_public: true,
      };
      onTournamentUpdated(enhancedData as EnhancedTournament);
      onClose();
      toast.success('Tournament updated successfully!');
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast.error('Failed to update tournament');
    } finally {
      setLoading(false);
    }
  };

  const addNewTier = async () => {
    try {
      const newPosition =
        prizeTiers.length > 0
          ? prizeTiers[prizeTiers.length - 1].position + 1
          : 1;
      const { data, error } = await supabase
        .from('tournament_prize_tiers')
        .insert({
          tournament_id: tournament.id,
          position: newPosition,
          position_name: `Hạng ${newPosition}`,
          cash_amount: 0,
          elo_points: 0,
          spa_points: 0,
          items: [],
          is_visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPrizeTiers();
      toast.success('Prize tier added!');
    } catch (error) {
      console.error('Error adding prize tier:', error);
      toast.error('Failed to add prize tier');
    }
  };

  const updateTier = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('tournament_prize_tiers')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchPrizeTiers();
      toast.success('Prize tier updated!');
    } catch (error) {
      console.error('Error updating prize tier:', error);
      toast.error('Failed to update prize tier');
    }
  };

  const deleteTier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tournament_prize_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPrizeTiers();
      toast.success('Prize tier deleted!');
    } catch (error) {
      console.error('Error deleting prize tier:', error);
      toast.error('Failed to delete prize tier');
    }
  };

  const handleQuickAllocation = async (allocations: any[]) => {
    try {
      // Delete existing prize tiers
      await supabase
        .from('tournament_prize_tiers')
        .delete()
        .eq('tournament_id', tournament.id);

      // Insert new allocations
      const newTiers = allocations.map(allocation => ({
        tournament_id: tournament.id,
        position: allocation.position,
        position_name: allocation.name,
        cash_amount: allocation.cashAmount,
        elo_points: allocation.eloPoints,
        spa_points: allocation.spaPoints,
        items: allocation.items,
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('tournament_prize_tiers')
        .insert(newTiers);

      if (error) throw error;

      // Refresh prize tiers
      await fetchPrizeTiers();

      toast.success('Phân bổ phần thưởng thành công!');
    } catch (error) {
      console.error('Error applying quick allocation:', error);
      toast.error('Lỗi khi phân bổ phần thưởng');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa giải đấu</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue='details' className='space-y-4'>
            <TabsList>
              <TabsTrigger
                value='details'
                onClick={() => setActiveTab('details')}
              >
                Chi tiết
              </TabsTrigger>
              <TabsTrigger
                value='rewards'
                onClick={() => setActiveTab('rewards')}
              >
                Phần thưởng
              </TabsTrigger>
              {/* <TabsTrigger value="settings" onClick={() => setActiveTab('settings')}>Cài đặt</TabsTrigger> */}
            </TabsList>

            <TabsContent value='details' className='space-y-4'>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(updateTournament)}
                  className='space-y-4'
                >
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên giải đấu</FormLabel>
                        <FormControl>
                          <Input placeholder='Tên giải đấu' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Mô tả giải đấu' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='tournament_type'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loại giải đấu</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Chọn loại giải đấu' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem
                                value={TournamentType.SINGLE_ELIMINATION}
                              >
                                1 Mạng
                              </SelectItem>
                              <SelectItem
                                value={TournamentType.DOUBLE_ELIMINATION}
                              >
                                2 Mạng
                              </SelectItem>
                              <SelectItem value={TournamentType.ROUND_ROBIN}>
                                Vòng tròn
                              </SelectItem>
                              <SelectItem value={TournamentType.SWISS}>
                                Swiss
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='game_format'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thể thức</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Chọn thể thức' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={GameFormat.EIGHT_BALL}>
                                8 Ball
                              </SelectItem>
                              <SelectItem value={GameFormat.NINE_BALL}>
                                9 Ball
                              </SelectItem>
                              <SelectItem value={GameFormat.TEN_BALL}>
                                10 Ball
                              </SelectItem>
                              <SelectItem value={GameFormat.STRAIGHT_POOL}>
                                Straight Pool
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='tier_level'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hạng giải đấu</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Chọn hạng' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='1'>K - Mới bắt đầu</SelectItem>
                              <SelectItem value='2'>I - Cơ bản</SelectItem>
                              <SelectItem value={TournamentTier.H.toString()}>
                                H - Trung cấp
                              </SelectItem>
                              <SelectItem value={TournamentTier.G.toString()}>
                                G - Cao cấp
                              </SelectItem>
                              <SelectItem value={TournamentTier.F.toString()}>
                                F - Chuyên nghiệp
                              </SelectItem>
                              <SelectItem value={TournamentTier.E.toString()}>
                                E - Chuyên nghiệp cao cấp
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='max_participants'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số lượng người chơi</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='Số lượng'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='entry_fee'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phí tham gia</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='Phí tham gia'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='prize_pool'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tổng giải thưởng</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='Giải thưởng'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='venue_address'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa điểm</FormLabel>
                        <FormControl>
                          <Input placeholder='Địa điểm' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='registration_start'
                      render={({ field }) => (
                        <FormItem className='flex flex-col space-y-1.5'>
                          <FormLabel>Ngày mở đăng ký</FormLabel>
                          <FormControl>
                            <Input placeholder='Ngày mở đăng ký' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='registration_end'
                      render={({ field }) => (
                        <FormItem className='flex flex-col space-y-1.5'>
                          <FormLabel>Ngày đóng đăng ký</FormLabel>
                          <FormControl>
                            <Input placeholder='Ngày đóng đăng ký' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='tournament_start'
                      render={({ field }) => (
                        <FormItem className='flex flex-col space-y-1.5'>
                          <FormLabel>Ngày bắt đầu</FormLabel>
                          <FormControl>
                            <Input placeholder='Ngày bắt đầu' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='tournament_end'
                      render={({ field }) => (
                        <FormItem className='flex flex-col space-y-1.5'>
                          <FormLabel>Ngày kết thúc</FormLabel>
                          <FormControl>
                            <Input placeholder='Ngày kết thúc' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='rules'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Luật lệ</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Luật lệ' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='contact_info'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thông tin liên hệ</FormLabel>
                        <FormControl>
                          <Input placeholder='Thông tin liên hệ' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type='submit' disabled={loading}>
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value='rewards' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>
                  Chỉnh sửa phần thưởng giải đấu
                </h3>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowQuickAllocation(true)}
                    className='bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none hover:from-yellow-500 hover:to-orange-600'
                  >
                    <Zap className='w-4 h-4 mr-2' />
                    Phân bổ nhanh
                  </Button>
                  <Button variant='outline' size='sm' onClick={addNewTier}>
                    <Plus className='w-4 h-4 mr-2' />
                    Thêm vị trí
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {prizeTiers.map(tier => (
                  <Card key={tier.id}>
                    <CardHeader>
                      <CardTitle>
                        {tier.position_name}
                        <Badge className='ml-2'>{tier.position}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <DollarSign className='w-4 h-4 text-gray-500' />
                        <Input
                          type='number'
                          placeholder='Tiền thưởng'
                          value={tier.cash_amount}
                          onChange={e =>
                            updateTier(tier.id, 'cash_amount', e.target.value)
                          }
                        />
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Trophy className='w-4 h-4 text-gray-500' />
                        <Input
                          type='number'
                          placeholder='ELO Points'
                          value={tier.elo_points}
                          onChange={e =>
                            updateTier(tier.id, 'elo_points', e.target.value)
                          }
                        />
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Users className='w-4 h-4 text-gray-500' />
                        <Input
                          type='number'
                          placeholder='SPA Points'
                          value={tier.spa_points}
                          onChange={e =>
                            updateTier(tier.id, 'spa_points', e.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => deleteTier(tier.id)}
                        className='w-full'
                      >
                        <Trash2 className='w-4 h-4 mr-2' />
                        Xóa
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* <TabsContent value="settings" className="space-y-4">
              <h3>Cài đặt nâng cao</h3>
              <p>Các cài đặt nâng cao sẽ được thêm vào sau.</p>
            </TabsContent> */}
          </Tabs>

          <div className='flex justify-end'>
            <Button variant='outline' onClick={onClose}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QuickRewardAllocation
        isOpen={showQuickAllocation}
        onClose={() => setShowQuickAllocation(false)}
        onApply={handleQuickAllocation}
        totalPrizePool={formData.prize_pool || 0}
        currentAllocations={prizeTiers}
      />
    </>
  );
};
