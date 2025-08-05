import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { useQRSystem } from '../hooks/useQRSystem';
import { useAuth } from '../hooks/useAuth';
import { TableQRCode, CreateQuickMatchRequest } from '../types/qr';
import { toast } from '../hooks/use-toast';

interface QRCodeScannerProps {
  onTableScanned?: (table: TableQRCode) => void;
  onPlayerScanned?: (playerId: string) => void;
  mode: 'table' | 'player';
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onTableScanned,
  onPlayerScanned,
  mode,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannedTable, setScannedTable] = useState<TableQRCode | null>(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [gameType, setGameType] = useState<'8_ball' | '9_ball' | 'song_to'>(
    '8_ball'
  );
  const [betPoints, setBetPoints] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { scanTableQR, scanPlayerQR, createQuickMatch, loading, error } =
    useQRSystem();
  const { user } = useAuth();

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: 'Lỗi camera',
        description:
          'Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.',
        variant: 'destructive',
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Scan QR code
  const scanQRCode = async (qrData: string) => {
    setScannedData(qrData);
    stopCamera();

    try {
      if (mode === 'table') {
        const table = await scanTableQR(qrData);
        if (table) {
          setScannedTable(table);
          onTableScanned?.(table);
        }
      } else {
        const playerQR = await scanPlayerQR(qrData);
        if (playerQR) {
          setSelectedPlayer(playerQR.user_id);
          onPlayerScanned?.(playerQR.user_id);
        }
      }
    } catch (err) {
      toast({
        title: 'Lỗi quét QR',
        description: 'QR code không hợp lệ hoặc đã hết hạn.',
        variant: 'destructive',
      });
    }
  };

  // Create quick match
  const handleCreateMatch = async () => {
    if (!scannedTable || !selectedPlayer || !user) return;

    const request: CreateQuickMatchRequest = {
      player1_id: user.id,
      player2_id: selectedPlayer,
      table_id: scannedTable.id,
      bet_amount: betPoints,
    };

    const match = await createQuickMatch(request);
    if (match) {
      toast({
        title: 'Tạo trận đấu thành công',
        description: `Trận đấu ${gameType} đã được tạo tại bàn ${scannedTable.table_name}`,
      });
      setShowMatchForm(false);
      setScannedTable(null);
      setSelectedPlayer(null);
    }
  };

  // Manual QR input
  const handleManualInput = async (qrCode: string) => {
    await scanQRCode(qrCode);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-red-600'>Lỗi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-gray-600'>{error}</p>
          <Button onClick={() => window.location.reload()} className='mt-4'>
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Camera View */}
      {isScanning && (
        <Card>
          <CardHeader>
            <CardTitle>Quét QR Code</CardTitle>
            <CardDescription>
              Đặt QR code vào khung hình để quét
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='relative'>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className='w-full h-64 object-cover rounded-lg'
              />
              <div className='absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg pointer-events-none' />
            </div>
            <Button
              onClick={stopCamera}
              variant='outline'
              className='mt-4 w-full'
            >
              Dừng quét
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manual Input */}
      {!isScanning && !scannedData && (
        <Card>
          <CardHeader>
            <CardTitle>Nhập QR Code thủ công</CardTitle>
            <CardDescription>
              Hoặc nhập mã QR code nếu không thể quét
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type='text'
              placeholder='Nhập QR code...'
              className='w-full p-2 border rounded-md'
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget as HTMLInputElement;
                  handleManualInput(input.value);
                }
              }}
            />
            <Button onClick={startCamera} className='mt-4 w-full'>
              Bật camera quét QR
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scanned Table Info */}
      {scannedTable && mode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Badge variant='secondary'>Bàn {scannedTable.table_number}</Badge>
              {scannedTable.table_name}
            </CardTitle>
            <CardDescription>{scannedTable.club?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <p>
                <strong>Mã QR:</strong> {scannedTable.qr_code}
              </p>
              <p>
                <strong>Trạng thái:</strong>
                <Badge
                  variant={scannedTable.is_active ? 'default' : 'destructive'}
                  className='ml-2'
                >
                  {scannedTable.is_active ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
              </p>
            </div>
            <div className='flex gap-2 mt-4'>
              <Button
                onClick={() => setShowMatchForm(true)}
                disabled={!scannedTable.is_active}
              >
                Tạo trận đấu
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setScannedTable(null);
                  setScannedData(null);
                }}
              >
                Quét lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Match Form */}
      {showMatchForm && scannedTable && (
        <Card>
          <CardHeader>
            <CardTitle>Tạo trận đấu nhanh</CardTitle>
            <CardDescription>
              Bàn {scannedTable.table_number} - {scannedTable.table_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>
                  Loại game
                </label>
                <select
                  value={gameType}
                  onChange={e => setGameType(e.target.value as any)}
                  className='w-full p-2 border rounded-md'
                >
                  <option value='8_ball'>8 Ball</option>
                  <option value='9_ball'>9 Ball</option>
                  <option value='song_to'>Song Tô</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>
                  Điểm cược (tùy chọn)
                </label>
                <input
                  type='number'
                  value={betPoints}
                  onChange={e => setBetPoints(Number(e.target.value))}
                  placeholder='0'
                  className='w-full p-2 border rounded-md'
                />
              </div>

              <div className='flex gap-2'>
                <Button
                  onClick={handleCreateMatch}
                  disabled={loading}
                  className='flex-1'
                >
                  {loading ? 'Đang tạo...' : 'Tạo trận đấu'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setShowMatchForm(false)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canvas for QR detection (hidden) */}
      <canvas ref={canvasRef} className='hidden' />
    </div>
  );
};
