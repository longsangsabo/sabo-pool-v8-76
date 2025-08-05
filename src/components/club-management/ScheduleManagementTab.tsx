import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestSchedule {
  id: string;
  test_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  test_type: string;
  max_participants: number;
  current_participants: number;
  status: string;
  instructor_id: string | null;
  club_instructors: {
    full_name: string;
  } | null;
}

interface Instructor {
  id: string;
  full_name: string;
  specializations: string[];
}

const createScheduleSchema = z.object({
  test_date: z.string().min(1, 'Vui lòng chọn ngày'),
  start_time: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
  end_time: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
  test_type: z.string().min(1, 'Vui lòng chọn loại test'),
  max_participants: z.coerce.number().min(1, 'Số lượng tối đa phải >= 1'),
  instructor_id: z.string().optional(),
  rank_requirements: z.string().optional(),
  equipment_needed: z.string().optional(),
  cancellation_policy: z.string().optional(),
});

const statusColors = {
  available: 'bg-green-100 text-green-800',
  booked: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface ScheduleManagementTabProps {
  clubId: string;
}

const ScheduleManagementTab: React.FC<ScheduleManagementTabProps> = ({
  clubId,
}) => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<TestSchedule[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof createScheduleSchema>>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      test_type: 'rank_verification',
      max_participants: 1,
    },
  });

  const fetchSchedules = async () => {
    if (!clubId) return;

    try {
      const { data, error } = await supabase
        .from('test_schedules')
        .select(
          `
          *,
          club_instructors:instructor_id (
            full_name
          )
        `
        )
        .eq('club_id', clubId)
        .order('test_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch test',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    if (!clubId) return;

    try {
      const { data, error } = await supabase
        .from('club_instructors')
        .select('id, full_name, specializations')
        .eq('club_id', clubId)
        .eq('is_active', true);

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchInstructors();
  }, [clubId]);

  const handleCreateSchedule = async (
    values: z.infer<typeof createScheduleSchema>
  ) => {
    try {
      const startTime = new Date(`${values.test_date}T${values.start_time}`);
      const endTime = new Date(`${values.test_date}T${values.end_time}`);
      const durationMinutes = Math.floor(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );

      const scheduleData: any = {
        club_id: clubId,
        test_date: values.test_date,
        start_time: values.start_time,
        end_time: values.end_time,
        duration_minutes: durationMinutes,
        test_type: values.test_type,
        max_participants: values.max_participants,
        status: 'available',
      };

      if (values.instructor_id) {
        scheduleData.instructor_id = values.instructor_id;
      }

      if (values.rank_requirements) {
        scheduleData.rank_requirements = values.rank_requirements
          .split(',')
          .map(r => r.trim());
      }

      if (values.equipment_needed) {
        scheduleData.equipment_needed = values.equipment_needed
          .split(',')
          .map(e => e.trim());
      }

      if (values.cancellation_policy) {
        scheduleData.cancellation_policy = values.cancellation_policy;
      }

      const { error } = await supabase
        .from('test_schedules')
        .insert(scheduleData);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã tạo lịch test mới',
      });

      setIsCreateDialogOpen(false);
      form.reset();
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo lịch test',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateScheduleStatus = async (
    scheduleId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from('test_schedules')
        .update({ status: newStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái lịch test',
      });

      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass =
      statusColors[status as keyof typeof statusColors] ||
      'bg-gray-100 text-gray-800';
    return (
      <Badge variant='secondary' className={colorClass}>
        {status === 'available' && 'Có thể đặt'}
        {status === 'booked' && 'Đã đặt'}
        {status === 'in_progress' && 'Đang diễn ra'}
        {status === 'completed' && 'Hoàn thành'}
        {status === 'cancelled' && 'Đã hủy'}
      </Badge>
    );
  };

  const upcomingSchedules = schedules.filter(
    s => new Date(s.test_date) >= new Date() && s.status === 'available'
  );

  const stats = {
    total: schedules.length,
    available: schedules.filter(s => s.status === 'available').length,
    thisWeek: schedules.filter(s => {
      const scheduleDate = new Date(s.test_date);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    }).length,
    completed: schedules.filter(s => s.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className='pt-6'>
                <div className='animate-pulse'>
                  <div className='h-8 bg-gray-200 rounded mb-2'></div>
                  <div className='h-4 bg-gray-200 rounded'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Calendar className='w-8 h-8 mx-auto mb-2 text-blue-500' />
              <p className='text-2xl font-bold'>{stats.total}</p>
              <p className='text-sm text-muted-foreground'>Tổng lịch test</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Clock className='w-8 h-8 mx-auto mb-2 text-green-500' />
              <p className='text-2xl font-bold'>{stats.available}</p>
              <p className='text-sm text-muted-foreground'>Có thể đặt</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Users className='w-8 h-8 mx-auto mb-2 text-purple-500' />
              <p className='text-2xl font-bold'>{stats.thisWeek}</p>
              <p className='text-sm text-muted-foreground'>Tuần này</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <CheckCircle className='w-8 h-8 mx-auto mb-2 text-yellow-500' />
              <p className='text-2xl font-bold'>{stats.completed}</p>
              <p className='text-sm text-muted-foreground'>Đã hoàn thành</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Schedule */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle>Quản lý lịch test</CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className='w-4 h-4 mr-2' />
                  Tạo lịch test
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Tạo lịch test mới</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleCreateSchedule)}
                    className='space-y-4'
                  >
                    <div className='grid grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='test_date'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ngày test</FormLabel>
                            <FormControl>
                              <Input type='date' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='test_type'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loại test</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Chọn loại test' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='rank_verification'>
                                  Xác thực hạng
                                </SelectItem>
                                <SelectItem value='skill_assessment'>
                                  Đánh giá kỹ năng
                                </SelectItem>
                                <SelectItem value='instructor_test'>
                                  Test giảng viên
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-3 gap-4'>
                      <FormField
                        control={form.control}
                        name='start_time'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giờ bắt đầu</FormLabel>
                            <FormControl>
                              <Input type='time' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='end_time'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giờ kết thúc</FormLabel>
                            <FormControl>
                              <Input type='time' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='max_participants'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số lượng tối đa</FormLabel>
                            <FormControl>
                              <Input type='number' min='1' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name='instructor_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giảng viên phụ trách</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Chọn giảng viên (tùy chọn)' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {instructors.map(instructor => (
                                <SelectItem
                                  key={instructor.id}
                                  value={instructor.id}
                                >
                                  {instructor.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='rank_requirements'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Yêu cầu hạng (phân cách bằng dấu phẩy)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder='B, A, AA...' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='equipment_needed'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Thiết bị cần thiết (phân cách bằng dấu phẩy)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder='Cơ, bóng, phấn...' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='cancellation_policy'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chính sách hủy</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Quy định về việc hủy lịch test...'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='flex justify-end space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Hủy
                      </Button>
                      <Button type='submit'>Tạo lịch test</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className='text-center py-8'>
              <Calendar className='w-12 h-12 mx-auto mb-4 text-muted' />
              <p className='text-muted-foreground'>Chưa có lịch test nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày & Giờ</TableHead>
                  <TableHead>Loại test</TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {new Date(schedule.test_date).toLocaleDateString(
                            'vi-VN'
                          )}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {schedule.start_time} - {schedule.end_time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        {schedule.test_type === 'rank_verification' &&
                          'Xác thực hạng'}
                        {schedule.test_type === 'skill_assessment' &&
                          'Đánh giá kỹ năng'}
                        {schedule.test_type === 'instructor_test' &&
                          'Test giảng viên'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {schedule.club_instructors?.full_name || 'Chưa phân công'}
                    </TableCell>
                    <TableCell>
                      <span className='text-sm'>
                        {schedule.current_participants}/
                        {schedule.max_participants}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>{schedule.duration_minutes} phút</TableCell>
                    <TableCell>
                      <div className='flex space-x-1'>
                        {schedule.status === 'available' && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              handleUpdateScheduleStatus(
                                schedule.id,
                                'cancelled'
                              )
                            }
                          >
                            <XCircle className='w-4 h-4' />
                          </Button>
                        )}
                        {schedule.status === 'booked' && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              handleUpdateScheduleStatus(
                                schedule.id,
                                'completed'
                              )
                            }
                          >
                            <CheckCircle className='w-4 h-4' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleManagementTab;
