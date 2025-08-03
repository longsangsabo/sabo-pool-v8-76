import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Challenge } from '@/types/challenge';

interface ChallengeVerificationModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { notes: string; images: string[] }) => void;
}

export const ChallengeVerificationModal: React.FC<
  ChallengeVerificationModalProps
> = ({ challenge, isOpen, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = () => {
    onSubmit({ notes, images });
    setNotes('');
    setImages([]);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Basic validation - allow only images
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length !== files.length) {
        alert('Chỉ chấp nhận các tệp hình ảnh.');
        return;
      }

      // Convert files to base64 strings
      Promise.all(
        imageFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => {
              if (event.target?.result) {
                resolve(event.target.result as string);
              } else {
                reject('Lỗi đọc tệp.');
              }
            };
            reader.onerror = () => reject('Lỗi đọc tệp.');
            reader.readAsDataURL(file);
          });
        })
      )
        .then(base64Images => {
          setImages(prevImages => [...prevImages, ...base64Images]);
        })
        .catch(error => {
          console.error('Lỗi xử lý tệp:', error);
          alert('Có lỗi xảy ra khi xử lý tệp.');
        });
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prevImages =>
      prevImages.filter((_, index) => index !== indexToRemove)
    );
  };

  const opponent =
    challenge?.opponent_profile ||
    challenge?.opponent ||
    challenge?.challenged_profile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Xác minh kết quả thách đấu</DialogTitle>
          <DialogDescription>
            Cung cấp thông tin và hình ảnh để xác minh kết quả trận đấu.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-6'>
          {/* Challenge Info */}
          <div className='flex items-center space-x-3 p-3 bg-blue-50 rounded-lg'>
            <Avatar className='w-12 h-12'>
              <AvatarImage src={opponent?.avatar_url} />
              <AvatarFallback>
                {opponent?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className='font-semibold'>
                vs {opponent?.full_name || 'Unknown Player'}
              </h3>
              <p className='text-sm text-gray-600'>
                Cược: {challenge?.bet_points || 0} điểm • Rank:{' '}
                {opponent?.verified_rank || opponent?.current_rank || 'K'}
              </p>
            </div>
          </div>

          {/* Verification Form */}
          <div className='space-y-4'>
            <div>
              <Label htmlFor='notes'>Ghi chú</Label>
              <Textarea
                id='notes'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='Thêm ghi chú về kết quả trận đấu...'
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor='images'>Hình ảnh xác minh</Label>
              <Input
                type='file'
                id='images'
                multiple
                accept='image/*'
                onChange={handleImageUpload}
                className='hidden'
              />
              <Label
                htmlFor='images'
                className='bg-gray-100 rounded-md p-2 text-center cursor-pointer block'
              >
                Chọn hình ảnh
              </Label>
              <div className='mt-2 grid grid-cols-3 gap-2'>
                {images.map((image, index) => (
                  <div key={index} className='relative'>
                    <img
                      src={image}
                      alt={`Hình ảnh ${index + 1}`}
                      className='rounded-md'
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3'>
            <Button variant='outline' onClick={onClose} className='flex-1'>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            >
              Gửi xác minh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
