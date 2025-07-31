import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Share2,
  Users,
  Globe,
  Copy,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  Mail,
  Link,
  Check,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onShare: (postId: string, shareType: 'public' | 'friends') => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  postId,
  onShare,
}) => {
  const [selectedType, setSelectedType] = useState<'public' | 'friends'>(
    'public'
  );
  const [copied, setCopied] = useState(false);

  const shareOptions = [
    {
      id: 'public',
      title: 'Công khai',
      description: 'Chia sẻ với tất cả mọi người',
      icon: <Globe className='h-5 w-5' />,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'friends',
      title: 'Bạn bè',
      description: 'Chia sẻ chỉ với bạn bè',
      icon: <Users className='h-5 w-5' />,
      color: 'bg-green-100 text-green-600',
    },
  ];

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: <Facebook className='h-5 w-5' />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
          '_blank'
        ),
    },
    {
      name: 'Twitter',
      icon: <Twitter className='h-5 w-5' />,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`,
          '_blank'
        ),
    },
    {
      name: 'Instagram',
      icon: <Instagram className='h-5 w-5' />,
      color: 'bg-pink-500 hover:bg-pink-600',
      action: () => {
        // Instagram sharing logic
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
  ];

  const handleShare = () => {
    onShare(postId, selectedType);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDirectMessage = () => {
    // Handle direct message sharing
    console.log('Share via direct message');
    onClose();
  };

  const handleEmail = () => {
    // Handle email sharing
    window.open(
      `mailto:?subject=Check out this post&body=${encodeURIComponent(window.location.href)}`
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Share2 className='h-5 w-5' />
            Chia sẻ bài viết
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Share Type Selection */}
          <div className='space-y-3'>
            <h3 className='font-medium text-gray-900'>Chọn cách chia sẻ</h3>
            <div className='space-y-2'>
              {shareOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() =>
                    setSelectedType(option.id as 'public' | 'friends')
                  }
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    selectedType === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div className={`p-2 rounded-full ${option.color}`}>
                      {option.icon}
                    </div>
                    <div className='text-left'>
                      <div className='font-medium'>{option.title}</div>
                      <div className='text-sm text-gray-600'>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Social Media Platforms */}
          <div className='space-y-3'>
            <h3 className='font-medium text-gray-900'>
              Chia sẻ trên mạng xã hội
            </h3>
            <div className='grid grid-cols-3 gap-2'>
              {socialPlatforms.map(platform => (
                <button
                  key={platform.name}
                  onClick={platform.action}
                  className={`p-3 rounded-lg text-white ${platform.color} transition-colors`}
                >
                  <div className='flex flex-col items-center gap-1'>
                    {platform.icon}
                    <span className='text-xs'>{platform.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Other Sharing Options */}
          <div className='space-y-3'>
            <h3 className='font-medium text-gray-900'>Tùy chọn khác</h3>
            <div className='space-y-2'>
              <button
                onClick={handleCopyLink}
                className='w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'
              >
                <div className='p-2 rounded-full bg-gray-100'>
                  {copied ? (
                    <Check className='h-4 w-4 text-green-600' />
                  ) : (
                    <Link className='h-4 w-4 text-gray-600' />
                  )}
                </div>
                <div className='text-left'>
                  <div className='font-medium'>
                    {copied ? 'Đã sao chép!' : 'Sao chép liên kết'}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {copied
                      ? 'Liên kết đã được sao chép'
                      : 'Chia sẻ liên kết trực tiếp'}
                  </div>
                </div>
              </button>

              <button
                onClick={handleDirectMessage}
                className='w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'
              >
                <div className='p-2 rounded-full bg-blue-100'>
                  <MessageCircle className='h-4 w-4 text-blue-600' />
                </div>
                <div className='text-left'>
                  <div className='font-medium'>Tin nhắn trực tiếp</div>
                  <div className='text-sm text-gray-600'>
                    Gửi cho bạn bè cụ thể
                  </div>
                </div>
              </button>

              <button
                onClick={handleEmail}
                className='w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'
              >
                <div className='p-2 rounded-full bg-red-100'>
                  <Mail className='h-4 w-4 text-red-600' />
                </div>
                <div className='text-left'>
                  <div className='font-medium'>Gửi email</div>
                  <div className='text-sm text-gray-600'>Chia sẻ qua email</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2 pt-4 border-t'>
            <Button variant='outline' onClick={onClose} className='flex-1'>
              Hủy
            </Button>
            <Button onClick={handleShare} className='flex-1'>
              Chia sẻ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
