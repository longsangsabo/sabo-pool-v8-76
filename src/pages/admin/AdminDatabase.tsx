import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Server,
  HardDrive,
  Activity,
  Search,
  RefreshCw,
} from 'lucide-react';

const AdminDatabase = () => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any[]>([]);

  const tables = [
    { name: 'users', rows: 1247, size: '42.3 MB', status: 'healthy' },
    { name: 'tournaments', rows: 89, size: '15.2 MB', status: 'healthy' },
    { name: 'matches', rows: 2156, size: '78.9 MB', status: 'healthy' },
    { name: 'clubs', rows: 34, size: '8.1 MB', status: 'warning' },
    { name: 'payments', rows: 567, size: '23.4 MB', status: 'healthy' },
  ];

  const executeQuery = () => {
    console.log('Executing query:', sqlQuery);
    // Simulate query execution
    setQueryResult([
      { id: 1, name: 'Sample Result', count: 42 },
      { id: 2, name: 'Another Row', count: 13 },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <Database className='w-6 h-6 text-blue-600' />
        <h1 className='text-2xl font-bold'>Quản lý cơ sở dữ liệu</h1>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng dung lượng
            </CardTitle>
            <HardDrive className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>167.9 MB</div>
            <p className='text-xs text-muted-foreground'>+5.2 MB tuần này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Kết nối</CardTitle>
            <Server className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>23</div>
            <p className='text-xs text-muted-foreground'>Kết nối hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Queries/sec</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>127</div>
            <p className='text-xs text-muted-foreground'>Truy vấn mỗi giây</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Uptime</CardTitle>
            <RefreshCw className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>99.9%</div>
            <p className='text-xs text-muted-foreground'>30 ngày qua</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Bảng dữ liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {tables.map(table => (
                <div
                  key={table.name}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div>
                    <h3 className='font-medium'>{table.name}</h3>
                    <p className='text-sm text-muted-foreground'>
                      {table.rows} rows • {table.size}
                    </p>
                  </div>
                  <Badge className={getStatusColor(table.status)}>
                    {table.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SQL Query Console</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Input
                placeholder='SELECT * FROM users WHERE...'
                value={sqlQuery}
                onChange={e => setSqlQuery(e.target.value)}
              />
            </div>
            <Button onClick={executeQuery} className='w-full'>
              <Search className='w-4 h-4 mr-2' />
              Thực thi truy vấn
            </Button>

            {queryResult.length > 0 && (
              <div className='mt-4 p-3 bg-muted rounded-lg'>
                <h4 className='font-medium mb-2'>Kết quả:</h4>
                <pre className='text-sm'>
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDatabase;
