import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClubProfile {
  id: string;
  club_name: string;
  address: string;
  verification_status: string;
}

interface EvidenceFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

const RankRegistration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRank, setSelectedRank] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const ranks = [
    { value: '1', label: 'Hạng K' },
    { value: '2', label: 'Hạng K+' },
    { value: '3', label: 'Hạng I' },
    { value: '4', label: 'Hạng I+' },
    { value: '5', label: 'Hạng H' },
    { value: '6', label: 'Hạng H+' },
    { value: '7', label: 'Hạng G' },
    { value: '8', label: 'Hạng G+' },
    { value: '9', label: 'Hạng F' },
    { value: '10', label: 'Hạng F+' },
    { value: '11', label: 'Hạng E' },
    { value: '12', label: 'Hạng E+' },
  ];

  const fetchClubs = async () => {
    try {
      setIsLoadingClubs(true);
      console.log('Fetching clubs...');

      // First try to get approved clubs
      const { data: approvedClubs, error: approvedError } = await supabase
        .from('clubs')
        .select('id, name, address, status')
        .eq('status', 'active')
        .limit(10);

      if (approvedError) {
        console.error('Error fetching approved clubs:', approvedError);
        throw approvedError;
      }

      console.log('Approved clubs found:', approvedClubs?.length || 0);

      // If no approved clubs, try to get all active clubs as fallback
      if (!approvedClubs || approvedClubs.length === 0) {
        console.log('No approved clubs found, trying all active clubs...');

        const { data: allClubs, error: allError } = await supabase
          .from('clubs')
          .select('id, name, address, status')
          .eq('status', 'active')
          .limit(10);

        if (allError) {
          console.error('Error fetching all clubs:', allError);
          throw allError;
        }

        console.log('All active clubs found:', allClubs?.length || 0);
        setClubs((allClubs as any) || []);
      } else {
        setClubs(approvedClubs as any);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách câu lạc bộ. Vui lòng thử lại.',
        variant: 'destructive',
      });
      setClubs([]);
    } finally {
      setIsLoadingClubs(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedFiles: EvidenceFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('rank-evidence')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        const { data: publicUrl } = supabase.storage
          .from('rank-evidence')
          .getPublicUrl(fileName);

        uploadedFiles.push({
          id: fileName,
          name: file.name,
          url: publicUrl.publicUrl,
          size: file.size,
          type: file.type,
        });
      }

      setEvidenceFiles(prev => [...prev, ...uploadedFiles]);
      toast({
        title: 'Thành công',
        description: `Đã tải lên ${uploadedFiles.length} file minh chứng.`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lên file. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setEvidenceFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Lỗi',
        description: 'Bạn cần đăng nhập để đăng ký xác nhận hạng.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedRank || !selectedClub) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn hạng và câu lạc bộ.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from('rank_requests').insert({
        user_id: user.id,
        requested_rank: selectedRank, // Keep as string to match DB schema
        club_id: selectedClub,
        evidence_files: evidenceFiles as any, // Cast to Json type
        status: 'pending',
      });

      if (error) {
        console.error('Error submitting rank request:', error);
        throw error;
      }

      toast({
        title: 'Thành công',
        description:
          'Đã gửi yêu cầu xác nhận hạng. Câu lạc bộ sẽ xem xét và phản hồi sớm.',
      });

      // Reset form
      setSelectedRank('');
      setSelectedClub('');
      setEvidenceFiles([]);
    } catch (error) {
      console.error('Error submitting rank request:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi yêu cầu. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle>Đăng ký xác nhận hạng</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Bạn cần đăng nhập để sử dụng tính năng này.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Đăng ký xác nhận hạng</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Rank Selection */}
          <div className='space-y-2'>
            <Label htmlFor='rank'>Hạng muốn xác nhận *</Label>
            <Select value={selectedRank} onValueChange={setSelectedRank}>
              <SelectTrigger>
                <SelectValue placeholder='Chọn hạng' />
              </SelectTrigger>
              <SelectContent>
                {ranks.map(rank => (
                  <SelectItem key={rank.value} value={rank.value}>
                    {rank.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Club Selection */}
          <div className='space-y-2'>
            <Label htmlFor='club'>Câu lạc bộ xác nhận *</Label>
            <Select
              value={selectedClub}
              onValueChange={setSelectedClub}
              disabled={isLoadingClubs}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingClubs ? 'Đang tải...' : 'Chọn câu lạc bộ'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {clubs.length === 0 && !isLoadingClubs && (
                  <SelectItem value='' disabled>
                    Không có câu lạc bộ nào
                  </SelectItem>
                )}
                {clubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>
                    {(club as any).name} - {club.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clubs.length === 0 && !isLoadingClubs && (
              <p className='text-sm text-muted-foreground'>
                Chưa có câu lạc bộ nào có thể xác nhận hạng. Vui lòng liên hệ
                admin.
              </p>
            )}
          </div>

          {/* Evidence Upload */}
          <div className='space-y-2'>
            <Label htmlFor='evidence'>Minh chứng (tùy chọn)</Label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
              <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
              <div className='space-y-2'>
                <p className='text-sm text-gray-600'>
                  Tải lên hình ảnh, video hoặc tài liệu chứng minh trình độ
                </p>
                <input
                  type='file'
                  multiple
                  accept='image/*,video/*,.pdf,.doc,.docx'
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className='hidden'
                  id='evidence-upload'
                />
                <label
                  htmlFor='evidence-upload'
                  className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50'
                >
                  {isUploading ? 'Đang tải...' : 'Chọn file'}
                </label>
              </div>
            </div>
          </div>

          {/* Evidence Files List */}
          {evidenceFiles.length > 0 && (
            <div className='space-y-2'>
              <Label>File đã tải lên</Label>
              <div className='space-y-2'>
                {evidenceFiles.map(file => (
                  <div
                    key={file.id}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                  >
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>{file.name}</p>
                      <p className='text-xs text-gray-500'>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeFile(file.id)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type='submit'
            className='w-full'
            disabled={
              isLoading || !selectedRank || !selectedClub || isLoadingClubs
            }
          >
            {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu xác nhận'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RankRegistration;
