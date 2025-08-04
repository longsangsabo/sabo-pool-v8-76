import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface Column {
  key: string;
  title: string;
  width: number;
  render?: (value: any, item: any) => React.ReactNode;
}

interface VirtualizedDataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  title?: string;
  searchable?: boolean;
  onRefresh?: () => void;
  itemHeight?: number;
  containerHeight?: number;
  onItemClick?: (item: any) => void;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

const SearchableRow = React.memo(
  ({
    index,
    style,
    data: { items, columns, onItemClick, searchTerm },
  }: any) => {
    const item = items[index];

    // Filter items based on search term
    const matchesSearch =
      !searchTerm ||
      columns.some((col: Column) => {
        const value = item[col.key];
        return (
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

    if (!matchesSearch) {
      return <div style={style} />;
    }

    return (
      <div
        style={style}
        className='flex items-center border-b border-border hover:bg-muted/50 cursor-pointer transition-colors'
        onClick={() => onItemClick?.(item)}
      >
        {columns.map((column: Column) => (
          <div
            key={column.key}
            className='px-4 py-2 text-sm'
            style={{ width: column.width, minWidth: column.width }}
          >
            {column.render
              ? column.render(item[column.key], item)
              : item[column.key]}
          </div>
        ))}
      </div>
    );
  }
);

SearchableRow.displayName = 'SearchableRow';

const VirtualizedDataTable: React.FC<VirtualizedDataTableProps> = ({
  data,
  columns,
  loading = false,
  title,
  searchable = true,
  onRefresh,
  itemHeight = 60,
  containerHeight = 600,
  onItemClick,
  pagination,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const listRef = useRef<List>(null);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(item =>
      columns.some(col => {
        const value = item[col.key];
        return (
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    );
  }, [data, searchTerm, columns]);

  // Reset scroll when data changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [filteredData]);

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <RefreshCw className='h-5 w-5 animate-spin' />
            {title || 'Đang tải...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-32 flex items-center justify-center'>
            <div className='animate-pulse space-y-2 w-full'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-4 bg-muted rounded' />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <CardTitle className='flex items-center gap-2'>
            {title}
            <Badge variant='secondary'>
              {filteredData.length.toLocaleString()} mục
            </Badge>
          </CardTitle>

          <div className='flex items-center gap-2'>
            {searchable && (
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                <Input
                  placeholder='Tìm kiếm...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 w-64'
                />
              </div>
            )}

            {onRefresh && (
              <Button variant='outline' size='sm' onClick={onRefresh}>
                <RefreshCw className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        {/* Table Header */}
        <div
          className='flex items-center bg-muted/50 border-b font-medium text-sm'
          style={{ width: totalWidth }}
        >
          {columns.map(column => (
            <div
              key={column.key}
              className='px-4 py-3'
              style={{ width: column.width, minWidth: column.width }}
            >
              {column.title}
            </div>
          ))}
        </div>

        {/* Virtualized Content */}
        {filteredData.length === 0 ? (
          <div className='h-32 flex items-center justify-center text-muted-foreground'>
            {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
          </div>
        ) : (
          <div style={{ width: totalWidth }}>
            <List
              ref={listRef}
              height={Math.min(
                containerHeight,
                filteredData.length * itemHeight
              )}
              itemCount={filteredData.length}
              itemSize={itemHeight}
              itemData={{
                items: filteredData,
                columns,
                onItemClick,
                searchTerm,
              }}
              width='100%'
            >
              {SearchableRow}
            </List>
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className='flex items-center justify-between px-4 py-3 border-t'>
            <div className='text-sm text-muted-foreground'>
              Trang {pagination.current} /{' '}
              {Math.ceil(pagination.total / pagination.pageSize)} - Tổng cộng{' '}
              {pagination.total.toLocaleString()} mục
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => pagination.onPageChange(pagination.current - 1)}
                disabled={pagination.current <= 1}
              >
                <ChevronLeft className='h-4 w-4' />
                Trước
              </Button>

              <div className='flex items-center gap-1'>
                {[
                  ...Array(
                    Math.min(
                      5,
                      Math.ceil(pagination.total / pagination.pageSize)
                    )
                  ),
                ].map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={
                        page === pagination.current ? 'default' : 'outline'
                      }
                      size='sm'
                      onClick={() => pagination.onPageChange(page)}
                      className='w-8 h-8 p-0'
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() => pagination.onPageChange(pagination.current + 1)}
                disabled={
                  pagination.current >=
                  Math.ceil(pagination.total / pagination.pageSize)
                }
              >
                Sau
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VirtualizedDataTable;
