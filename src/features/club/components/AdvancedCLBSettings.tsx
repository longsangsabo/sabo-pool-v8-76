import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Settings,
  Save,
  Bell,
  DollarSign,
  Clock,
  Users,
  Shield,
  Trophy,
  Palette,
  Globe,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Camera,
  Upload,
  Download,
  RefreshCw,
  Target,
  Award,
} from 'lucide-react';

interface CLBSettings {
  general: {
    club_name: string;
    description: string;
    location: string;
    contact_phone: string;
    contact_email: string;
    operating_hours: {
      open: string;
      close: string;
      days: string[];
    };
  };
  pricing: {
    vip_table_rate: number;
    standard_table_rate: number;
    tournament_entry_fee_min: number;
    tournament_entry_fee_max: number;
    challenge_prize_min: number;
    challenge_prize_max: number;
  };
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    booking_reminders: boolean;
    tournament_updates: boolean;
    challenge_notifications: boolean;
  };
  verification: {
    auto_approve_beginners: boolean;
    require_video_evidence: boolean;
    expert_review_required: boolean;
    min_elo_for_challenges: number;
  };
  tournaments: {
    max_participants: number;
    default_format: string;
    auto_bracket_generation: boolean;
    prize_distribution: {
      first_place: number;
      second_place: number;
      third_place: number;
    };
  };
}

export const AdvancedCLBSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock current settings
  const [settings, setSettings] = useState<CLBSettings>({
    general: {
      club_name: 'Sabo Pool Club',
      description:
        'CLB Billiards chuyên nghiệp với đội ngũ huấn luyện viên giàu kinh nghiệm',
      location: 'Hà Nội, Việt Nam',
      contact_phone: '024-1234-5678',
      contact_email: 'info@sabopoolclub.vn',
      operating_hours: {
        open: '08:00',
        close: '23:00',
        days: [
          'Thứ 2',
          'Thứ 3',
          'Thứ 4',
          'Thứ 5',
          'Thứ 6',
          'Thứ 7',
          'Chủ nhật',
        ],
      },
    },
    pricing: {
      vip_table_rate: 150000,
      standard_table_rate: 100000,
      tournament_entry_fee_min: 50000,
      tournament_entry_fee_max: 500000,
      challenge_prize_min: 20000,
      challenge_prize_max: 1000000,
    },
    notifications: {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      booking_reminders: true,
      tournament_updates: true,
      challenge_notifications: true,
    },
    verification: {
      auto_approve_beginners: true,
      require_video_evidence: true,
      expert_review_required: true,
      min_elo_for_challenges: 1200,
    },
    tournaments: {
      max_participants: 64,
      default_format: 'single_elimination',
      auto_bracket_generation: true,
      prize_distribution: {
        first_place: 50,
        second_place: 30,
        third_place: 20,
      },
    },
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
    setHasChanges(false);
  };

  const updateSetting = (
    section: keyof CLBSettings,
    key: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold'>Cài đặt CLB nâng cao</h2>
          <p className='text-muted-foreground'>
            Quản lý và tùy chỉnh các thiết lập cho CLB của bạn
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' disabled={!hasChanges}>
            <RefreshCw className='h-4 w-4 mr-2' />
            Khôi phục
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <Save className='h-4 w-4 mr-2' />
            )}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* Save Status */}
      {hasChanges && (
        <Card className='border-orange-200 bg-orange-50'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-4 w-4 text-orange-600' />
              <span className='text-sm text-orange-800'>
                Bạn có thay đổi chưa được lưu
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='general'>
            <Settings className='h-4 w-4 mr-2' />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value='pricing'>
            <DollarSign className='h-4 w-4 mr-2' />
            Giá cả
          </TabsTrigger>
          <TabsTrigger value='notifications'>
            <Bell className='h-4 w-4 mr-2' />
            Thông báo
          </TabsTrigger>
          <TabsTrigger value='verification'>
            <Shield className='h-4 w-4 mr-2' />
            Xác minh
          </TabsTrigger>
          <TabsTrigger value='tournaments'>
            <Trophy className='h-4 w-4 mr-2' />
            Giải đấu
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value='general' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Globe className='h-5 w-5' />
                Thông tin CLB
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='club_name'>Tên CLB</Label>
                  <Input
                    id='club_name'
                    value={settings.general.club_name}
                    onChange={e =>
                      updateSetting('general', 'club_name', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='location'>Địa điểm</Label>
                  <Input
                    id='location'
                    value={settings.general.location}
                    onChange={e =>
                      updateSetting('general', 'location', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>Mô tả CLB</Label>
                <Textarea
                  id='description'
                  value={settings.general.description}
                  onChange={e =>
                    updateSetting('general', 'description', e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='contact_phone'>Số điện thoại</Label>
                  <Input
                    id='contact_phone'
                    value={settings.general.contact_phone}
                    onChange={e =>
                      updateSetting('general', 'contact_phone', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contact_email'>Email liên hệ</Label>
                  <Input
                    id='contact_email'
                    type='email'
                    value={settings.general.contact_email}
                    onChange={e =>
                      updateSetting('general', 'contact_email', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='open_time'>Giờ mở cửa</Label>
                  <Input
                    id='open_time'
                    type='time'
                    value={settings.general.operating_hours.open}
                    onChange={e =>
                      updateSetting('general', 'operating_hours', {
                        ...settings.general.operating_hours,
                        open: e.target.value,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='close_time'>Giờ đóng cửa</Label>
                  <Input
                    id='close_time'
                    type='time'
                    value={settings.general.operating_hours.close}
                    onChange={e =>
                      updateSetting('general', 'operating_hours', {
                        ...settings.general.operating_hours,
                        close: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value='pricing' className='space-y-6'>
          <div className='grid md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='h-5 w-5' />
                  Giá bàn chơi
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='vip_rate'>Bàn VIP (VNĐ/giờ)</Label>
                  <Input
                    id='vip_rate'
                    type='number'
                    value={settings.pricing.vip_table_rate}
                    onChange={e =>
                      updateSetting(
                        'pricing',
                        'vip_table_rate',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='standard_rate'>Bàn thường (VNĐ/giờ)</Label>
                  <Input
                    id='standard_rate'
                    type='number'
                    value={settings.pricing.standard_table_rate}
                    onChange={e =>
                      updateSetting(
                        'pricing',
                        'standard_table_rate',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trophy className='h-5 w-5' />
                  Phí giải đấu & thử thách
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='tournament_min'>Phí tối thiểu</Label>
                    <Input
                      id='tournament_min'
                      type='number'
                      value={settings.pricing.tournament_entry_fee_min}
                      onChange={e =>
                        updateSetting(
                          'pricing',
                          'tournament_entry_fee_min',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='tournament_max'>Phí tối đa</Label>
                    <Input
                      id='tournament_max'
                      type='number'
                      value={settings.pricing.tournament_entry_fee_max}
                      onChange={e =>
                        updateSetting(
                          'pricing',
                          'tournament_entry_fee_max',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='challenge_min'>Thưởng tối thiểu</Label>
                    <Input
                      id='challenge_min'
                      type='number'
                      value={settings.pricing.challenge_prize_min}
                      onChange={e =>
                        updateSetting(
                          'pricing',
                          'challenge_prize_min',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='challenge_max'>Thưởng tối đa</Label>
                    <Input
                      id='challenge_max'
                      type='number'
                      value={settings.pricing.challenge_prize_max}
                      onChange={e =>
                        updateSetting(
                          'pricing',
                          'challenge_prize_max',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value='notifications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Bell className='h-5 w-5' />
                Cài đặt thông báo
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Email thông báo</h4>
                    <p className='text-sm text-muted-foreground'>
                      Gửi thông báo qua email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.email_enabled}
                    onCheckedChange={checked =>
                      updateSetting('notifications', 'email_enabled', checked)
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>SMS thông báo</h4>
                    <p className='text-sm text-muted-foreground'>
                      Gửi tin nhắn SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms_enabled}
                    onCheckedChange={checked =>
                      updateSetting('notifications', 'sms_enabled', checked)
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Push notification</h4>
                    <p className='text-sm text-muted-foreground'>
                      Thông báo đẩy trên ứng dụng
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.push_enabled}
                    onCheckedChange={checked =>
                      updateSetting('notifications', 'push_enabled', checked)
                    }
                  />
                </div>

                <hr />

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Nhắc nhở đặt bàn</h4>
                    <p className='text-sm text-muted-foreground'>
                      Thông báo trước 30 phút
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.booking_reminders}
                    onCheckedChange={checked =>
                      updateSetting(
                        'notifications',
                        'booking_reminders',
                        checked
                      )
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Cập nhật giải đấu</h4>
                    <p className='text-sm text-muted-foreground'>
                      Thông báo kết quả và lịch đấu
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.tournament_updates}
                    onCheckedChange={checked =>
                      updateSetting(
                        'notifications',
                        'tournament_updates',
                        checked
                      )
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Thông báo thử thách</h4>
                    <p className='text-sm text-muted-foreground'>
                      Nhận/gửi lời thách đấu
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.challenge_notifications}
                    onCheckedChange={checked =>
                      updateSetting(
                        'notifications',
                        'challenge_notifications',
                        checked
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Settings */}
        <TabsContent value='verification' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Cài đặt xác minh
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Tự động duyệt người mới</h4>
                    <p className='text-sm text-muted-foreground'>
                      Duyệt tự động rank "Mới bắt đầu"
                    </p>
                  </div>
                  <Switch
                    checked={settings.verification.auto_approve_beginners}
                    onCheckedChange={checked =>
                      updateSetting(
                        'verification',
                        'auto_approve_beginners',
                        checked
                      )
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Yêu cầu video minh chứng</h4>
                    <p className='text-sm text-muted-foreground'>
                      Bắt buộc video cho rank cao
                    </p>
                  </div>
                  <Switch
                    checked={settings.verification.require_video_evidence}
                    onCheckedChange={checked =>
                      updateSetting(
                        'verification',
                        'require_video_evidence',
                        checked
                      )
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Xem xét từ chuyên gia</h4>
                    <p className='text-sm text-muted-foreground'>
                      Cần expert review cho rank Master
                    </p>
                  </div>
                  <Switch
                    checked={settings.verification.expert_review_required}
                    onCheckedChange={checked =>
                      updateSetting(
                        'verification',
                        'expert_review_required',
                        checked
                      )
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='min_elo'>Elo tối thiểu để thách đấu</Label>
                  <Input
                    id='min_elo'
                    type='number'
                    value={settings.verification.min_elo_for_challenges}
                    onChange={e =>
                      updateSetting(
                        'verification',
                        'min_elo_for_challenges',
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className='text-xs text-muted-foreground'>
                    Người chơi cần đạt tối thiểu{' '}
                    {settings.verification.min_elo_for_challenges} Elo để tham
                    gia thách đấu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tournament Settings */}
        <TabsContent value='tournaments' className='space-y-6'>
          <div className='grid md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trophy className='h-5 w-5' />
                  Cài đặt giải đấu
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='max_participants'>Số người tối đa</Label>
                  <Select
                    value={settings.tournaments.max_participants.toString()}
                    onValueChange={value =>
                      updateSetting(
                        'tournaments',
                        'max_participants',
                        parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='8'>8 người</SelectItem>
                      <SelectItem value='16'>16 người</SelectItem>
                      <SelectItem value='32'>32 người</SelectItem>
                      <SelectItem value='64'>64 người</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='default_format'>Thể thức mặc định</Label>
                  <Select
                    value={settings.tournaments.default_format}
                    onValueChange={value =>
                      updateSetting('tournaments', 'default_format', value)
                    }
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
                      <SelectItem value='round_robin'>Vòng tròn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Tự động tạo bracket</h4>
                    <p className='text-sm text-muted-foreground'>
                      Tạo bracket khi đủ người
                    </p>
                  </div>
                  <Switch
                    checked={settings.tournaments.auto_bracket_generation}
                    onCheckedChange={checked =>
                      updateSetting(
                        'tournaments',
                        'auto_bracket_generation',
                        checked
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Award className='h-5 w-5' />
                  Phân chia giải thưởng (%)
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='first_place'>Giải nhất</Label>
                  <Input
                    id='first_place'
                    type='number'
                    value={settings.tournaments.prize_distribution.first_place}
                    onChange={e =>
                      updateSetting('tournaments', 'prize_distribution', {
                        ...settings.tournaments.prize_distribution,
                        first_place: parseInt(e.target.value),
                      })
                    }
                    min='0'
                    max='100'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='second_place'>Giải nhì</Label>
                  <Input
                    id='second_place'
                    type='number'
                    value={settings.tournaments.prize_distribution.second_place}
                    onChange={e =>
                      updateSetting('tournaments', 'prize_distribution', {
                        ...settings.tournaments.prize_distribution,
                        second_place: parseInt(e.target.value),
                      })
                    }
                    min='0'
                    max='100'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='third_place'>Giải ba</Label>
                  <Input
                    id='third_place'
                    type='number'
                    value={settings.tournaments.prize_distribution.third_place}
                    onChange={e =>
                      updateSetting('tournaments', 'prize_distribution', {
                        ...settings.tournaments.prize_distribution,
                        third_place: parseInt(e.target.value),
                      })
                    }
                    min='0'
                    max='100'
                  />
                </div>

                <div className='p-3 bg-gray-50 rounded-lg'>
                  <p className='text-sm'>
                    Tổng:{' '}
                    {settings.tournaments.prize_distribution.first_place +
                      settings.tournaments.prize_distribution.second_place +
                      settings.tournaments.prize_distribution.third_place}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedCLBSettings;
