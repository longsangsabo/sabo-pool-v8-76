import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Users, Trophy, Shuffle, Settings } from 'lucide-react';
import { useBracketGeneration } from '@/hooks/useBracketGeneration';
import { useDoubleEliminationBracket } from '@/hooks/useDoubleEliminationBracket';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BracketGeneratorProps {
  tournamentId: string;
  currentParticipants: number;
  maxParticipants: number;
  onBracketGenerated?: () => void;
}

export const BracketGenerator: React.FC<BracketGeneratorProps> = ({
  tournamentId,
  currentParticipants,
  maxParticipants,
  onBracketGenerated,
}) => {
  const [seedingMethod, setSeedingMethod] = useState<
    'elo_ranking' | 'registration_order' | 'random'
  >('elo_ranking');
  const [forceRegenerate, setForceRegenerate] = useState(false);

  const {
    isGenerating,
    isValidating,
    validateTournament,
    generateBracket,
    fetchBracketData,
  } = useBracketGeneration();

  const handleValidation = async () => {
    const result = await validateTournament(tournamentId);

    if (result.valid) {
      toast.success('Giải đấu hợp lệ để tạo bảng đấu!');
    } else {
      toast.error(`Không thể tạo bảng đấu: ${result.reason}`);
    }

    return result;
  };

  const handleGenerate = async () => {
    // First validate
    const validation = await validateTournament(tournamentId);

    if (!validation.valid) {
      toast.error(`Không thể tạo bảng đấu: ${validation.reason}`);
      return;
    }

    // Generate bracket
    const result = await generateBracket(tournamentId, {
      method: seedingMethod,
      forceRegenerate,
    });

    if (result.success) {
      toast.success('Tạo bảng đấu thành công!');
      onBracketGenerated?.();
    } else {
      toast.error('Lỗi tạo bảng đấu');
    }
  };

  const getSeedingMethodName = (method: string) => {
    switch (method) {
      case 'elo_ranking':
        return 'Xếp hạng ELO';
      case 'registration_order':
        return 'Thứ tự đăng ký';
      case 'random':
        return 'Ngẫu nhiên';
      default:
        return method;
    }
  };

  const getBracketSize = (count: number) => {
    return Math.pow(2, Math.ceil(Math.log2(count)));
  };

  const bracketSize = getBracketSize(currentParticipants);
  const byeCount = bracketSize - currentParticipants;

  return (
    <div className='space-y-6'>
      {/* Tournament Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-primary' />
            Tạo Bảng Đấu Tournament
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-primary'>
                {currentParticipants}
              </div>
              <div className='text-sm text-muted-foreground'>
                Người tham gia
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-secondary'>
                {bracketSize}
              </div>
              <div className='text-sm text-muted-foreground'>
                Kích thước bracket
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-muted-foreground'>
                {byeCount}
              </div>
              <div className='text-sm text-muted-foreground'>Bye matches</div>
            </div>
          </div>

          {currentParticipants < 2 && (
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                Cần ít nhất 2 người tham gia để tạo bảng đấu
              </AlertDescription>
            </Alert>
          )}

          {currentParticipants > 64 && (
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                Số lượng người tham gia vượt quá giới hạn tối đa (64 người)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            Cài Đặt Bảng Đấu
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Phương thức xếp hạng</label>
            <Select
              value={seedingMethod}
              onValueChange={(value: any) => setSeedingMethod(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='elo_ranking'>
                  <div className='flex items-center gap-2'>
                    <Trophy className='h-4 w-4' />
                    Xếp hạng ELO (Khuyến nghị)
                  </div>
                </SelectItem>
                <SelectItem value='registration_order'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    Thứ tự đăng ký
                  </div>
                </SelectItem>
                <SelectItem value='random'>
                  <div className='flex items-center gap-2'>
                    <Shuffle className='h-4 w-4' />
                    Ngẫu nhiên
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              {seedingMethod === 'elo_ranking' &&
                'Người chơi có ELO cao hơn sẽ được xếp seed ưu tiên'}
              {seedingMethod === 'registration_order' &&
                'Người đăng ký trước sẽ được seed cao hơn'}
              {seedingMethod === 'random' && 'Thứ tự hoàn toàn ngẫu nhiên'}
            </p>
          </div>

          <Separator />

          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='forceRegenerate'
              checked={forceRegenerate}
              onChange={e => setForceRegenerate(e.target.checked)}
              className='h-4 w-4'
            />
            <label htmlFor='forceRegenerate' className='text-sm'>
              Tạo lại bảng đấu (ghi đè bảng đấu hiện tại)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Generation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông Tin Bảng Đấu</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>Loại bảng đấu:</span>
              <div className='font-medium'>Single Elimination</div>
            </div>
            <div>
              <span className='text-muted-foreground'>Số vòng đấu:</span>
              <div className='font-medium'>{Math.log2(bracketSize)} vòng</div>
            </div>
            <div>
              <span className='text-muted-foreground'>Tổng số trận:</span>
              <div className='font-medium'>{bracketSize - 1} trận</div>
            </div>
            <div>
              <span className='text-muted-foreground'>
                Phương thức seeding:
              </span>
              <div className='font-medium'>
                {getSeedingMethodName(seedingMethod)}
              </div>
            </div>
          </div>

          {byeCount > 0 && (
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                Có {byeCount} người chơi sẽ được bye vòng đầu (tự động vào vòng
                2)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex gap-4'>
        <Button
          onClick={handleValidation}
          variant='outline'
          disabled={isValidating || currentParticipants < 2}
          className='flex-1'
        >
          {isValidating ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
          ) : (
            <AlertTriangle className='h-4 w-4 mr-2' />
          )}
          Kiểm tra hợp lệ
        </Button>

        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating || currentParticipants < 2 || currentParticipants > 64
          }
          className='flex-1'
        >
          {isGenerating ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
          ) : (
            <Trophy className='h-4 w-4 mr-2' />
          )}
          Tạo Bảng Đấu
        </Button>
      </div>
    </div>
  );
};
