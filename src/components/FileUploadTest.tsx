import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAvatarUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Check, X } from 'lucide-react';

const FileUploadTest = () => {
  const { user } = useAuth();
  const { uploadAvatar, uploading, progress } = useAvatarUpload(user?.id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadAvatar(selectedFile);
      if (result.error) {
        setUploadResult(`Lỗi: ${result.error}`);
      } else {
        setUploadResult(`Thành công: ${result.url}`);
      }
    } catch (error) {
      setUploadResult(`Lỗi: ${error}`);
    }
  };

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Upload className='h-5 w-5' />
          Test File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-2'>
            Chọn ảnh avatar (tối đa 2MB)
          </label>
          <Input
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        {selectedFile && (
          <div className='text-sm text-gray-600'>
            File đã chọn: {selectedFile.name} (
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}

        {uploading && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span>Đang upload...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className='w-full' />
          </div>
        )}

        {uploadResult && (
          <div
            className={`flex items-start gap-2 p-3 rounded text-sm ${
              uploadResult.startsWith('Lỗi')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {uploadResult.startsWith('Lỗi') ? (
              <X className='h-4 w-4 mt-0.5 flex-shrink-0' />
            ) : (
              <Check className='h-4 w-4 mt-0.5 flex-shrink-0' />
            )}
            <span className='break-all'>{uploadResult}</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className='w-full'
        >
          {uploading ? 'Đang upload...' : 'Upload Avatar'}
        </Button>

        {!user && (
          <div className='text-sm text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-200'>
            ⚠️ Cần đăng nhập để test upload
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadTest;
