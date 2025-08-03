import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, MapPin, Trophy, Building2, Edit, Map } from 'lucide-react';
import { TournamentTierSelector } from '@/components/TournamentTierSelector';
import { RankSelector } from '@/components/tournament/RankSelector';
import { useProfileContext } from '@/contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BasicInfoSectionProps {
  form: UseFormReturn<any>;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ form }) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const selectedTierLevel = watch('tier_level');
  const { clubProfile, refreshProfiles } = useProfileContext();
  const { user } = useAuth();
  const currentVenueAddress = watch('venue_address');

  // Address edit modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newCity, setNewCity] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Auto-fill club address when clubProfile is available
  React.useEffect(() => {
    if (clubProfile && clubProfile.address && !currentVenueAddress) {
      const fullAddress = `${clubProfile.club_name}, ${clubProfile.address}`;
      setValue('venue_address', fullAddress, {
        shouldValidate: true,
        shouldDirty: true,
      });
      toast.success('Đã tự động điền địa chỉ CLB');
    }
  }, [clubProfile, setValue, currentVenueAddress]);

  // Auto-fill function for manual trigger
  const autoFillClubAddress = () => {
    if (clubProfile && clubProfile.address) {
      const fullAddress = `${clubProfile.club_name}, ${clubProfile.address}`;
      setValue('venue_address', fullAddress, {
        shouldValidate: true,
        shouldDirty: true,
      });
      toast.success('Đã điền địa chỉ CLB');
    } else {
      toast.error('CLB chưa có địa chỉ. Vui lòng cập nhật hồ sơ CLB');
      setShowAddressModal(true);
    }
  };

  // Update club address function
  const updateClubAddress = async () => {
    if (!user || !newAddress.trim() || !newDistrict || !newCity) {
      toast.error('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('club_profiles')
        .update({
          address: newAddress.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Đã cập nhật địa chỉ CLB');
      setShowAddressModal(false);

      // Refresh club profile data
      await refreshProfiles();

      // Auto-fill tournament location with new address
      setTimeout(() => {
        autoFillClubAddress();
      }, 500);
    } catch (error) {
      console.error('Error updating club address:', error);
      toast.error('Lỗi khi cập nhật địa chỉ');
    } finally {
      setIsUpdating(false);
    }
  };

  // Open address modal with current data
  const openAddressEditModal = () => {
    if (clubProfile?.address) {
      setNewAddress(clubProfile.address);
    }
    setShowAddressModal(true);
  };

  // Vietnamese cities list
  const cities = [
    'Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'An Giang',
    'Bà Rịa - Vũng Tàu',
    'Bắc Giang',
    'Bắc Kạn',
    'Bạc Liêu',
    'Bắc Ninh',
    'Bến Tre',
    'Bình Định',
    'Bình Dương',
    'Bình Phước',
    'Bình Thuận',
    'Cà Mau',
    'Cao Bằng',
    'Đắk Lắk',
    'Đắk Nông',
    'Điện Biên',
    'Đồng Nai',
    'Đồng Tháp',
    'Gia Lai',
    'Hà Giang',
    'Hà Nam',
    'Hà Tĩnh',
    'Hải Dương',
    'Hậu Giang',
    'Hòa Bình',
    'Hưng Yên',
    'Khánh Hòa',
    'Kiên Giang',
    'Kon Tum',
    'Lai Châu',
    'Lâm Đồng',
    'Lạng Sơn',
    'Lào Cai',
    'Long An',
    'Nam Định',
    'Nghệ An',
    'Ninh Bình',
    'Ninh Thuận',
    'Phú Thọ',
    'Phú Yên',
    'Quảng Bình',
    'Quảng Nam',
    'Quảng Ngãi',
    'Quảng Ninh',
    'Quảng Trị',
    'Sóc Trăng',
    'Sơn La',
    'Tây Ninh',
    'Thái Bình',
    'Thái Nguyên',
    'Thanh Hóa',
    'Thừa Thiên Huế',
    'Tiền Giang',
    'Trà Vinh',
    'Tuyên Quang',
    'Vĩnh Long',
    'Vĩnh Phúc',
    'Yên Bái',
  ];

  // HCMC districts
  const hcmDistricts = [
    'Quận 1',
    'Quận 2',
    'Quận 3',
    'Quận 4',
    'Quận 5',
    'Quận 6',
    'Quận 7',
    'Quận 8',
    'Quận 9',
    'Quận 10',
    'Quận 11',
    'Quận 12',
    'Quận Bình Tân',
    'Quận Bình Thạnh',
    'Quận Gò Vấp',
    'Quận Phú Nhuận',
    'Quận Tân Bình',
    'Quận Tân Phú',
    'Quận Thủ Đức',
    'Huyện Bình Chánh',
    'Huyện Cần Giờ',
    'Huyện Củ Chi',
    'Huyện Hóc Môn',
    'Huyện Nhà Bè',
  ];

  return (
    <div className='space-y-3'>
      {/* Compact Basic Information */}
      <div className='space-y-3'>
        <h4 className='text-sm font-medium flex items-center gap-2 text-primary'>
          <Trophy className='h-4 w-4' />
          Thông tin cơ bản
        </h4>

        <div className='space-y-3'>
          {/* Tournament Name */}
          <div className='space-y-1'>
            <Label
              htmlFor='name'
              className='text-xs font-medium flex items-center gap-1'
            >
              <span className='w-1 h-1 bg-destructive rounded-full'></span>
              Tên giải đấu
            </Label>
            <Input
              id='name'
              placeholder='VD: Giải Bida Mở Rộng 2024'
              {...register('name')}
              className={`h-8 text-sm ${errors.name ? 'border-destructive' : ''}`}
            />
            {errors.name && (
              <p className='text-xs text-destructive'>
                {String(errors.name.message)}
              </p>
            )}
          </div>

          {/* Date & Time Grid */}
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <Label
                htmlFor='tournament_start'
                className='text-xs font-medium flex items-center gap-1'
              >
                <Calendar className='h-3 w-3 text-blue-600' />
                <span className='w-1 h-1 bg-destructive rounded-full'></span>
                Bắt đầu
              </Label>
              <Input
                id='tournament_start'
                type='datetime-local'
                {...register('tournament_start')}
                className={`h-8 text-xs ${errors.tournament_start ? 'border-destructive' : ''}`}
              />
              {errors.tournament_start && (
                <p className='text-xs text-destructive'>
                  {String(errors.tournament_start.message)}
                </p>
              )}
            </div>

            <div className='space-y-1'>
              <Label
                htmlFor='tournament_end'
                className='text-xs font-medium flex items-center gap-1'
              >
                <Calendar className='h-3 w-3 text-blue-600' />
                <span className='w-1 h-1 bg-destructive rounded-full'></span>
                Kết thúc
              </Label>
              <Input
                id='tournament_end'
                type='datetime-local'
                {...register('tournament_end')}
                className={`h-8 text-xs ${errors.tournament_end ? 'border-destructive' : ''}`}
              />
              {errors.tournament_end && (
                <p className='text-xs text-destructive'>
                  {String(errors.tournament_end.message)}
                </p>
              )}
            </div>
          </div>

          {/* Smart Location Field */}
          <div className='space-y-1'>
            <Label
              htmlFor='venue_address'
              className='text-xs font-medium flex items-center gap-1'
            >
              <MapPin className='h-3 w-3 text-green-600' />
              <span className='w-1 h-1 bg-destructive rounded-full'></span>
              Địa điểm
            </Label>

            {/* Input field */}
            <Input
              id='venue_address'
              placeholder='Nhập địa chỉ hoặc dùng địa chỉ CLB'
              {...register('venue_address')}
              className={`h-8 text-sm ${errors.venue_address ? 'border-destructive' : ''}`}
            />

            {/* Location actions */}
            <div className='flex gap-1 mt-1'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={autoFillClubAddress}
                      className='h-7 px-2 text-xs flex items-center gap-1'
                    >
                      <Building2 className='h-3 w-3' />
                      CLB
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dùng địa chỉ CLB</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={openAddressEditModal}
                      className='h-7 px-2 text-xs flex items-center gap-1'
                    >
                      <Edit className='h-3 w-3' />
                      Sửa
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sửa địa chỉ CLB</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Quick edit prompt for no address */}
            {!clubProfile?.address && (
              <div className='text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded border'>
                CLB chưa có địa chỉ.{' '}
                <button
                  type='button'
                  onClick={openAddressEditModal}
                  className='text-primary hover:underline font-medium'
                >
                  Cập nhật địa chỉ CLB
                </button>
              </div>
            )}

            {errors.venue_address && (
              <p className='text-xs text-destructive'>
                {String(errors.venue_address.message)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Compact Tournament Tier */}
      <div className='space-y-2'>
        <h4 className='text-sm font-medium text-primary'>Hạng thi đấu</h4>
        <TournamentTierSelector
          value={selectedTierLevel}
          onValueChange={tierLevel => setValue('tier_level', tierLevel)}
          showSPAPreview={true}
        />
        {errors.tier_level && (
          <p className='text-xs text-destructive'>
            {String(errors.tier_level.message)}
          </p>
        )}
        <RankSelector form={form} />
      </div>

      {/* Compact Description */}
      <div className='space-y-1'>
        <Label htmlFor='description' className='text-xs font-medium'>
          Mô tả <span className='text-muted-foreground'>(Tùy chọn)</span>
        </Label>
        <Textarea
          id='description'
          placeholder='Mô tả chi tiết về giải đấu...'
          rows={2}
          {...register('description')}
          className='resize-none text-sm'
        />
      </div>

      {/* Address Edit Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <MapPin className='h-5 w-5 text-green-600' />
              Cập nhật địa chỉ CLB
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='address'>Địa chỉ chi tiết</Label>
              <Input
                id='address'
                placeholder='Số nhà, tên đường...'
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                className='w-full'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='district'>Quận/Huyện</Label>
              <Select value={newDistrict} onValueChange={setNewDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn quận/huyện' />
                </SelectTrigger>
                <SelectContent>
                  {hcmDistricts.map(district => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='city'>Tỉnh/Thành phố</Label>
              <Select value={newCity} onValueChange={setNewCity}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn tỉnh/thành phố' />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex gap-2 pt-4'>
            <Button
              onClick={updateClubAddress}
              disabled={
                isUpdating || !newAddress.trim() || !newDistrict || !newCity
              }
              className='flex-1'
            >
              {isUpdating ? 'Đang lưu...' : '💾 Lưu địa chỉ'}
            </Button>
            <Button
              variant='outline'
              onClick={() => setShowAddressModal(false)}
              disabled={isUpdating}
            >
              ❌ Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
