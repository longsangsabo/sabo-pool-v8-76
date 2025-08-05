import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { QRCodeScanner } from '../components/QRCodeScanner';
import { useQRSystem } from '../hooks/useQRSystem';
import { useAuth } from '../hooks/useAuth';
import { useClubs } from '../hooks/useClubs';
import { TableQRCode, QuickMatch, PlayerRanking } from '../types/qr';
import { toast } from '../hooks/use-toast';
import {
  QrCode,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const QRSystemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [scannedTable, setScannedTable] = useState<TableQRCode | null>(null);
  const [userMatches, setUserMatches] = useState<QuickMatch[]>([]);
  const [playerRankings, setPlayerRankings] = useState<PlayerRanking[]>([]);
  const [selectedRank, setSelectedRank] = useState<string>('all');

  const {
    qrCodes,
    scanHistory,
    loading,
    error,
    fetchQRCodes,
    fetchScanHistory,
    createQRCode,
    updateQRCode,
    deleteQRCode,
    scanQRCode,
    generateQRImageUrl,
  } = useQRSystem();

  const { user } = useAuth();
  const { clubs } = useClubs();

  useEffect(() => {
    if (user) {
      loadUserMatches();
      loadPlayerRankings();
    }
  }, [user]);

  const loadUserMatches = async () => {
    // Mock data for now since getUserQuickMatches doesn't exist
    setUserMatches([]);
  };

  const loadPlayerRankings = async () => {
    // Mock data for now since getPlayerRankings doesn't exist
    setPlayerRankings([]);
  };

  const handleTableScanned = (table: TableQRCode) => {
    setScannedTable(table);
    setActiveTab('matches');
  };

  const handleCreateTableQR = async (
    clubId: string,
    tableNumber: number,
    tableName: string
  ) => {
    try {
      const qrData = {
        type: 'table',
        club_id: clubId,
        table_number: tableNumber,
        table_name: tableName,
        data: JSON.stringify({ clubId, tableNumber, tableName }),
      };

      await createQRCode(qrData);
      toast({
        title: 'Tạo QR code thành công',
        description: `QR code cho bàn ${tableName} đã được tạo`,
      });
    } catch (error) {
      console.error('Error creating QR code:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo QR code',
      });
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGameTypeLabel = (gameType: string) => {
    switch (gameType) {
      case '8_ball':
        return '8 Ball';
      case '9_ball':
        return '9 Ball';
      case 'song_to':
        return 'Song Tô';
      default:
        return gameType;
    }
  };

  const filteredRankings =
    selectedRank === 'all'
      ? playerRankings
      : playerRankings.filter(p => p.rank_code === selectedRank);

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex items-center gap-3 mb-6'>
        <QrCode className='w-8 h-8 text-blue-600' />
        <h1 className='text-3xl font-bold'>Hệ thống QR Code & Quick Matches</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='scanner'>Quét QR</TabsTrigger>
          <TabsTrigger value='matches'>Trận đấu</TabsTrigger>
          <TabsTrigger value='rankings'>Xếp hạng</TabsTrigger>
          <TabsTrigger value='management'>Quản lý</TabsTrigger>
        </TabsList>

        {/* QR Scanner Tab */}
        <TabsContent value='scanner' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Quét QR Code</CardTitle>
              <CardDescription>
                Quét QR code của bàn để tạo trận đấu nhanh
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRCodeScanner mode='table' onTableScanned={handleTableScanned} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value='matches' className='space-y-6'>
          {/* Current Table Info */}
          {scannedTable && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trophy className='w-5 h-5' />
                  Bàn {scannedTable.table_number} - {scannedTable.table_name}
                </CardTitle>
                <CardDescription>{scannedTable.club?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex gap-2'>
                  <Button onClick={() => setActiveTab('scanner')}>
                    Quét bàn khác
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => setScannedTable(null)}
                  >
                    Xóa bàn hiện tại
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Matches */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='w-5 h-5' />
                Trận đấu của tôi
              </CardTitle>
              <CardDescription>
                Danh sách các trận đấu nhanh đã tham gia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userMatches.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Clock className='w-12 h-12 mx-auto mb-4' />
                  <p>Chưa có trận đấu nào</p>
                </div>
              ) : (
                <div className='space-y-3'>{/* Render matches */}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value='rankings' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Trophy className='w-5 h-5' />
                Xếp hạng người chơi
              </CardTitle>
              <CardDescription>
                Hệ thống phân hạng kỹ thuật SABO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8 text-gray-500'>
                <Trophy className='w-12 h-12 mx-auto mb-4' />
                <p>Chưa có dữ liệu xếp hạng</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value='management' className='space-y-6'>
          {clubs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Quản lý QR Code bàn</CardTitle>
                <CardDescription>
                  Tạo và quản lý QR code cho các bàn tại CLB của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {clubs.map(club => (
                    <div key={club.id} className='border rounded-lg p-4'>
                      <h3 className='font-medium mb-2'>{club.name}</h3>
                      <p className='text-sm text-gray-600 mb-3'>
                        {club.address}
                      </p>

                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <input
                            type='number'
                            placeholder='Số bàn'
                            className='w-20 p-2 border rounded'
                            id={`table-${club.id}`}
                          />
                          <input
                            type='text'
                            placeholder='Tên bàn (VD: Bàn 1)'
                            className='flex-1 p-2 border rounded'
                            id={`name-${club.id}`}
                          />
                          <Button
                            onClick={() => {
                              const tableNumber = (
                                document.getElementById(
                                  `table-${club.id}`
                                ) as HTMLInputElement
                              )?.value;
                              const tableName = (
                                document.getElementById(
                                  `name-${club.id}`
                                ) as HTMLInputElement
                              )?.value;
                              if (tableNumber && tableName) {
                                handleCreateTableQR(
                                  club.id,
                                  parseInt(tableNumber),
                                  tableName
                                );
                              }
                            }}
                          >
                            Tạo QR
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='p-6 text-center'>
                <p className='text-gray-500'>Bạn chưa có CLB nào để quản lý</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
