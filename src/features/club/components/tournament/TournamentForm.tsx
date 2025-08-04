import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const tournamentFormSchema = z.object({
  name: z.string().min(1, 'Tên giải đấu không được để trống'),
  description: z.string().optional(),
  start_date: z.date({
    required_error: 'Vui lòng chọn ngày bắt đầu',
  }),
  end_date: z.date().optional(),
  registration_deadline: z.date().optional(),
  max_participants: z.number().int().min(2).optional(),
  entry_fee: z.number().min(0).optional(),
  format: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss']),
  match_format: z.enum(['race_to', 'time_limit', 'points']),
  match_format_value: z.number().min(1),
});

type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

interface TournamentFormProps {
  clubId: string;
  onSuccess?: () => void;
}

export const TournamentForm: React.FC<TournamentFormProps> = ({ clubId, onSuccess }) => {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      format: 'single_elimination',
      match_format: 'race_to',
      match_format_value: 5,
    },
  });

  const onSubmit = async (data: TournamentFormValues) => {
    try {
      // TODO: Implement API call
      const response = await fetch(`/api/clubs/${clubId}/tournaments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Không thể tạo giải đấu');
      
      onSuccess?.();
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên giải đấu</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày bắt đầu</FormLabel>
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
                          format(field.value, 'dd/MM/yyyy')
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
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày kết thúc</FormLabel>
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
                          format(field.value, 'dd/MM/yyyy')
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
                      disabled={(date) =>
                        date < form.getValues('start_date')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thể thức</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thể thức" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single_elimination">Loại trực tiếp</SelectItem>
                    <SelectItem value="double_elimination">Đánh đôi</SelectItem>
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
            name="match_format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thể thức trận đấu</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thể thức" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="race_to">Race to</SelectItem>
                    <SelectItem value="time_limit">Giới hạn thời gian</SelectItem>
                    <SelectItem value="points">Điểm</SelectItem>
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
                <FormLabel>Số người tham gia tối đa</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>Để trống nếu không giới hạn</FormDescription>
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
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>Đơn vị: VNĐ</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          Tạo giải đấu
        </Button>
      </form>
    </Form>
  );
};
