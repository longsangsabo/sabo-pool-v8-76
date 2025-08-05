import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Trophy, Calculator, Target, Star } from 'lucide-react';
import {
  getAllRanks,
  getRankDisplayName,
  type SaboRank,
} from '@/utils/saboHandicap';

interface SaboInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaboInfoDialog: React.FC<SaboInfoDialogProps> = ({ isOpen, onClose }) => {
  const ranks = getAllRanks();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5 text-blue-600' />
            Hệ thống SABO Professional
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Introduction */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Info className='w-4 h-4 text-blue-600' />
              <h3 className='font-semibold text-lg'>Giới thiệu</h3>
            </div>
            <div className='text-sm text-muted-foreground leading-relaxed'>
              SABO Professional System là hệ thống thách đấu chuyên nghiệp với
              handicap tự động, giúp tạo ra các trận đấu cân bằng và công bằng
              giữa các người chơi có trình độ khác nhau.
            </div>
          </div>

          <Separator />

          {/* Rank Table */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Star className='w-4 h-4 text-amber-600' />
              <h3 className='font-semibold text-lg'>Bảng xếp hạng SABO</h3>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              {ranks.map(rank => (
                <div
                  key={rank}
                  className='flex items-center justify-between p-2 bg-muted/50 rounded-lg'
                >
                  <Badge variant='outline' className='font-mono'>
                    {rank}
                  </Badge>
                  <span className='text-sm'>{getRankDisplayName(rank)}</span>
                </div>
              ))}
            </div>
            <div className='text-xs text-muted-foreground'>
              Hạng tăng dần từ K (mới bắt đầu) đến E+ (đại sư)
            </div>
          </div>

          <Separator />

          {/* Challenge Rules */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Target className='w-4 h-4 text-green-600' />
              <h3 className='font-semibold text-lg'>Quy tắc thách đấu</h3>
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex items-start gap-2'>
                <span className='font-medium text-green-600'>•</span>
                <span>
                  Chỉ được thách đấu trong phạm vi{' '}
                  <strong>±2 hạng chính</strong> (tương đương ±4 hạng phụ)
                </span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='font-medium text-green-600'>•</span>
                <span>
                  Ví dụ: Hạng H có thể thách đấu từ Hạng F+ đến Hạng I+
                </span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='font-medium text-green-600'>•</span>
                <span>
                  Hệ thống sẽ tự động kiểm tra tính hợp lệ của thách đấu
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Handicap Calculation */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Calculator className='w-4 h-4 text-purple-600' />
              <h3 className='font-semibold text-lg'>Cách tính handicap</h3>
            </div>
            <div className='space-y-3 text-sm'>
              <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                <div className='font-medium text-blue-800 mb-2'>
                  Công thức cơ bản:
                </div>
                <div className='text-blue-700'>
                  Handicap = min(Chênh lệch hạng, Mức cược ÷ (200 - Chênh lệch ×
                  25))
                </div>
              </div>

              <div className='space-y-2'>
                <div className='font-medium'>Các trường hợp:</div>
                <div className='space-y-1'>
                  <div>
                    <strong>Cùng hạng:</strong> Không có handicap
                  </div>
                  <div>
                    <strong>Đối thủ hạng cao hơn:</strong> Bạn được cộng bàn
                  </div>
                  <div>
                    <strong>Bạn hạng cao hơn:</strong> Đối thủ được cộng bàn
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Examples */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-lg'>Ví dụ cụ thể</h3>
            <div className='grid gap-3'>
              <div className='p-3 bg-green-50 rounded-lg border border-green-200'>
                <div className='font-medium text-green-800 mb-1'>
                  Trường hợp 1: Bạn được handicap
                </div>
                <div className='text-sm text-green-700'>
                  Bạn hạng I (300 điểm), thách đấu hạng G+ (500 điểm)
                  <br />
                  Chênh lệch: 2 hạng → Bạn được cộng 2 bàn
                </div>
              </div>

              <div className='p-3 bg-orange-50 rounded-lg border border-orange-200'>
                <div className='font-medium text-orange-800 mb-1'>
                  Trường hợp 2: Đối thủ được handicap
                </div>
                <div className='text-sm text-orange-700'>
                  Bạn hạng G (400 điểm), thách đấu hạng H+ (300 điểm)
                  <br />
                  Chênh lệch: 1 hạng → Đối thủ được cộng 1 bàn
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Benefits */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-lg'>Lợi ích của hệ thống SABO</h3>
            <div className='grid md:grid-cols-2 gap-3 text-sm'>
              <div className='space-y-2'>
                <div className='font-medium text-blue-600'>Cho người chơi:</div>
                <ul className='space-y-1 text-muted-foreground'>
                  <li>• Trận đấu cân bằng và thú vị hơn</li>
                  <li>• Cơ hội chiến thắng công bằng</li>
                  <li>• Thúc đẩy việc thách đấu với người khác hạng</li>
                  <li>• Nâng cao trình độ qua thực chiến</li>
                </ul>
              </div>
              <div className='space-y-2'>
                <div className='font-medium text-green-600'>Cho hệ thống:</div>
                <ul className='space-y-1 text-muted-foreground'>
                  <li>• Tăng số lượng thách đấu</li>
                  <li>• Giảm chênh lệch trình độ</li>
                  <li>• Tạo môi trường cạnh tranh lành mạnh</li>
                  <li>• Nâng cao chất lượng giải đấu</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaboInfoDialog;
