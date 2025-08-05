import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Building, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import GoogleMapsPlacesAutocomplete from './GoogleMapsPlacesAutocomplete';

interface ClubProfileTabProps {
  user: any;
  profile: any;
  onUpdate: () => void;
}

interface Province {
  id: string;
  name: string;
  code: string;
}

interface District {
  id: string;
  name: string;
  province_id: string;
}

interface Ward {
  id: string;
  name: string;
  district_id: string;
}

interface Club {
  id: string;
  name: string;
  address: string;
  provinces?: { name: string };
}

interface ClubRegistration {
  id: string;
  club_name: string;
  club_type: string;
  province_id: string;
  district_id: string;
  ward_id: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  table_count: number;
  hourly_rate: number;
  status: string;
  rejection_reason?: string;
  provinces?: { name: string };
  districts?: { name: string };
  wards?: { name: string };
}

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

const ClubProfileTab = ({ user, profile, onUpdate }: ClubProfileTabProps) => {
  const [clubData, setClubData] = useState<ClubRegistration | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] =
    useState<GooglePlace | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const selectedProvince = watch('province_id');
  const selectedDistrict = watch('district_id');
  const clubType = watch('club_type');

  // Kiểm tra điều kiện hiển thị dropdown địa chỉ
  const canSelectLocation = user?.email_confirmed_at && profile?.clbVerified;

  useEffect(() => {
    fetchVietnamAdministrative();
    fetchExistingClubs();
    checkClubRegistration();
  }, []);

  useEffect(() => {
    if (selectedProvince && canSelectLocation) {
      fetchDistricts(selectedProvince);
      setValue('district_id', '');
      setValue('ward_id', '');
    }
  }, [selectedProvince, canSelectLocation]);

  useEffect(() => {
    if (selectedDistrict && canSelectLocation) {
      fetchWards(selectedDistrict);
      setValue('ward_id', '');
    }
  }, [selectedDistrict, canSelectLocation]);

  const fetchVietnamAdministrative = async () => {
    try {
      // Since we don't have provinces table in the current schema,
      // I'll create some mock data for Vietnamese provinces
      const mockProvinces = [
        { id: '1', name: 'Hà Nội', code: 'HN' },
        { id: '2', name: 'TP. Hồ Chí Minh', code: 'HCM' },
        { id: '3', name: 'Đà Nẵng', code: 'DN' },
        { id: '4', name: 'Hải Phòng', code: 'HP' },
        { id: '5', name: 'Cần Thơ', code: 'CT' },
        { id: '6', name: 'Bà Rịa - Vũng Tàu', code: 'BRVT' },
      ];
      setProvinces(mockProvinces);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const fetchDistricts = async (provinceId: string) => {
    try {
      // Mock districts data
      const mockDistricts = [
        { id: '1', name: 'Quận 1', province_id: provinceId },
        { id: '2', name: 'Quận 2', province_id: provinceId },
        { id: '3', name: 'Quận 3', province_id: provinceId },
        { id: '4', name: 'Quận Bình Thạnh', province_id: provinceId },
        { id: '5', name: 'Quận Tân Bình', province_id: provinceId },
      ];
      setDistricts(mockDistricts);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchWards = async (districtId: string) => {
    try {
      // Mock wards data
      const mockWards = [
        { id: '1', name: 'Phường 1', district_id: districtId },
        { id: '2', name: 'Phường 2', district_id: districtId },
        { id: '3', name: 'Phường 3', district_id: districtId },
        { id: '4', name: 'Phường 4', district_id: districtId },
        { id: '5', name: 'Phường 5', district_id: districtId },
      ];
      setWards(mockWards);
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  const fetchExistingClubs = async () => {
    try {
      const { data } = await supabase
        .from('clubs')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name');
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const checkClubRegistration = async () => {
    if (!user?.id) return;

    try {
      // Since club_registrations table doesn't exist, skip this for now
      const data = null;
      const error = null;

      if (error) {
        console.error('Error checking club registration:', error);
        return;
      }

      // No existing registration data for now
      setClubData(null);
    } catch (error) {
      console.error('Error checking club registration:', error);
    }
  };

  const handleGooglePlaceSelect = (place: GooglePlace) => {
    setSelectedGooglePlace(place);

    // Tự động điền thông tin từ Google Maps
    setValue('club_name', place.name);
    setValue('address', place.formatted_address);

    // Có thể thêm logic để map địa chỉ với province/district/ward
    // Dựa trên formatted_address từ Google Maps
    toast.success('Đã tự động điền thông tin từ Google Maps');
  };

  const handleClubRegistration = async (formData: any) => {
    setRegistering(true);
    try {
      // Insert club registration into database
      const registrationData = {
        user_id: user.id,
        club_name: formData.club_name,
        address: formData.address,
        district: formData.district || 'Chưa chọn',
        city: formData.city || 'Chưa chọn',
        phone: formData.phone,
        email: formData.email,
        opening_time: formData.opening_time || '08:00',
        closing_time: formData.closing_time || '22:00',
        table_count: parseInt(formData.table_count) || 1,
        table_types: formData.table_types || ['Pool 8'],
        basic_price:
          parseInt(formData.basic_price) ||
          parseInt(formData.hourly_rate) ||
          50000,
        normal_hour_price: parseInt(formData.normal_hour_price) || null,
        peak_hour_price: parseInt(formData.peak_hour_price) || null,
        weekend_price: parseInt(formData.weekend_price) || null,
        vip_table_price: parseInt(formData.vip_table_price) || null,
        amenities: formData.amenities || {},
        photos: formData.photos || [],
        facebook_url: formData.facebook_url || null,
        google_maps_url: formData.google_maps_url || null,
        business_license_url: formData.business_license_url || null,
        manager_name: formData.manager_name || null,
        manager_phone: formData.manager_phone || null,
        status: 'pending',
      };

      // Create a club entry instead
      const { data, error } = await supabase
        .from('clubs')
        .insert([
          {
            name: registrationData.club_name,
            address: registrationData.address,
            contact_info: registrationData.phone,
            owner_id: user.id,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Create success notification for user
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'club_registration_submitted',
        title: 'Đăng ký CLB thành công! 🏢',
        message: `Bạn đã gửi đăng ký câu lạc bộ "${registrationData.club_name}" thành công. Chúng tôi sẽ xem xét và thông báo kết quả trong thời gian sớm nhất.`,
        action_url: '/profile?tab=club',
      });

      toast.success('Đăng ký CLB thành công! Vui lòng chờ admin xét duyệt.');
      await checkClubRegistration();
      onUpdate();
    } catch (error: any) {
      console.error('Error registering club:', error);
      toast.error(
        'Có lỗi xảy ra khi đăng ký CLB: ' + (error.message || 'Unknown error')
      );
    } finally {
      setRegistering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Đã xác minh';
      case 'pending':
        return 'Chờ xác minh';
      case 'rejected':
        return 'Bị từ chối';
      default:
        return 'Chưa đăng ký';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hồ sơ Câu lạc bộ</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Club Registration Status */}
        {clubData && (
          <div className='mb-6 p-4 border rounded-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-medium text-gray-900'>
                  {clubData.club_name}
                </h3>
                <p className='text-sm text-gray-600'>{clubData.address}</p>
              </div>
              <Badge className={getStatusColor(clubData.status)}>
                {getStatusText(clubData.status)}
              </Badge>
            </div>

            {clubData.status === 'rejected' && clubData.rejection_reason && (
              <div className='mt-3 p-3 bg-red-50 rounded-md'>
                <p className='text-sm text-red-800'>
                  <strong>Lý do từ chối:</strong> {clubData.rejection_reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Club Registration Form */}
        <form
          onSubmit={handleSubmit(handleClubRegistration)}
          className='space-y-6'
        >
          {/* Basic Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label htmlFor='club_name'>Tên câu lạc bộ *</Label>
              <Input
                id='club_name'
                {...register('club_name', {
                  required: 'Vui lòng nhập tên CLB',
                })}
                placeholder='Ví dụ: SABO Billiards'
              />
              {errors.club_name && (
                <p className='mt-1 text-sm text-red-600'>
                  {String(errors.club_name.message)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='club_type'>Loại hình CLB *</Label>
              <Select onValueChange={value => setValue('club_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn loại hình' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='new'>Đăng ký CLB mới</SelectItem>
                  <SelectItem value='existing'>
                    CLB đã có trên Google Maps
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.club_type && (
                <p className='mt-1 text-sm text-red-600'>
                  {String(errors.club_type.message)}
                </p>
              )}
            </div>
          </div>

          {/* Google Maps Places Autocomplete */}
          {clubType === 'existing' && (
            <div>
              <GoogleMapsPlacesAutocomplete
                onPlaceSelect={handleGooglePlaceSelect}
                disabled={registering}
              />
            </div>
          )}

          {/* Existing Club Selection */}
          {clubType === 'existing' && (
            <div>
              <Label htmlFor='existing_club_id'>Chọn CLB từ danh sách</Label>
              <Select
                onValueChange={value => setValue('existing_club_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn CLB' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='sabo-vungtau'>
                    SABO Billiards - TP Vũng Tàu
                  </SelectItem>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <Label htmlFor='province_id'>Tỉnh/Thành phố *</Label>
              <Select onValueChange={value => setValue('province_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn tỉnh/thành' />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map(province => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province_id && (
                <p className='mt-1 text-sm text-red-600'>
                  {String(errors.province_id.message)}
                </p>
              )}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <div className='flex items-center space-x-2'>
                      <Label htmlFor='district_id'>Quận/Huyện *</Label>
                      {!canSelectLocation && (
                        <Info className='w-4 h-4 text-gray-400' />
                      )}
                    </div>
                    <Select
                      onValueChange={value => setValue('district_id', value)}
                      disabled={!selectedProvince || !canSelectLocation}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            canSelectLocation
                              ? 'Chọn quận/huyện'
                              : 'Cần xác minh CLB'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map(district => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.district_id && (
                      <p className='mt-1 text-sm text-red-600'>
                        {String(errors.district_id.message)}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                {!canSelectLocation && (
                  <TooltipContent>
                    <p>Bạn cần xác minh CLB để chọn khu vực</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <div className='flex items-center space-x-2'>
                      <Label htmlFor='ward_id'>Phường/Xã *</Label>
                      {!canSelectLocation && (
                        <Info className='w-4 h-4 text-gray-400' />
                      )}
                    </div>
                    <Select
                      onValueChange={value => setValue('ward_id', value)}
                      disabled={!selectedDistrict || !canSelectLocation}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            canSelectLocation
                              ? 'Chọn phường/xã'
                              : 'Cần xác minh CLB'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map(ward => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ward_id && (
                      <p className='mt-1 text-sm text-red-600'>
                        {String(errors.ward_id.message)}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                {!canSelectLocation && (
                  <TooltipContent>
                    <p>Bạn cần xác minh CLB để chọn khu vực</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor='address'>Địa chỉ chi tiết *</Label>
            <Input
              id='address'
              {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
              placeholder='Số nhà, tên đường...'
            />
            {errors.address && (
              <p className='mt-1 text-sm text-red-600'>
                {String(errors.address.message)}
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label htmlFor='phone'>Số điện thoại *</Label>
              <Input
                id='phone'
                type='tel'
                {...register('phone', {
                  required: 'Vui lòng nhập số điện thoại',
                  pattern: {
                    value: /^0\d{9}$/,
                    message: 'Số điện thoại không đúng định dạng',
                  },
                })}
                placeholder='0xxx xxx xxx'
              />
              {errors.phone && (
                <p className='mt-1 text-sm text-red-600'>
                  {String(errors.phone.message)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                {...register('email')}
                placeholder='contact@club.com'
              />
            </div>
          </div>

          {/* Club Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label htmlFor='table_count'>Số bàn bida</Label>
              <Input
                id='table_count'
                type='number'
                {...register('table_count')}
                placeholder='0'
                min='0'
              />
            </div>

            <div>
              <Label htmlFor='hourly_rate'>Giá giờ chơi (VNĐ)</Label>
              <Input
                id='hourly_rate'
                type='number'
                {...register('hourly_rate')}
                placeholder='0'
                min='0'
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor='description'>Mô tả CLB</Label>
            <Textarea
              id='description'
              {...register('description')}
              placeholder='Giới thiệu về câu lạc bộ, tiện ích, đặc điểm...'
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={registering}
              className='flex items-center'
            >
              {registering ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Building className='w-4 h-4 mr-2' />
                  {clubData ? 'Cập nhật thông tin CLB' : 'Đăng ký CLB'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClubProfileTab;
