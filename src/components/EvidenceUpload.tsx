import { useState, useCallback } from 'react';
import { Upload, X, FileImage, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EvidenceFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface EvidenceUploadProps {
  files: EvidenceFile[];
  onFilesChange: (files: EvidenceFile[]) => void;
  maxFiles?: number;
  userId?: string;
  disabled?: boolean;
}

const EvidenceUpload = ({
  files,
  onFilesChange,
  maxFiles = 5,
  userId,
  disabled = false,
}: EvidenceUploadProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const { uploadFile, uploading, progress } = useFileUpload();

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      await handleFiles(droppedFiles);
    },
    [disabled]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const selectedFiles = Array.from(e.target.files || []);
      await handleFiles(selectedFiles);

      // Reset input
      e.target.value = '';
    },
    [disabled]
  );

  const handleFiles = async (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Chỉ được upload tối đa ${maxFiles} file`);
      return;
    }

    const uploadPromises = newFiles.map(async file => {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `File ${file.name} không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, PDF`
        );
        return null;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn. Kích thước tối đa: 5MB`);
        return null;
      }

      try {
        const result = await uploadFile(
          file,
          {
            bucket: 'rank-evidence',
            folder: 'evidence',
            maxSize: 5,
            allowedTypes: ['image/*', 'application/pdf'],
          },
          userId
        );

        if (result.url && result.path) {
          return {
            id: result.path,
            name: file.name,
            url: result.url,
            size: file.size,
            type: file.type,
          };
        }
        return null;
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Lỗi upload file ${file.name}`);
        return null;
      }
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    const validFiles = uploadedFiles.filter(
      (file): file is EvidenceFile => file !== null
    );

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const removeFile = (fileId: string) => {
    if (disabled) return;

    const updatedFiles = files.filter(file => file.id !== fileId);
    onFilesChange(updatedFiles);
    toast.success('Đã xóa file');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <FileImage className='w-5 h-5 text-blue-500' />;
    }
    if (type === 'application/pdf') {
      return <FileText className='w-5 h-5 text-red-500' />;
    }
    return <FileText className='w-5 h-5 text-gray-500' />;
  };

  const canShowPreview = (type: string) => {
    return type.startsWith('image/');
  };

  return (
    <div className='space-y-4'>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={e => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <CardContent className='p-8 text-center'>
          <Upload className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-lg font-medium mb-2'>
            Kéo thả file hoặc click để chọn
          </p>
          <p className='text-sm text-muted-foreground mb-4'>
            Hỗ trợ: JPG, PNG, PDF. Tối đa {maxFiles} file, mỗi file tối đa 5MB
          </p>
          <p className='text-xs text-muted-foreground mb-4'>
            Ví dụ: Lịch sử tham gia giải đấu, bảng xếp hạng, chứng chỉ...
          </p>
          <input
            type='file'
            multiple
            accept='image/*,.pdf'
            onChange={handleFileSelect}
            className='hidden'
            id='evidence-upload'
            disabled={disabled}
          />
          <Button
            asChild
            variant='outline'
            disabled={disabled || uploading || files.length >= maxFiles}
          >
            <label htmlFor='evidence-upload' className='cursor-pointer'>
              Chọn file ({files.length}/{maxFiles})
            </label>
          </Button>

          {uploading && (
            <div className='mt-4'>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-primary h-2 rounded-full transition-all duration-300'
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className='text-sm text-muted-foreground mt-2'>
                Đang upload... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className='space-y-2'>
          <h4 className='font-medium text-sm'>
            File đã upload ({files.length})
          </h4>
          {files.map(file => (
            <Card key={file.id} className='p-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3 flex-1 min-w-0'>
                  {getFileIcon(file.type)}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{file.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  {canShowPreview(file.type) && (
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => {
                        // Get proper image URL for preview
                        const imageUrl = file.url.startsWith('http')
                          ? file.url
                          : supabase.storage
                              .from('rank-evidence')
                              .getPublicUrl(file.url).data.publicUrl;
                        setPreviewing(imageUrl);
                      }}
                    >
                      <Eye className='w-4 h-4' />
                    </Button>
                  )}

                  {!disabled && (
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => removeFile(file.id)}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewing && (
        <div
          className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'
          onClick={() => setPreviewing(null)}
        >
          <div className='relative max-w-4xl max-h-[90vh]'>
            <Button
              className='absolute -top-12 right-0 text-white hover:text-gray-300'
              variant='ghost'
              size='sm'
              onClick={() => setPreviewing(null)}
            >
              <X className='w-6 h-6' />
            </Button>
            <img
              src={previewing}
              alt='Preview'
              className='max-w-full max-h-full object-contain rounded-lg'
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceUpload;
