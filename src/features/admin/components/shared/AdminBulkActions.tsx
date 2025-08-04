import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { ChevronDown, CheckSquare, Square, Trash2, Check, X, Settings } from 'lucide-react';
import { AdminDataTable, type ColumnDef } from './AdminDataTable';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  confirmMessage?: string;
  onExecute: (selectedIds: string[]) => Promise<void>;
}

interface AdminBulkActionsProps {
  data: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  actions: BulkAction[];
  idKey?: string;
  className?: string;
}

export function AdminBulkActions({
  data,
  selectedIds,
  onSelectionChange,
  actions,
  idKey = 'id',
  className = ''
}: AdminBulkActionsProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: BulkAction | null;
    message: string;
  }>({
    open: false,
    action: null,
    message: ''
  });
  const [executing, setExecuting] = useState(false);

  const allIds = data.map(item => item[idKey]);
  const isAllSelected = allIds.length > 0 && selectedIds.length === allIds.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < allIds.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  const handleActionClick = (action: BulkAction) => {
    if (selectedIds.length === 0) return;

    if (action.confirmMessage) {
      setConfirmDialog({
        open: true,
        action,
        message: action.confirmMessage
      });
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    if (selectedIds.length === 0) return;

    try {
      setExecuting(true);
      await action.onExecute(selectedIds);
      onSelectionChange([]); // Clear selection after action
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setExecuting(false);
      setConfirmDialog({ open: false, action: null, message: '' });
    }
  };

  const confirmAction = () => {
    if (confirmDialog.action) {
      executeAction(confirmDialog.action);
    }
  };

  if (data.length === 0) return null;

  return (
    <>
      <div className={`flex items-center gap-4 p-4 bg-gray-50 border-b ${className}`}>
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedIds.length > 0 
              ? `Đã chọn ${selectedIds.length}/${data.length}`
              : 'Chọn tất cả'
            }
          </span>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={executing}>
                  <Settings className="h-4 w-4 mr-2" />
                  Thao tác hàng loạt
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {actions.map((action, index) => (
                  <React.Fragment key={action.id}>
                    <DropdownMenuItem
                      onClick={() => handleActionClick(action)}
                      disabled={executing}
                      className={action.variant === 'destructive' ? 'text-red-600' : ''}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                    {index < actions.length - 1 && <DropdownMenuSeparator />}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange([])}
              disabled={executing}
            >
              Bỏ chọn
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thao tác</DialogTitle>
            <DialogDescription>
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog({ open: false, action: null, message: '' })}
              disabled={executing}
            >
              Hủy
            </Button>
            <Button 
              variant={confirmDialog.action?.variant || 'default'}
              onClick={confirmAction}
              disabled={executing}
            >
              {executing ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Enhanced AdminDataTable with bulk actions
interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  actions?: any[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export interface EnhancedAdminDataTableProps<T> extends AdminDataTableProps<T> {
  bulkActions?: BulkAction[];
  onSelectionChange?: (selectedIds: string[]) => void;
  selectedIds?: string[];
  idKey?: string;
}

export function EnhancedAdminDataTable<T extends Record<string, any>>({
  data,
  bulkActions = [],
  onSelectionChange,
  selectedIds = [],
  idKey = 'id',
  ...props
}: EnhancedAdminDataTableProps<T>) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  
  const currentSelectedIds = selectedIds.length > 0 ? selectedIds : internalSelectedIds;
  const currentOnSelectionChange = onSelectionChange || setInternalSelectedIds;

  // Add selection column if bulk actions are provided
  const enhancedColumns = bulkActions.length > 0 ? [
    {
      key: '__selection',
      header: '',
      width: '40px',
      render: (_, row: T) => (
        <Checkbox
          checked={currentSelectedIds.includes(row[idKey])}
          onCheckedChange={(checked) => {
            if (checked) {
              currentOnSelectionChange([...currentSelectedIds, row[idKey]]);
            } else {
              currentOnSelectionChange(currentSelectedIds.filter(id => id !== row[idKey]));
            }
          }}
        />
      ),
    },
    ...props.columns
  ] : props.columns;

  return (
    <div className="space-y-0">
      {bulkActions.length > 0 && (
        <AdminBulkActions
          data={data}
          selectedIds={currentSelectedIds}
          onSelectionChange={currentOnSelectionChange}
          actions={bulkActions}
          idKey={idKey}
        />
      )}
      <AdminDataTable
        {...props}
        data={data}
        columns={enhancedColumns}
      />
    </div>
  );
}
