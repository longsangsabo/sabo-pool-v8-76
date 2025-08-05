import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onPhotoCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture = ({ onPhotoCapture, onClose }: CameraCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error('Ảnh không được vượt quá 2MB');
        return;
      }
      onPhotoCapture(file);
      onClose();
    }
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-md'>
        <CardContent className='p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold'>Chụp ảnh trận đấu</h3>
            <Button variant='ghost' size='sm' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          </div>

          <div className='space-y-4'>
            <p className='text-sm text-gray-600'>
              Chụp ảnh để lưu lại khoảnh khắc đáng nhớ của trận đấu
            </p>

            <div className='flex flex-col gap-3'>
              <Button
                onClick={openCamera}
                className='flex items-center justify-center gap-2'
                disabled={isCapturing}
              >
                <Camera className='h-4 w-4' />
                Chụp ảnh từ camera
              </Button>

              <Button
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                className='flex items-center justify-center gap-2'
              >
                <Upload className='h-4 w-4' />
                Chọn từ thư viện
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              capture='environment'
              onChange={handleFileSelect}
              className='hidden'
            />

            <p className='text-xs text-gray-500 text-center'>
              Dung lượng tối đa: 2MB • Định dạng: JPG, PNG
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraCapture;
