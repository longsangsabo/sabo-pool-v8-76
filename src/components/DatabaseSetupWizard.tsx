import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Settings,
} from 'lucide-react';
import {
  checkCurrentDatabaseStatus,
  DatabaseStatus,
} from '@/utils/databaseStatusChecker';
import {
  DATABASE_SETUP_GUIDE,
  getSetupRecommendation,
} from '@/utils/databaseSetupGuide';

const DatabaseSetupWizard: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');

  const checkDatabase = async () => {
    setLoading(true);
    try {
      const dbStatus = await checkCurrentDatabaseStatus();
      setStatus(dbStatus);

      const recommendation = getSetupRecommendation(
        dbStatus.hasData,
        dbStatus.isAccessible
      );
      setSelectedOption(recommendation);
    } catch (error) {
      console.error('Database check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className='h-4 w-4 text-green-500' />
    ) : (
      <XCircle className='h-4 w-4 text-red-500' />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant='default' className='bg-green-100 text-green-800'>
        Connected
      </Badge>
    ) : (
      <Badge variant='destructive'>Error</Badge>
    );
  };

  const renderDatabaseStatus = () => {
    if (!status) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Database className='h-5 w-5' />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='p-3 border rounded-lg'>
              <div className='text-sm font-medium text-gray-600'>
                Project ID
              </div>
              <div className='text-lg font-bold'>{status.projectId}</div>
            </div>
            <div className='p-3 border rounded-lg'>
              <div className='text-sm font-medium text-gray-600'>
                Connection
              </div>
              <div className='flex items-center gap-2'>
                {getStatusIcon(status.isAccessible)}
                {getStatusBadge(status.isAccessible)}
              </div>
            </div>
            <div className='p-3 border rounded-lg'>
              <div className='text-sm font-medium text-gray-600'>Tables</div>
              <div className='text-lg font-bold'>{status.tableCount}</div>
            </div>
            <div className='p-3 border rounded-lg'>
              <div className='text-sm font-medium text-gray-600'>Users</div>
              <div className='text-lg font-bold'>{status.userCount}</div>
            </div>
          </div>

          {status.hasData && (
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                Database có dữ liệu hiện tại. Hãy cẩn thận khi thay đổi.
              </AlertDescription>
            </Alert>
          )}

          {status.errors.length > 0 && (
            <Alert variant='destructive'>
              <XCircle className='h-4 w-4' />
              <AlertDescription>
                <div className='space-y-1'>
                  {status.errors.map((error, index) => (
                    <div key={index} className='text-sm'>
                      {error}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSetupOptions = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lựa Chọn Xử Lý Database</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedOption} onValueChange={setSelectedOption}>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='useExisting'>Sử dụng Hiện Tại</TabsTrigger>
              <TabsTrigger value='createNew'>Tạo Mới</TabsTrigger>
              <TabsTrigger value='backupExisting'>Backup & Restore</TabsTrigger>
            </TabsList>

            {Object.entries(DATABASE_SETUP_GUIDE.options).map(
              ([key, option]) => (
                <TabsContent key={key} value={key} className='space-y-4'>
                  <div className='p-4 border rounded-lg'>
                    <h3 className='text-lg font-semibold mb-2'>
                      {option.title}
                    </h3>
                    <p className='text-gray-600 mb-4'>{option.description}</p>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <div>
                        <h4 className='font-medium text-green-600 mb-2'>
                          Ưu điểm:
                        </h4>
                        <ul className='space-y-1'>
                          {option.pros.map((pro, index) => (
                            <li
                              key={index}
                              className='text-sm flex items-center gap-2'
                            >
                              <CheckCircle className='h-3 w-3 text-green-500' />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className='font-medium text-red-600 mb-2'>
                          Nhược điểm:
                        </h4>
                        <ul className='space-y-1'>
                          {option.cons.map((con, index) => (
                            <li
                              key={index}
                              className='text-sm flex items-center gap-2'
                            >
                              <XCircle className='h-3 w-3 text-red-500' />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className='font-medium mb-2'>Các bước thực hiện:</h4>
                      <ol className='list-decimal list-inside space-y-1'>
                        {option.steps.map((step, index) => (
                          <li key={index} className='text-sm'>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className='mt-4 flex gap-2'>
                      <Button variant='default'>
                        {key === 'useExisting' && (
                          <Settings className='h-4 w-4 mr-2' />
                        )}
                        {key === 'createNew' && (
                          <Plus className='h-4 w-4 mr-2' />
                        )}
                        {key === 'backupExisting' && (
                          <Download className='h-4 w-4 mr-2' />
                        )}
                        Thực hiện
                      </Button>
                      <Button
                        variant='outline'
                        onClick={checkDatabase}
                        disabled={loading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                        />
                        Kiểm tra lại
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )
            )}
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Database Setup Wizard</h1>
        <Button onClick={checkDatabase} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {loading && (
        <Alert>
          <RefreshCw className='h-4 w-4 animate-spin' />
          <AlertDescription>Đang kiểm tra database...</AlertDescription>
        </Alert>
      )}

      {renderDatabaseStatus()}
      {renderSetupOptions()}
    </div>
  );
};

export default DatabaseSetupWizard;
