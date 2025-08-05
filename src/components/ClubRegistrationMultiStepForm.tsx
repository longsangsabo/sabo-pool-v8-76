import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building,
  MapPin,
  Phone,
  Clock,
  Users,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Save,
} from 'lucide-react';

interface ClubRegistrationData {
  // Step 1
  club_name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  table_count: number;
  table_types: string[];
  basic_price: number;

  // Step 2
  normal_hour_price?: number;
  peak_hour_price?: number;
  weekend_price?: number;
  vip_table_price?: number;
  amenities: Record<string, boolean>;
  photos: string[];

  // Step 3
  facebook_url?: string;
  google_maps_url?: string;
  business_license_url?: string;
  manager_name?: string;
  manager_phone?: string;
  email?: string;

  status: 'draft' | 'pending' | 'approved' | 'rejected';
}

const ClubRegistrationMultiStepForm = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);

  const [formData, setFormData] = useState<ClubRegistrationData>({
    club_name: '',
    address: '',
    district: '',
    city: '',
    phone: '',
    opening_time: '08:00',
    closing_time: '23:00',
    table_count: 1,
    table_types: [],
    basic_price: 0,
    normal_hour_price: 0,
    peak_hour_price: 0,
    weekend_price: 0,
    vip_table_price: 0,
    amenities: {
      wifi: false,
      car_parking: false,
      bike_parking: false,
      canteen: false,
      air_conditioning: false,
      vip_room: false,
      equipment_rental: false,
      coach: false,
    },
    photos: [],
    facebook_url: '',
    google_maps_url: '',
    business_license_url: '',
    manager_name: '',
    manager_phone: '',
    email: '',
    status: 'draft',
  });

  const tableTypeOptions = [
    { value: 'pool', label: 'Pool' },
    { value: 'carom', label: 'Carom' },
    { value: 'snooker', label: 'Snooker' },
    { value: 'mixed', label: 'Tổng hợp' },
  ];

  const amenityOptions = [
    { key: 'wifi', label: 'WiFi miễn phí' },
    { key: 'car_parking', label: 'Chỗ đậu xe ô tô' },
    { key: 'bike_parking', label: 'Chỗ đậu xe máy' },
    { key: 'canteen', label: 'Căn tin/Đồ ăn' },
    { key: 'air_conditioning', label: 'Máy lạnh' },
    { key: 'vip_room', label: 'Phòng VIP riêng' },
    { key: 'equipment_rental', label: 'Cho thuê dụng cụ' },
    { key: 'coach', label: 'Có HLV/Coach' },
  ];

  useEffect(() => {
    fetchExistingRegistration();
  }, [user]);

  const fetchExistingRegistration = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching registration:', error);
        return;
      }

      if (data) {
        setExistingRegistration(data);
        setFormData({
          club_name: data.name || '',
          address: data.address || '',
          district: '',
          city: '',
          phone: data.contact_info || '',
          opening_time: '08:00',
          closing_time: '23:00',
          table_count: 1,
          table_types: [],
          basic_price: 0,
          normal_hour_price: 0,
          peak_hour_price: 0,
          weekend_price: 0,
          vip_table_price: 0,
          amenities: {},
          photos: [],
          facebook_url: '',
          google_maps_url: '',
          business_license_url: '',
          manager_name: '',
          manager_phone: '',
          email: '',
          status:
            (data.status as 'draft' | 'pending' | 'approved' | 'rejected') ||
            'draft',
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('clubs').upsert({
        owner_id: user.id,
        name: formData.club_name,
        address: formData.address,
        contact_info: formData.phone,
        description: '',
        status: 'active',
      });

      if (error) throw error;

      toast.success('Đã lưu bản nháp!');
      fetchExistingRegistration();
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error('Lỗi khi lưu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const submitRegistration = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('clubs').upsert({
        owner_id: user.id,
        name: formData.club_name,
        address: formData.address,
        contact_info: formData.phone,
        description: '',
        status: 'active',
      });

      if (error) throw error;

      toast.success('🎉 Đã gửi đăng ký thành công!', {
        description:
          'Đăng ký CLB của bạn đang được xem xét. Chúng tôi sẽ gửi thông báo khi có kết quả xét duyệt.',
        duration: 5000,
      });
      fetchExistingRegistration();
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      toast.error('Lỗi khi gửi đăng ký: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToEdit = async () => {
    if (!user || !existingRegistration) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .update({
          status: 'active',
        })
        .eq('owner_id', user.id);

      if (error) throw error;

      toast.success('Đã chuyển về chế độ chỉnh sửa');
      fetchExistingRegistration();
    } catch (error: any) {
      console.error('Error resetting to edit:', error);
      toast.error('Lỗi khi chuyển về chế độ chỉnh sửa: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.club_name &&
          formData.address &&
          formData.district &&
          formData.city &&
          formData.phone &&
          formData.table_types.length > 0
        );
      case 2:
        return formData.photos.length >= 3;
      case 3:
        return formData.manager_name;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Function to compress and upload image
  const compressImage = (
    file: File,
    maxSizeKB: number = 500
  ): Promise<File> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Set target size (crop to square)
        const targetSize = 800;
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Calculate crop dimensions (center crop to square)
        const { width, height } = img;
        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;

        // Draw cropped image
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          size,
          size, // Source crop
          0,
          0,
          targetSize,
          targetSize // Destination
        );

        // Try different quality levels
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            blob => {
              if (blob && (blob.size <= maxSizeKB * 1024 || quality <= 0.1)) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !user) return;

    if (files.length + formData.photos.length > 10) {
      toast.error('Tối đa 10 ảnh');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          toast.error('Chỉ được tải lên file hình ảnh');
          continue;
        }

        // Compress image
        const compressedFile = await compressImage(file);

        const fileExt = 'jpg';
        const fileName = `${user.id}/club-photos/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('club-photos')
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('club-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls],
      }));

      toast.success(`Đã tải lên ${uploadedUrls.length} ảnh thành công!`);
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast.error('Lỗi khi tải ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBusinessLicenseUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !user) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ được tải lên file hình ảnh');
      return;
    }

    setUploading(true);
    try {
      // Compress image
      const compressedFile = await compressImage(file);

      const fileExt = 'jpg';
      const fileName = `${user.id}/business-license/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('club-photos')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('club-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        business_license_url: urlData.publicUrl,
      }));

      toast.success('Đã tải lên ảnh giấy phép thành công!');
    } catch (error: any) {
      console.error('Error uploading business license:', error);
      toast.error('Lỗi khi tải ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className='bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã duyệt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className='bg-red-100 text-red-800'>
            <XCircle className='w-3 h-3 mr-1' />
            Bị từ chối
          </Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-yellow-100 text-yellow-800'>
            <AlertCircle className='w-3 h-3 mr-1' />
            Chờ duyệt
          </Badge>
        );
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800'>
            <Save className='w-3 h-3 mr-1' />
            Bản nháp
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2'></div>
            <p className='text-sm text-gray-600'>Đang tải...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center'>
            <Building className='w-5 h-5 mr-2' />
            Đăng ký câu lạc bộ
          </div>
          {existingRegistration && getStatusBadge(existingRegistration.status)}
        </CardTitle>
        <div className='space-y-2'>
          <Progress value={(currentStep / 3) * 100} className='w-full' />
          <div className='flex justify-between text-sm text-gray-500'>
            <span
              className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}
            >
              Thông tin cơ bản
            </span>
            <span
              className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}
            >
              Chi tiết & Ảnh
            </span>
            <span
              className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}
            >
              Xác thực
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Bước 1: Thông tin cơ bản</h3>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Tên câu lạc bộ *
              </label>
              <Input
                value={formData.club_name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, club_name: e.target.value }))
                }
                placeholder='CLB Billiards ABC'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <MapPin className='w-4 h-4 inline mr-1' />
                Địa chỉ chi tiết *
              </label>
              <Textarea
                value={formData.address}
                onChange={e =>
                  setFormData(prev => ({ ...prev, address: e.target.value }))
                }
                placeholder='123 Đường ABC, Phường DEF'
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Quận/Huyện *
                </label>
                <Input
                  value={formData.district}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, district: e.target.value }))
                  }
                  placeholder='Quận 1'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Thành phố *
                </label>
                <Input
                  value={formData.city}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, city: e.target.value }))
                  }
                  placeholder='TP. Hồ Chí Minh'
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Phone className='w-4 h-4 inline mr-1' />
                Số điện thoại CLB *
              </label>
              <Input
                value={formData.phone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, phone: e.target.value }))
                }
                placeholder='0901234567'
                type='tel'
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Clock className='w-4 h-4 inline mr-1' />
                  Giờ mở cửa *
                </label>
                <Input
                  type='time'
                  value={formData.opening_time}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      opening_time: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Giờ đóng cửa *
                </label>
                <Input
                  type='time'
                  value={formData.closing_time}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      closing_time: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Users className='w-4 h-4 inline mr-1' />
                  Số lượng bàn *
                </label>
                <Input
                  type='number'
                  min='1'
                  value={formData.table_count}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      table_count: parseInt(e.target.value) || 1,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Giá cơ bản/giờ (VNĐ) *
                </label>
                <Input
                  type='number'
                  min='0'
                  value={formData.basic_price}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      basic_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder='50000'
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Loại bàn chính *
              </label>
              <div className='flex flex-wrap gap-2'>
                {tableTypeOptions.map(option => (
                  <label
                    key={option.value}
                    className='flex items-center space-x-2'
                  >
                    <Checkbox
                      checked={formData.table_types.includes(option.value)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            table_types: [...prev.table_types, option.value],
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            table_types: prev.table_types.filter(
                              t => t !== option.value
                            ),
                          }));
                        }
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Detailed Info */}
        {currentStep === 2 && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>
              Bước 2: Chi tiết & Hình ảnh
            </h3>

            <div>
              <h4 className='font-medium mb-3'>Bảng giá chi tiết</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Giờ thường (VNĐ/h)
                  </label>
                  <Input
                    type='number'
                    min='0'
                    value={formData.normal_hour_price || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        normal_hour_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder='50000'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Giờ vàng 17-21h (VNĐ/h)
                  </label>
                  <Input
                    type='number'
                    min='0'
                    value={formData.peak_hour_price || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        peak_hour_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder='70000'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Cuối tuần (VNĐ/h)
                  </label>
                  <Input
                    type='number'
                    min='0'
                    value={formData.weekend_price || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        weekend_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder='60000'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Bàn VIP (VNĐ/h)
                  </label>
                  <Input
                    type='number'
                    min='0'
                    value={formData.vip_table_price || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        vip_table_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder='100000'
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className='font-medium mb-3'>Tiện ích</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                {amenityOptions.map(amenity => (
                  <label
                    key={amenity.key}
                    className='flex items-center space-x-2'
                  >
                    <Checkbox
                      checked={formData.amenities[amenity.key] || false}
                      onCheckedChange={checked => {
                        setFormData(prev => ({
                          ...prev,
                          amenities: {
                            ...prev.amenities,
                            [amenity.key]: !!checked,
                          },
                        }));
                      }}
                    />
                    <span>{amenity.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Camera className='w-4 h-4 inline mr-1' />
                Ảnh câu lạc bộ (3-10 ảnh)
              </label>

              {/* Photo upload area */}
              <div className='space-y-4'>
                <div
                  className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer'
                  onClick={() =>
                    document.getElementById('photo-upload')?.click()
                  }
                >
                  <Camera className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                  <p className='text-sm text-gray-500'>
                    {uploading
                      ? 'Đang tải lên...'
                      : 'Nhấn để tải lên ảnh câu lạc bộ'}
                  </p>
                  <p className='text-xs text-gray-400'>
                    Tối thiểu 3 ảnh, tối đa 10 ảnh. Định dạng: JPG, PNG
                  </p>
                  <input
                    id='photo-upload'
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handlePhotoUpload}
                    className='hidden'
                    disabled={uploading}
                  />
                </div>

                {/* Photo preview grid */}
                {formData.photos.length > 0 && (
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                    {formData.photos.map((photo, index) => (
                      <div key={index} className='relative group'>
                        <img
                          src={photo}
                          alt={`Club photo ${index + 1}`}
                          className='w-full h-24 object-cover rounded-lg border'
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Photo count indicator */}
                <div className='text-sm text-gray-500'>
                  Đã tải: {formData.photos.length}/10 ảnh
                  {formData.photos.length < 3 && (
                    <span className='text-red-500 ml-2'>
                      (Cần tối thiểu 3 ảnh)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {currentStep === 3 && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>
              Bước 3: Thông tin xác thực
            </h3>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Tên người quản lý *
              </label>
              <Input
                value={formData.manager_name || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    manager_name: e.target.value,
                  }))
                }
                placeholder='Nguyễn Văn A'
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Zalo/WhatsApp
                </label>
                <Input
                  value={formData.manager_phone || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      manager_phone: e.target.value,
                    }))
                  }
                  placeholder='0901234567'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email
                </label>
                <Input
                  type='email'
                  value={formData.email || ''}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder='club@example.com'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Facebook/Fanpage URL
              </label>
              <Input
                value={formData.facebook_url || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    facebook_url: e.target.value,
                  }))
                }
                placeholder='https://facebook.com/yourclub'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Google Maps Link
              </label>
              <Input
                value={formData.google_maps_url || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    google_maps_url: e.target.value,
                  }))
                }
                placeholder='https://goo.gl/maps/...'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Ảnh giấy phép kinh doanh (không bắt buộc)
              </label>
              <div
                className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer'
                onClick={() =>
                  document.getElementById('business-license-upload')?.click()
                }
              >
                {formData.business_license_url ? (
                  <div className='space-y-2'>
                    <img
                      src={formData.business_license_url}
                      alt='Business License'
                      className='w-32 h-32 object-cover rounded-lg mx-auto border'
                    />
                    <div className='flex justify-center space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={e => {
                          e.stopPropagation();
                          document
                            .getElementById('business-license-upload')
                            ?.click();
                        }}
                      >
                        Thay ảnh khác
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={e => {
                          e.stopPropagation();
                          setFormData(prev => ({
                            ...prev,
                            business_license_url: '',
                          }));
                        }}
                      >
                        Xóa ảnh
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera className='w-6 h-6 mx-auto mb-2 text-gray-400' />
                    <p className='text-sm text-gray-500'>
                      {uploading ? 'Đang tải lên...' : 'Tải lên ảnh giấy phép'}
                    </p>
                    <p className='text-xs text-gray-400'>
                      Định dạng: JPG, PNG. Tối đa 5MB
                    </p>
                  </>
                )}
                <input
                  id='business-license-upload'
                  type='file'
                  accept='image/*'
                  onChange={handleBusinessLicenseUpload}
                  className='hidden'
                  disabled={uploading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className='flex justify-between pt-6 border-t'>
          <div>
            {currentStep > 1 && (
              <Button onClick={prevStep} variant='outline'>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Quay lại
              </Button>
            )}
          </div>

          <div className='flex space-x-3'>
            {formData.status === 'draft' && (
              <Button onClick={saveDraft} disabled={saving} variant='outline'>
                <Save className='w-4 h-4 mr-2' />
                {saving ? 'Đang lưu...' : 'Lưu nháp'}
              </Button>
            )}

            {currentStep < 3 ? (
              <Button onClick={nextStep}>
                Tiếp theo
                <ArrowRight className='w-4 h-4 ml-2' />
              </Button>
            ) : (
              <Button
                onClick={submitRegistration}
                disabled={
                  saving || !validateStep(3) || formData.status === 'pending'
                }
                className='bg-blue-600 hover:bg-blue-700'
              >
                {saving ? 'Đang gửi...' : 'Gửi đăng ký'}
              </Button>
            )}
          </div>
        </div>

        {/* Status info */}
        {existingRegistration && existingRegistration.status !== 'draft' && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              existingRegistration.status === 'approved'
                ? 'bg-green-50'
                : existingRegistration.status === 'rejected'
                  ? 'bg-red-50'
                  : 'bg-blue-50'
            }`}
          >
            <div className='flex justify-between items-start'>
              <div className='flex-1'>
                <p
                  className={`text-sm font-medium ${
                    existingRegistration.status === 'approved'
                      ? 'text-green-800'
                      : existingRegistration.status === 'rejected'
                        ? 'text-red-800'
                        : 'text-blue-800'
                  }`}
                >
                  <strong>Trạng thái:</strong>{' '}
                  {existingRegistration.status === 'pending'
                    ? 'Đang chờ admin xét duyệt'
                    : existingRegistration.status === 'approved'
                      ? '🎉 Đã được duyệt thành công!'
                      : '❌ Bị từ chối'}
                </p>

                {existingRegistration.status === 'pending' && (
                  <p className='text-xs text-blue-600 mt-1'>
                    💡 Chúng tôi sẽ gửi thông báo khi có kết quả xét duyệt
                  </p>
                )}

                {existingRegistration.status === 'approved' && (
                  <p className='text-xs text-green-600 mt-1'>
                    ✅ CLB của bạn đã được chấp thuận và có thể hoạt động
                  </p>
                )}

                {existingRegistration.rejection_reason && (
                  <div className='mt-2 p-2 bg-red-100 rounded'>
                    <p className='text-sm text-red-800'>
                      <strong>Lý do từ chối:</strong>{' '}
                      {existingRegistration.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Edit button for pending or rejected registrations */}
              {(existingRegistration.status === 'pending' ||
                existingRegistration.status === 'rejected') && (
                <Button
                  onClick={resetToEdit}
                  disabled={saving}
                  variant='outline'
                  size='sm'
                  className='ml-4'
                >
                  {saving ? 'Đang xử lý...' : 'Chỉnh sửa đăng ký'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubRegistrationMultiStepForm;
