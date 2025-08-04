import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Tournament } from '../../types/tournament.types';

const tournamentFormSchema = z.object({
  name: z.string().min(3, 'Tên giải đấu phải có ít nhất 3 ký tự'),
  description: z.string(),
  tournament_type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss']),
  game_format: z.enum(['8_ball', '9_ball', '10_ball', 'straight_pool']),
  max_participants: z.number().min(4, 'Tối thiểu 4 người tham gia'),
  entry_fee: z.number().min(0, 'Phí tham gia không được âm'),
  prize_pool: z.number().min(0, 'Tiền thưởng không được âm'),
  tournament_start: z.date(),
  tournament_end: z.date(),
  registration_start: z.date(),
  registration_end: z.date(),
  venue_address: z.string().optional(),
  rules: z.string().optional(),
  contact_info: z.string().optional(),
});

type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

interface TournamentFormProps {
  tournament?: Tournament;
  onSubmit: (data: TournamentFormValues) => void;
}

export function TournamentForm({ tournament, onSubmit }: TournamentFormProps) {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: tournament || {
      name: '',
      description: '',
      tournament_type: 'single_elimination',
      game_format: '8_ball',
      max_participants: 16,
      entry_fee: 0,
      prize_pool: 0,
      tournament_start: new Date(),
      tournament_end: new Date(),
      registration_start: new Date(),
      registration_end: new Date(),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên giải đấu</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên giải đấu..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mô tả chi tiết về giải đấu..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tournament_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thể thức</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thể thức" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single_elimination">Loại trực tiếp</SelectItem>
                    <SelectItem value="double_elimination">Loại kép</SelectItem>
                    <SelectItem value="round_robin">Vòng tròn</SelectItem>
                    <SelectItem value="swiss">Hệ Thụy Sĩ</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="game_format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Luật chơi</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn luật chơi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="8_ball">Bida 8 bi</SelectItem>
                    <SelectItem value="9_ball">Bida 9 bi</SelectItem>
                    <SelectItem value="10_ball">Bida 10 bi</SelectItem>
                    <SelectItem value="straight_pool">Straight Pool</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="max_participants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số người tham gia</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entry_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phí tham gia</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="registration_start"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Bắt đầu đăng ký</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Add similar date fields for registration_end, tournament_start, tournament_end */}
        </div>

        <FormField
          control={form.control}
          name="venue_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa điểm</FormLabel>
              <FormControl>
                <Input placeholder="Địa chỉ tổ chức..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rules"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Luật lệ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Các quy định và luật lệ..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {tournament ? 'Cập nhật giải đấu' : 'Tạo giải đấu'}
        </Button>
      </form>
    </Form>
  );
}
