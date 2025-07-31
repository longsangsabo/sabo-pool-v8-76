import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Trophy,
  Settings,
  Upload,
  X,
} from 'lucide-react';

interface TournamentForm {
  name: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
  location: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  min_participants: number;
  eligible_ranks: string[];
  is_public: boolean;
  requires_approval: boolean;
  rules: string;
  contact_info: string;
  banner_image?: File;
}

interface TournamentCreatorProps {
  onSave: (tournament: TournamentForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TournamentCreator: React.FC<TournamentCreatorProps> = ({
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [form, setForm] = useState<TournamentForm>({
    name: '',
    description: '',
    category: 'amateur',
    start_date: '',
    end_date: '',
    location: '',
    entry_fee: 0,
    prize_pool: 0,
    max_participants: 32,
    min_participants: 8,
    eligible_ranks: [],
    is_public: true,
    requires_approval: false,
    rules: '',
    contact_info: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const categories = [
    { value: 'amateur', label: 'Nghiệp dư' },
    { value: 'professional', label: 'Chuyên nghiệp' },
    { value: 'championship', label: 'Vô địch' },
    { value: 'friendly', label: 'Thân thiện' },
  ];

  const ranks = [
    { value: 'E+', label: 'Chuyên nghiệp tiến bộ (E+)' },
    { value: 'E', label: 'Chuyên nghiệp (E)' },
    { value: 'F+', label: 'Xuất sắc tiến bộ (F+)' },
    { value: 'F', label: 'Xuất sắc (F)' },
    { value: 'G+', label: 'Giỏi tiến bộ (G+)' },
    { value: 'G', label: 'Giỏi (G)' },
    { value: 'H+', label: 'Khá tiến bộ (H+)' },
    { value: 'H', label: 'Khá (H)' },
    { value: 'I+', label: 'Trung bình tiến bộ (I+)' },
    { value: 'I', label: 'Trung bình (I)' },
    { value: 'K+', label: 'Người mới tiến bộ (K+)' },
    { value: 'K', label: 'Người mới (K)' },
  ];

  const handleInputChange = (key: keyof TournamentForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleRankToggle = (rank: string) => {
    setForm(prev => ({
      ...prev,
      eligible_ranks: prev.eligible_ranks.includes(rank)
        ? prev.eligible_ranks.filter(r => r !== rank)
        : [...prev.eligible_ranks, rank],
    }));
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, banner_image: file }));
      const reader = new FileReader();
      reader.onload = e => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBanner = () => {
    setForm(prev => ({ ...prev, banner_image: undefined }));
    setBannerPreview('');
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSave(form);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          form.name &&
          form.description &&
          form.category &&
          form.start_date &&
          form.end_date
        );
      case 2:
        return (
          form.location &&
          form.entry_fee >= 0 &&
          form.prize_pool >= 0 &&
          form.max_participants > 0
        );
      case 3:
        return form.eligible_ranks.length > 0;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Tên giải đấu *
        </label>
        <Input
          placeholder='Nhập tên giải đấu...'
          value={form.name}
          onChange={e => handleInputChange('name', e.target.value)}
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Mô tả *
        </label>
        <Textarea
          placeholder='Mô tả chi tiết về giải đấu...'
          value={form.description}
          onChange={e => handleInputChange('description', e.target.value)}
          rows={4}
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Danh mục *
        </label>
        <Select
          value={form.category}
          onValueChange={value => handleInputChange('category', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Ngày bắt đầu *
          </label>
          <Input
            type='datetime-local'
            value={form.start_date}
            onChange={e => handleInputChange('start_date', e.target.value)}
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Ngày kết thúc *
          </label>
          <Input
            type='datetime-local'
            value={form.end_date}
            onChange={e => handleInputChange('end_date', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Banner giải đấu
        </label>
        <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
          {bannerPreview ? (
            <div className='relative'>
              <img
                src={bannerPreview}
                alt='Banner preview'
                className='max-h-32 mx-auto rounded'
              />
              <Button
                variant='outline'
                size='sm'
                onClick={removeBanner}
                className='absolute top-2 right-2'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ) : (
            <div>
              <Upload className='h-8 w-8 mx-auto mb-2 text-gray-400' />
              <p className='text-sm text-gray-600 mb-2'>
                Kéo thả hoặc click để tải ảnh banner
              </p>
              <Input
                type='file'
                accept='image/*'
                onChange={handleBannerUpload}
                className='hidden'
                id='banner-upload'
              />
              <label htmlFor='banner-upload'>
                <Button variant='outline' size='sm' className='cursor-pointer'>
                  Chọn ảnh
                </Button>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Địa điểm *
        </label>
        <Input
          placeholder='Nhập địa điểm tổ chức...'
          value={form.location}
          onChange={e => handleInputChange('location', e.target.value)}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Phí tham gia (VNĐ)
          </label>
          <Input
            type='number'
            placeholder='0'
            value={form.entry_fee}
            onChange={e =>
              handleInputChange('entry_fee', parseInt(e.target.value) || 0)
            }
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Giải thưởng (VNĐ)
          </label>
          <Input
            type='number'
            placeholder='0'
            value={form.prize_pool}
            onChange={e =>
              handleInputChange('prize_pool', parseInt(e.target.value) || 0)
            }
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Số người tham gia tối đa *
          </label>
          <Input
            type='number'
            placeholder='32'
            value={form.max_participants}
            onChange={e =>
              handleInputChange(
                'max_participants',
                parseInt(e.target.value) || 32
              )
            }
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Số người tham gia tối thiểu
          </label>
          <Input
            type='number'
            placeholder='8'
            value={form.min_participants}
            onChange={e =>
              handleInputChange(
                'min_participants',
                parseInt(e.target.value) || 8
              )
            }
          />
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='isPublic'
            checked={form.is_public}
            onCheckedChange={checked => handleInputChange('is_public', checked)}
          />
          <label htmlFor='isPublic' className='text-sm cursor-pointer'>
            Công khai (ai cũng có thể xem)
          </label>
        </div>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='requiresApproval'
            checked={form.requires_approval}
            onCheckedChange={checked =>
              handleInputChange('requires_approval', checked)
            }
          />
          <label htmlFor='requiresApproval' className='text-sm cursor-pointer'>
            Yêu cầu phê duyệt đăng ký
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Hạng được phép tham gia *
        </label>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
          {ranks.map(rank => (
            <div key={rank.value} className='flex items-center space-x-2'>
              <Checkbox
                id={rank.value}
                checked={form.eligible_ranks.includes(rank.value)}
                onCheckedChange={() => handleRankToggle(rank.value)}
              />
              <label htmlFor={rank.value} className='text-sm cursor-pointer'>
                {rank.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Luật lệ giải đấu
        </label>
        <Textarea
          placeholder='Nhập luật lệ và quy định của giải đấu...'
          value={form.rules}
          onChange={e => handleInputChange('rules', e.target.value)}
          rows={4}
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Thông tin liên hệ
        </label>
        <Input
          placeholder='Email hoặc số điện thoại liên hệ...'
          value={form.contact_info}
          onChange={e => handleInputChange('contact_info', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <Card className='w-full max-w-4xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Tạo giải đấu mới
        </CardTitle>

        {/* Progress Steps */}
        <div className='flex items-center justify-between mt-4'>
          {[1, 2, 3].map(step => (
            <div key={step} className='flex items-center'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className='text-sm text-gray-600 mt-2'>
          Bước {currentStep}/3:{' '}
          {currentStep === 1
            ? 'Thông tin cơ bản'
            : currentStep === 2
              ? 'Chi tiết giải đấu'
              : 'Cài đặt tham gia'}
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className='flex justify-between pt-6 border-t'>
          <Button
            variant='outline'
            onClick={currentStep === 1 ? onCancel : prevStep}
            disabled={isLoading}
          >
            {currentStep === 1 ? 'Hủy' : 'Quay lại'}
          </Button>

          <div className='flex gap-2'>
            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep) || isLoading}
              >
                Tiếp theo
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid(currentStep) || isLoading}
              >
                {isLoading ? 'Đang tạo...' : 'Tạo giải đấu'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
