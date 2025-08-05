import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarManagerProps {
  currentAvatar?: string;
  onAvatarUpdate: (avatarUrl: string) => void;
  userDisplayName?: string;
}

const AvatarManager = ({
  currentAvatar,
  onAvatarUpdate,
  userDisplayName,
}: AvatarManagerProps) => {
  const { user } = useAuth();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Kho avatar chibi bida có sẵn
  const avatarCollection = [
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
    'https://api.dicebear.com/7.x/adventurer/svg?seed=female-player-1&backgroundColor=fce7f3',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=female-player-2&backgroundColor=e0e7ff',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=female-player-3&backgroundColor=fef2f2',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=female-player-4&backgroundColor=f0fdfa',
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update user profile
      await updateUserAvatar(data.publicUrl);

      toast.success('Cập nhật ảnh đại diện thành công!');
      setShowAvatarModal(false);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPresetAvatar = async (avatarUrl: string) => {
    try {
      await updateUserAvatar(avatarUrl);
      toast.success('Cập nhật ảnh đại diện thành công!');
      setShowAvatarModal(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', user?.id);

    if (error) throw error;
    onAvatarUpdate(avatarUrl);
  };

  return (
    <>
      {/* Avatar Display & Edit Button */}
      <div className='relative inline-block'>
        <div
          className='w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 flex-shrink-0'
          style={{ width: '96px', height: '96px' }}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt='Avatar'
              width={96}
              height={96}
              className='w-24 h-24 rounded-full object-cover'
              loading='eager'
            />
          ) : (
            <span className='text-white text-2xl font-medium'>
              {userDisplayName?.charAt(0) ||
                user?.email?.charAt(0)?.toUpperCase() ||
                'U'}
            </span>
          )}
        </div>

        <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
          <DialogTrigger asChild>
            <button className='absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors'>
              <Camera className='w-4 h-4' />
            </button>
          </DialogTrigger>

          <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Chọn ảnh đại diện</DialogTitle>
            </DialogHeader>

            <div className='space-y-6'>
              {/* Upload Section */}
              <div>
                <h4 className='text-md font-medium text-gray-900 mb-3'>
                  Tải ảnh từ thiết bị
                </h4>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleFileUpload}
                    className='hidden'
                    id='avatar-upload'
                    disabled={uploading}
                  />
                  <label
                    htmlFor='avatar-upload'
                    className='cursor-pointer flex flex-col items-center'
                  >
                    {uploading ? (
                      <>
                        <Loader2 className='w-8 h-8 text-blue-600 animate-spin mb-2' />
                        <span className='text-sm text-gray-600'>
                          Đang tải lên...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className='w-8 h-8 text-gray-400 mb-2' />
                        <span className='text-sm text-gray-600'>
                          Nhấn để chọn ảnh hoặc kéo thả vào đây
                        </span>
                        <span className='text-xs text-gray-500 mt-1'>
                          PNG, JPG, GIF tối đa 5MB
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Preset Avatars */}
              <div>
                <h4 className='text-md font-medium text-gray-900 mb-3'>
                  Chọn từ bộ sưu tập
                </h4>
                <div className='grid grid-cols-4 md:grid-cols-6 gap-3'>
                  {avatarCollection.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectPresetAvatar(avatar)}
                      className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                        currentAvatar === avatar
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AvatarManager;
