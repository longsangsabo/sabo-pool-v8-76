import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const OAuthSetupGuide = () => {
  const [showGuide, setShowGuide] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}!`);
  };

  const redirectUrl =
    'https://knxevbkkkiadgppxbphh.supabase.co/auth/v1/callback';
  const siteUrl = window.location.origin;

  if (!showGuide) {
    return (
      <Button
        variant='outline'
        onClick={() => setShowGuide(true)}
        className='w-full mt-2'
      >
        📚 Hướng dẫn cấu hình Google & Facebook Login
      </Button>
    );
  }

  return (
    <Card className='mt-4'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          📚 Hướng dẫn cấu hình OAuth
          <Button variant='ghost' size='sm' onClick={() => setShowGuide(false)}>
            ✕
          </Button>
        </CardTitle>
        <CardDescription>
          Làm theo các bước này để kích hoạt đăng nhập Google & Facebook
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='supabase' className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='supabase'>1. Supabase</TabsTrigger>
            <TabsTrigger value='google'>2. Google</TabsTrigger>
            <TabsTrigger value='facebook'>3. Facebook</TabsTrigger>
          </TabsList>

          <TabsContent value='supabase' className='space-y-4'>
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                <strong>Bước 1: Cấu hình Supabase Dashboard</strong>
              </AlertDescription>
            </Alert>

            <div className='space-y-3'>
              <p>1. Truy cập Supabase Dashboard:</p>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  window.open(
                    'https://supabase.com/dashboard/project/f5355f18-6802-404b-9d2c-539e6dccb10c/auth/providers',
                    '_blank'
                  )
                }
                className='flex items-center gap-2'
              >
                <ExternalLink className='h-4 w-4' />
                Mở Authentication Providers
              </Button>

              <p>2. Kích hoạt Google và Facebook providers</p>
              <p>3. Cấu hình URL Configuration:</p>
              <div className='bg-gray-50 p-3 rounded space-y-2'>
                <div className='flex items-center gap-2'>
                  <code className='bg-white px-2 py-1 rounded text-sm flex-1'>
                    Site URL: {siteUrl}
                  </code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(siteUrl, 'Site URL')}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
                <div className='flex items-center gap-2'>
                  <code className='bg-white px-2 py-1 rounded text-sm flex-1'>
                    Redirect URL: {redirectUrl}
                  </code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(redirectUrl, 'Redirect URL')}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='google' className='space-y-4'>
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                <strong>Bước 2: Cấu hình Google Cloud Console</strong>
              </AlertDescription>
            </Alert>

            <div className='space-y-3'>
              <p>1. Truy cập Google Cloud Console:</p>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  window.open('https://console.cloud.google.com/', '_blank')
                }
                className='flex items-center gap-2'
              >
                <ExternalLink className='h-4 w-4' />
                Google Cloud Console
              </Button>

              <p>2. Tạo project mới hoặc chọn project có sẵn</p>
              <p>3. Đi tới APIs & Services → Credentials</p>
              <p>4. Cấu hình OAuth consent screen:</p>
              <ul className='list-disc list-inside ml-4 space-y-1'>
                <li>User Type: External</li>
                <li>App name: SABO Pool Arena</li>
                <li>Authorized domains: knxevbkkkiadgppxbphh.supabase.co</li>
                <li>Scopes: email, profile, openid</li>
              </ul>

              <p>5. Tạo OAuth Client ID:</p>
              <ul className='list-disc list-inside ml-4 space-y-1'>
                <li>Application type: Web application</li>
                <li>Name: SABO Pool Arena Web Client</li>
              </ul>

              <p>6. Thêm Authorized URLs:</p>
              <div className='bg-gray-50 p-3 rounded space-y-2'>
                <p className='font-medium'>Authorized JavaScript origins:</p>
                <div className='flex items-center gap-2'>
                  <code className='bg-white px-2 py-1 rounded text-sm flex-1'>
                    {siteUrl}
                  </code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() =>
                      copyToClipboard(siteUrl, 'JavaScript origin')
                    }
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
                <p className='font-medium'>Authorized redirect URIs:</p>
                <div className='flex items-center gap-2'>
                  <code className='bg-white px-2 py-1 rounded text-sm flex-1'>
                    {redirectUrl}
                  </code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(redirectUrl, 'Redirect URI')}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <p>
                7. Copy Client ID và Client Secret, thêm vào Supabase Dashboard
              </p>
            </div>
          </TabsContent>

          <TabsContent value='facebook' className='space-y-4'>
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                <strong>Bước 3: Cấu hình Facebook Developers</strong>
              </AlertDescription>
            </Alert>

            <div className='space-y-3'>
              <p>1. Truy cập Facebook Developers:</p>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  window.open('https://developers.facebook.com/', '_blank')
                }
                className='flex items-center gap-2'
              >
                <ExternalLink className='h-4 w-4' />
                Facebook Developers
              </Button>

              <p>2. Tạo app mới:</p>
              <ul className='list-disc list-inside ml-4 space-y-1'>
                <li>App Type: Consumer</li>
                <li>App Name: SABO Pool Arena</li>
              </ul>

              <p>3. Thêm Facebook Login product</p>
              <p>4. Cấu hình Facebook Login settings:</p>

              <div className='bg-gray-50 p-3 rounded space-y-2'>
                <p className='font-medium'>Valid OAuth Redirect URIs:</p>
                <div className='flex items-center gap-2'>
                  <code className='bg-white px-2 py-1 rounded text-sm flex-1'>
                    {redirectUrl}
                  </code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() =>
                      copyToClipboard(redirectUrl, 'OAuth Redirect URI')
                    }
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>

                <p className='font-medium'>App Domains:</p>
                <div className='flex items-center gap-2'>
                  <code className='bg-white px-2 py-1 rounded text-sm flex-1'>
                    knxevbkkkiadgppxbphh.supabase.co
                  </code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() =>
                      copyToClipboard(
                        'knxevbkkkiadgppxbphh.supabase.co',
                        'App Domain'
                      )
                    }
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>

                <p className='font-medium'>Site URL:</p>
                <div className='flex items-center gap-2'>
                  <code className='bg-white px-2 py-1 rounded text-sm flex-1'>
                    {siteUrl}
                  </code>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(siteUrl, 'Site URL')}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <p>5. Copy App ID và App Secret từ Basic Settings</p>
              <p>6. Thêm App ID và App Secret vào Supabase Dashboard</p>
              <p>7. Chuyển app sang Live mode (nếu cần)</p>
            </div>
          </TabsContent>
        </Tabs>

        <Alert className='mt-4'>
          <AlertDescription>
            <strong>💡 Lưu ý:</strong> Sau khi cấu hình xong, có thể mất vài
            phút để các thay đổi có hiệu lực. Nếu vẫn lỗi, hãy kiểm tra lại các
            URL và thông tin cấu hình.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
