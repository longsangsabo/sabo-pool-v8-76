import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManualResultsGeneratorProps {
  tournamentId: string;
  tournamentName: string;
  onResultsGenerated?: () => void;
}

export const ManualResultsGenerator = ({
  tournamentId,
  tournamentName,
  onResultsGenerated,
}: ManualResultsGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerateResults = async () => {
    setIsGenerating(true);
    setLastResult(null);

    try {
      const { data, error } = await (supabase as any).rpc(
        'process_tournament_completion',
        {
          p_tournament_id: tournamentId,
        }
      );

      if (error) {
        throw error;
      }

      setLastResult(data);

      const result = data as any;

      if (result.success) {
        toast({
          title: '✅ Tạo kết quả thành công!',
          description: `Đã tạo kết quả cho ${result.results_created} người tham gia trong giải "${result.tournament_name}"`,
        });
        onResultsGenerated?.();
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Lỗi tạo kết quả',
          description: result.error || 'Có lỗi xảy ra khi tạo kết quả',
        });
      }
    } catch (error: any) {
      console.error('Error generating tournament results:', error);
      toast({
        variant: 'destructive',
        title: '❌ Lỗi hệ thống',
        description: error.message || 'Không thể kết nối với server',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='bg-secondary/50 p-4 rounded-lg border'>
        <h3 className='font-semibold text-foreground mb-2'>
          🔧 Tạo kết quả giải đấu thủ công
        </h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Sử dụng chức năng này khi hệ thống tự động không hoạt động. Chức năng
          sẽ tính toán kết quả dựa trên trận chung kết đã hoàn thành.
        </p>

        <div className='flex items-center gap-3'>
          <Button
            onClick={handleGenerateResults}
            disabled={isGenerating}
            className='flex items-center gap-2'
          >
            {isGenerating ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <CheckCircle className='h-4 w-4' />
            )}
            {isGenerating ? 'Đang tạo kết quả...' : 'Tạo kết quả ngay'}
          </Button>

          <span className='text-sm text-muted-foreground'>
            Giải: <span className='font-medium'>{tournamentName}</span>
          </span>
        </div>
      </div>

      {lastResult && (
        <Alert
          className={
            lastResult.success
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }
        >
          {lastResult.success ? (
            <CheckCircle className='h-4 w-4 text-green-600' />
          ) : (
            <AlertCircle className='h-4 w-4 text-red-600' />
          )}
          <AlertDescription>
            {lastResult.success ? (
              <div className='space-y-2'>
                <p className='font-medium text-green-800'>
                  ✅ {lastResult.message}
                </p>
                <div className='text-sm text-green-700'>
                  <p>
                    • Đã tạo kết quả cho {lastResult.results_created} người tham
                    gia
                  </p>
                  <p>• Vô địch: {lastResult.champion_id}</p>
                  <p>• Á quân: {lastResult.runner_up_id}</p>
                </div>
              </div>
            ) : (
              <p className='text-red-800'>❌ {lastResult.error}</p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
