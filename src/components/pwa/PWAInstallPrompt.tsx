import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X, Smartphone, Wifi, Zap, Check, Star } from 'lucide-react';

interface PWAInstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        onInstall();
      }

      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <div className='fixed bottom-4 left-4 right-4 z-50 md:max-w-sm md:left-auto'>
      <Card className='shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Download className='h-5 w-5 text-blue-600' />
              Cài đặt ứng dụng
            </CardTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDismiss}
              className='h-6 w-6 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          <p className='text-sm text-gray-700'>
            Cài đặt ứng dụng để truy cập nhanh hơn và có trải nghiệm tốt hơn!
          </p>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm'>
              <Smartphone className='h-4 w-4 text-blue-600' />
              <span>Truy cập nhanh từ màn hình chính</span>
            </div>
            <div className='flex items-center gap-2 text-sm'>
              <Wifi className='h-4 w-4 text-blue-600' />
              <span>Hoạt động offline</span>
            </div>
            <div className='flex items-center gap-2 text-sm'>
              <Zap className='h-4 w-4 text-blue-600' />
              <span>Tốc độ tải nhanh hơn</span>
            </div>
            <div className='flex items-center gap-2 text-sm'>
              <Star className='h-4 w-4 text-blue-600' />
              <span>Trải nghiệm như app native</span>
            </div>
          </div>

          <div className='flex gap-2'>
            <Button
              onClick={handleInstall}
              className='flex-1 bg-blue-600 hover:bg-blue-700'
            >
              <Download className='h-4 w-4 mr-2' />
              Cài đặt ngay
            </Button>
            <Button
              variant='outline'
              onClick={handleDismiss}
              className='flex-1'
            >
              Để sau
            </Button>
          </div>

          <div className='text-xs text-gray-500 text-center'>
            Ứng dụng sẽ được cài đặt trên thiết bị của bạn
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
