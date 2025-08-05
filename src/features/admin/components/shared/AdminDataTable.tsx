import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Search, Filter, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface ActionButton {
  label: string;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: React.ReactNode;
  condition?: (row: any) => boolean;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  actions?: ActionButton[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Tìm kiếm...',
  actions = [],
  onRowClick,
  emptyMessage = 'Không có dữ liệu',
  className = '',
}: AdminDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(row =>
        columns.some(column => {
          const value = row[column.key as keyof T];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Sort data
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, columns]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction:
        current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const renderCellValue = (column: ColumnDef<T>, row: T) => {
    const value = row[column.key as keyof T];

    if (column.render) {
      return column.render(value, row);
    }

    return value;
  };

  return (
    <Card className={className}>
      {searchable && (
        <CardContent className='pt-6'>
          <div className='flex items-center space-x-2'>
            <Search className='h-4 w-4 text-muted-foreground' />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='max-w-sm'
            />
          </div>
        </CardContent>
      )}

      <CardContent className={searchable ? 'pt-0' : 'pt-6'}>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            {emptyMessage}
          </div>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead
                      key={index}
                      className={
                        column.sortable
                          ? 'cursor-pointer hover:bg-muted/50'
                          : ''
                      }
                      style={{ width: column.width }}
                      onClick={() =>
                        column.sortable && handleSort(column.key as string)
                      }
                    >
                      <div className='flex items-center space-x-1'>
                        <span>{column.header}</span>
                        {column.sortable && sortConfig?.key === column.key && (
                          <span className='text-xs'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {actions.length > 0 && (
                    <TableHead className='w-[50px]'>Thao tác</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={
                      onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
                    }
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {renderCellValue(column, row)}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            {actions
                              .filter(
                                action =>
                                  !action.condition || action.condition(row)
                              )
                              .map((action, actionIndex) => (
                                <DropdownMenuItem
                                  key={actionIndex}
                                  onClick={e => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                  }}
                                >
                                  {action.icon && (
                                    <span className='mr-2'>{action.icon}</span>
                                  )}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
