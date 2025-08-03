import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Camera,
  Timer,
  User,
  PlayCircle,
  StopCircle,
  Image,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { getRankInfo } from '@/utils/rankDefinitions';

interface RankTestModalProps {
  request: {
    id: string;
    user_id: string;
    requested_rank: string;
    status: string;
    profiles?: {
      full_name: string;
      phone: string;
    };
  };
  onStartTest: (id: string) => void;
  onCompleteTest: (
    id: string,
    status: 'approved' | 'rejected',
    result: TestResult
  ) => void;
  processing: boolean;
}

interface TestResult {
  testDuration: number;
  testScore: number;
  skillLevel: 'excellent' | 'good' | 'average' | 'below_average';
  checklist: {
    technique: boolean;
    strategy: boolean;
    consistency: boolean;
    pressure_handling: boolean;
  };
  notes: string;
  proofPhotos?: string[];
}

const RankTestModal = ({
  request,
  onStartTest,
  onCompleteTest,
  processing,
}: RankTestModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testPhase, setTestPhase] = useState<'confirm' | 'testing' | 'result'>(
    'confirm'
  );
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [testDuration, setTestDuration] = useState(0);

  // Test result form state
  const [testScore, setTestScore] = useState<number>(0);
  const [skillLevel, setSkillLevel] = useState<
    'excellent' | 'good' | 'average' | 'below_average'
  >('average');
  const [checklist, setChecklist] = useState({
    technique: false,
    strategy: false,
    consistency: false,
    pressure_handling: false,
  });
  const [notes, setNotes] = useState('');
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Timer for test duration
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testPhase === 'testing' && testStartTime) {
      interval = setInterval(() => {
        setTestDuration(Math.floor((Date.now() - testStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testPhase, testStartTime]);

  const handleStartTest = () => {
    setTestStartTime(Date.now());
    setTestPhase('testing');
    onStartTest(request.id);
    toast.success(
      'Đã bắt đầu test hạng. Hãy quan sát kỹ kỹ năng của người chơi!'
    );
  };

  const handleStopTest = () => {
    if (testStartTime) {
      const finalDuration = Math.floor((Date.now() - testStartTime) / 1000);
      setTestDuration(finalDuration);
      setTestPhase('result');
    }
  };

  const handleCompleteTest = (status: 'approved' | 'rejected') => {
    const result: TestResult = {
      testDuration,
      testScore,
      skillLevel,
      checklist,
      notes,
      proofPhotos,
    };

    onCompleteTest(request.id, status, result);
    setIsOpen(false);
    resetModal();
  };

  const resetModal = () => {
    setTestPhase('confirm');
    setTestStartTime(null);
    setTestDuration(0);
    setTestScore(0);
    setSkillLevel('average');
    setChecklist({
      technique: false,
      strategy: false,
      consistency: false,
      pressure_handling: false,
    });
    setNotes('');
    setProofPhotos([]);
    setUploading(false);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // For now, we'll create a mock URL - in real implementation, you'd upload to Supabase storage
        return new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setProofPhotos([...proofPhotos, ...uploadedUrls]);
      toast.success(`Đã tải lên ${uploadedUrls.length} hình ảnh`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Lỗi khi tải lên hình ảnh');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setProofPhotos(proofPhotos.filter((_, i) => i !== index));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const rankInfo = getRankInfo(request.requested_rank);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          disabled={processing}
          className='bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
        >
          <PlayCircle className='w-4 h-4 mr-1' />
          Bắt đầu test
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5 text-blue-600' />
            Test xác thực hạng {request.requested_rank}
          </DialogTitle>
        </DialogHeader>

        {/* Confirm Phase */}
        {testPhase === 'confirm' && (
          <div className='space-y-6'>
            {/* Player Info */}
            <div className='bg-blue-50 rounded-lg p-4'>
              <h3 className='font-semibold mb-2'>Thông tin người chơi</h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-600'>Tên:</span>
                  <span className='font-medium ml-2'>
                    {request.profiles?.full_name || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>SĐT:</span>
                  <span className='font-medium ml-2'>
                    {request.profiles?.phone || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rank Requirements */}
            <div className='border-2 border-blue-200 rounded-lg p-4 bg-blue-50'>
              <div className='flex items-center gap-2 mb-3'>
                <Trophy className='w-5 h-5 text-blue-600' />
                <h3 className='font-bold text-lg text-blue-800'>
                  {rankInfo.name}
                </h3>
              </div>
              <p className='text-blue-700 mb-4 font-medium'>
                {rankInfo.description}
              </p>
              <div className='bg-white rounded-lg p-3 border border-blue-200'>
                <h4 className='font-semibold mb-3 text-blue-800 flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4' />
                  Yêu cầu kiểm tra chi tiết:
                </h4>
                <ul className='space-y-2'>
                  {rankInfo.requirements.map((req, index) => (
                    <li key={index} className='flex items-start text-sm'>
                      <CheckCircle className='w-4 h-4 text-green-500 mr-3 flex-shrink-0 mt-0.5' />
                      <span className='text-gray-700'>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Warning */}
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <div className='flex'>
                <AlertTriangle className='w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5' />
                <div className='text-sm'>
                  <strong className='text-yellow-800'>Lưu ý quan trọng:</strong>
                  <ul className='mt-2 space-y-1 text-yellow-700'>
                    <li>• Test kỹ lưỡng trước khi quyết định</li>
                    <li>• Ghi chú chi tiết quá trình test</li>
                    <li>• Chụp ảnh/quay video làm bằng chứng nếu cần</li>
                    <li>• Xác thực sai nhiều sẽ ảnh hưởng uy tín CLB</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='flex justify-end space-x-2'>
              <Button variant='outline' onClick={() => setIsOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleStartTest}
                className='bg-blue-600 hover:bg-blue-700'
              >
                <PlayCircle className='w-4 h-4 mr-2' />
                Bắt đầu test ngay
              </Button>
            </div>
          </div>
        )}

        {/* Testing Phase */}
        {testPhase === 'testing' && (
          <div className='space-y-6'>
            <div className='text-center'>
              <div className='bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4'>
                <Timer className='w-10 h-10 text-blue-600' />
              </div>
              <h3 className='text-2xl font-bold text-blue-600 mb-2'>
                {formatDuration(testDuration)}
              </h3>
              <p className='text-gray-600'>
                Đang test hạng {request.requested_rank}
              </p>
            </div>

            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <h4 className='font-semibold text-green-800 mb-2'>
                Đang quan sát:
              </h4>
              <div className='grid grid-cols-2 gap-2 text-sm text-green-700'>
                {rankInfo.requirements.map((req, index) => (
                  <div key={index} className='flex items-center'>
                    <div className='w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse'></div>
                    {req}
                  </div>
                ))}
              </div>
            </div>

            <div className='text-center'>
              <Button
                onClick={handleStopTest}
                className='bg-red-600 hover:bg-red-700'
                size='lg'
              >
                <StopCircle className='w-5 h-5 mr-2' />
                Kết thúc test
              </Button>
            </div>
          </div>
        )}

        {/* Result Phase */}
        {testPhase === 'result' && (
          <div className='space-y-6'>
            <div className='text-center mb-6'>
              <h3 className='text-xl font-bold mb-2'>Kết quả test</h3>
              <div className='text-lg text-blue-600'>
                Thời gian test: {formatDuration(testDuration)}
              </div>
            </div>

            {/* Test Score */}
            <div>
              <Label className='text-base font-semibold'>
                Điểm số test (0-100)
              </Label>
              <Input
                type='number'
                min='0'
                max='100'
                value={testScore}
                onChange={e => setTestScore(Number(e.target.value))}
                className='mt-2'
                placeholder='Nhập điểm từ 0-100'
              />
            </div>

            {/* Skill Level */}
            <div>
              <Label className='text-base font-semibold'>
                Đánh giá tổng thể
              </Label>
              <RadioGroup
                value={skillLevel}
                onValueChange={(value: any) => setSkillLevel(value)}
                className='mt-2'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='excellent' id='excellent' />
                  <Label htmlFor='excellent'>Xuất sắc (≥90 điểm)</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='good' id='good' />
                  <Label htmlFor='good'>Tốt (70-89 điểm)</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='average' id='average' />
                  <Label htmlFor='average'>Trung bình (50-69 điểm)</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='below_average' id='below_average' />
                  <Label htmlFor='below_average'>
                    Dưới trung bình (&lt;50 điểm)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Checklist */}
            <div>
              <Label className='text-base font-semibold'>
                Checklist kỹ năng
              </Label>
              <div className='mt-2 space-y-3'>
                {Object.entries({
                  technique: 'Kỹ thuật cầm cơ và đánh bi',
                  strategy: 'Tư duy chiến thuật và tính toán',
                  consistency: 'Tính ổn định trong từng cú đánh',
                  pressure_handling: 'Xử lý tình huống khó và áp lực',
                }).map(([key, label]) => (
                  <div key={key} className='flex items-center space-x-2'>
                    <Checkbox
                      id={key}
                      checked={checklist[key as keyof typeof checklist]}
                      onCheckedChange={checked =>
                        setChecklist(prev => ({ ...prev, [key]: !!checked }))
                      }
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className='text-base font-semibold'>
                Ghi chú chi tiết (bắt buộc)
              </Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='Mô tả chi tiết quá trình test, điểm mạnh/yếu của người chơi, lý do quyết định...'
                className='mt-2 min-h-[100px]'
                required
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label className='text-base font-semibold'>
                Hình ảnh bằng chứng (tùy chọn)
              </Label>
              <div className='mt-2 space-y-3'>
                <div className='flex items-center gap-2'>
                  <Input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className='hidden'
                    id='photo-upload'
                  />
                  <label
                    htmlFor='photo-upload'
                    className='flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors'
                  >
                    {uploading ? (
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                    ) : (
                      <Camera className='w-4 h-4 text-blue-600' />
                    )}
                    <span className='text-blue-700 text-sm'>
                      {uploading ? 'Đang tải lên...' : 'Chọn hình ảnh'}
                    </span>
                  </label>
                  <span className='text-xs text-gray-500'>
                    (Chụp ảnh quá trình test, kết quả, v.v...)
                  </span>
                </div>

                {proofPhotos.length > 0 && (
                  <div className='grid grid-cols-3 gap-2'>
                    {proofPhotos.map((photo, index) => (
                      <div key={index} className='relative group'>
                        <img
                          src={photo}
                          alt={`Bằng chứng ${index + 1}`}
                          className='w-full h-20 object-cover rounded-lg border'
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className='absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-2'>
              <Button
                variant='outline'
                onClick={() => setTestPhase('testing')}
                className='border-gray-300'
              >
                Quay lại
              </Button>
              <Button
                onClick={() => handleCompleteTest('rejected')}
                disabled={processing || !notes.trim()}
                className='bg-red-600 hover:bg-red-700'
              >
                <XCircle className='w-4 h-4 mr-2' />
                Từ chối
              </Button>
              <Button
                onClick={() => handleCompleteTest('approved')}
                disabled={processing || !notes.trim() || testScore < 50}
                className='bg-green-600 hover:bg-green-700'
              >
                <CheckCircle className='w-4 h-4 mr-2' />
                Duyệt hạng
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RankTestModal;
