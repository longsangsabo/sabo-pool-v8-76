import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { XCircle } from 'lucide-react';

interface TableSelectorProps {
  availableTables: number[];
  selectedTable: string;
  loading: boolean;
  isHighContrast: boolean;
  onSelectTable: (tableNumber: string) => void;
}

const TableSelector = ({
  availableTables,
  selectedTable,
  loading,
  isHighContrast,
  onSelectTable,
}: TableSelectorProps) => {
  return (
    <div className='space-y-2'>
      <Label
        className={`${isHighContrast ? 'text-white' : 'text-white'} text-lg font-medium`}
      >
        Chọn bàn *
      </Label>
      {loading ? (
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400'></div>
          <span className='ml-3 text-white'>Đang kiểm tra bàn trống...</span>
        </div>
      ) : (
        <div className='grid grid-cols-4 gap-3'>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(table => {
            const isAvailable = availableTables.includes(table);
            return (
              <Button
                key={table}
                type='button'
                variant={
                  selectedTable === table.toString() ? 'default' : 'outline'
                }
                className={`min-h-[44px] text-lg font-medium ${
                  isAvailable
                    ? selectedTable === table.toString()
                      ? 'bg-yellow-400 text-green-900 hover:bg-yellow-500'
                      : isHighContrast
                        ? 'border-white text-white hover:bg-white hover:text-black'
                        : 'border-green-400 text-green-400 hover:bg-green-400 hover:text-green-900'
                    : 'opacity-50 cursor-not-allowed bg-red-800 text-red-200'
                }`}
                onClick={() => isAvailable && onSelectTable(table.toString())}
                disabled={!isAvailable}
              >
                Bàn {table}
                {!isAvailable && <XCircle className='ml-1 h-4 w-4' />}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TableSelector;
