import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Camera, User } from 'lucide-react';

interface AvatarSelectorProps {
  currentAvatar?: string;
  onAvatarSelect: (avatarUrl: string) => void;
}

const AvatarSelector = ({
  currentAvatar,
  onAvatarSelect,
}: AvatarSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Chibi billiard character avatars
  const avatarOptions = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-1&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-2&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-3&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-4&backgroundColor=fecaca',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-5&backgroundColor=fed7aa',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-6&backgroundColor=fef3c7',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-7&backgroundColor=bbf7d0',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-8&backgroundColor=fce7f3',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-9&backgroundColor=e0e7ff',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-10&backgroundColor=fef2f2',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-11&backgroundColor=f0fdfa',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=billiard-player-12&backgroundColor=fffbeb',
  ];

  const handleAvatarSelect = (avatarUrl: string) => {
    onAvatarSelect(avatarUrl);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='flex items-center gap-2'>
          <Camera className='h-4 w-4' />
          Thay đổi ảnh
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Chọn Avatar Chibi Bida</DialogTitle>
        </DialogHeader>
        <div className='grid grid-cols-4 gap-4 p-4'>
          {avatarOptions.map((avatar, index) => (
            <button
              key={index}
              onClick={() => handleAvatarSelect(avatar)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                currentAvatar === avatar
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <img
                src={avatar}
                alt={`Avatar ${index + 1}`}
                className='w-full h-20 object-cover'
              />
            </button>
          ))}
        </div>
        <div className='flex justify-center pt-4'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;
