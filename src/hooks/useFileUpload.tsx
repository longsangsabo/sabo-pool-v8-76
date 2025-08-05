import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

interface UploadResult {
  url?: string;
  path?: string;
  error?: string;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File, options: UploadOptions): string | null => {
    // Check file size
    const maxSizeBytes = (options.maxSize || 5) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File quá lớn. Kích thước tối đa: ${options.maxSize || 5}MB`;
    }

    // Check file type
    if (options.allowedTypes?.length) {
      const fileType = file.type;
      const isAllowed = options.allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        }
        return fileType === type;
      });

      if (!isAllowed) {
        return `Loại file không được hỗ trợ. Chỉ chấp nhận: ${options.allowedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const uploadFile = async (
    file: File,
    options: UploadOptions,
    userId?: string
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);

    try {
      // Validate file
      const validationError = validateFile(file, options);
      if (validationError) {
        toast.error(validationError);
        return { error: validationError };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}_${randomStr}.${fileExt}`;

      // Construct file path
      let filePath = fileName;
      if (options.folder) {
        filePath = `${options.folder}/${fileName}`;
      }
      if (userId) {
        filePath = `${userId}/${filePath}`;
      }

      console.log(
        `Uploading file to bucket: ${options.bucket}, path: ${filePath}`
      );

      // Upload file
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error(`Lỗi upload: ${error.message}`);
        return { error: error.message };
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      setProgress(100);
      toast.success('Upload thành công');

      return {
        url: urlData.publicUrl,
        path: filePath,
      };
    } catch (error) {
      console.error('Upload exception:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const deleteFile = async (
    bucket: string,
    filePath: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        toast.error(`Lỗi xóa file: ${error.message}`);
        return false;
      }

      toast.success('Xóa file thành công');
      return true;
    } catch (error) {
      console.error('Delete exception:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Delete failed: ${errorMessage}`);
    }
  };

  return {
    uploading,
    progress,
    uploadFile,
    deleteFile,
  };
};

// Pre-configured hooks for common upload scenarios
export const useAvatarUpload = (userId?: string) => {
  const { uploadFile, uploading, progress } = useFileUpload();

  const uploadAvatar = (file: File) => {
    return uploadFile(
      file,
      {
        bucket: 'avatars',
        maxSize: 2, // 2MB
        allowedTypes: ['image/*'],
      },
      userId
    );
  };

  return {
    uploadAvatar,
    uploading,
    progress,
  };
};

export const useDocumentUpload = (userId?: string) => {
  const { uploadFile, uploading, progress } = useFileUpload();

  const uploadDocument = (file: File) => {
    return uploadFile(
      file,
      {
        bucket: 'documents',
        folder: 'user-documents',
        maxSize: 10, // 10MB
        allowedTypes: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      },
      userId
    );
  };

  return {
    uploadDocument,
    uploading,
    progress,
  };
};
