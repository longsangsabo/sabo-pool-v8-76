import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, Database, RefreshCw, AlertTriangle, 
  CheckCircle, Clock, Activity, BarChart3 
} from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { useAdvancedCache } from '@/hooks/useAdvancedCache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const AdvancedOfflineStatus: React.FC = () => {
  const { isOfflineReady, syncCoordinator, queueManager, serviceWorker } = useOffline();
  const cache = useAdvancedCache('main');
  const [syncStats, setSyncStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    const updateStats = () => {
      setSyncStats(queueManager.getStats());
      setCacheStats(cache.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [queueManager, cache]);

  const getStatusColor = () => {
    if (!isOfflineReady) return 'destructive';
    if (syncStats?.failed > 0) return 'destructive';
    if (syncStats?.total > 0) return 'warning';
    return 'success';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Trạng thái Offline nâng cao
          <Badge variant={getStatusColor() === 'success' ? 'default' : 'destructive'}>
            {isOfflineReady ? 'Sẵn sàng' : 'Không khả dụng'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sync">Đồng bộ</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="storage">Lưu trữ</TabsTrigger>
            <TabsTrigger value="network">Mạng</TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Chờ đồng bộ</p>
                      <p className="text-2xl font-bold">{syncStats?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Đang xử lý</p>
                      <p className="text-2xl font-bold">{syncStats?.processing || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Hoàn thành</p>
                      <p className="text-2xl font-bold">{syncStats?.completed || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Thất bại</p>
                      <p className="text-2xl font-bold">{syncStats?.failed || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {syncStats?.byPriority && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Phân bố theo độ ưu tiên</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Badge variant="destructive" className="justify-center">
                    Quan trọng: {syncStats.byPriority.critical || 0}
                  </Badge>
                  <Badge variant="secondary" className="justify-center">
                    Bình thường: {syncStats.byPriority.normal || 0}
                  </Badge>
                  <Badge variant="outline" className="justify-center">
                    Thấp: {syncStats.byPriority.low || 0}
                  </Badge>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Tổng entries</p>
                      <p className="text-2xl font-bold">{cacheStats?.totalEntries || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Còn hiệu lực</p>
                      <p className="text-2xl font-bold">{cacheStats?.validEntries || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Hết hạn</p>
                      <p className="text-2xl font-bold">{cacheStats?.expiredEntries || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {cacheStats && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Hiệu suất Cache</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Tỷ lệ truy cập trung bình</span>
                    <span>{cacheStats.averageAccessCount?.toFixed(1) || 0}</span>
                  </div>
                  {cacheStats.oldestEntry && (
                    <div className="flex justify-between text-sm">
                      <span>Entry cũ nhất</span>
                      <span>{new Date(cacheStats.oldestEntry).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <h3 className="font-medium">IndexedDB Storage</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Dung lượng đã sử dụng</p>
                    <p className="text-lg font-semibold">~{cache.cacheSize * 2}KB</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Service Worker</p>
                    <p className="text-lg font-semibold">
                      {serviceWorker.isRegistered ? 'Đã kích hoạt' : 'Không khả dụng'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Trạng thái kết nối</p>
                      <p className="text-lg font-semibold">
                        {navigator.onLine ? 'Đã kết nối' : 'Ngoại tuyến'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Loại kết nối</p>
                      <p className="text-lg font-semibold">
                        {(navigator as any)?.connection?.effectiveType || 'Không xác định'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};