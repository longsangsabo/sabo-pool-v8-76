import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Gift } from 'lucide-react';
import { useAdminSPAGrant } from '@/hooks/useAdminSPAGrant';

const AdminSPAGrant = () => {
  const {
    searchQuery,
    setSearchQuery,
    users,
    isSearching,
    grantSPA,
    isGranting,
  } = useAdminSPAGrant();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !amount || !reason) {
      return;
    }

    grantSPA({
      userId: selectedUserId,
      amount: parseInt(amount),
      reason: reason.trim(),
    });

    // Reset form
    setSelectedUserId('');
    setAmount('');
    setReason('');
    setSearchQuery('');
  };

  const selectedUser = users.find(u => u.user_id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Gift className='h-5 w-5' />
          Cấp SPA Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* User Search */}
          <div className='space-y-2'>
            <Label htmlFor='user-search'>Tìm người dùng</Label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
              <Input
                id='user-search'
                placeholder='Nhập tên hoặc số điện thoại...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* User Selection */}
          {searchQuery.length >= 2 && (
            <div className='space-y-2'>
              <Label htmlFor='user-select'>Chọn người dùng</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isSearching ? 'Đang tìm kiếm...' : 'Chọn người dùng'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className='flex justify-between items-center w-full'>
                        <span>{user.full_name}</span>
                        <span className='text-sm text-muted-foreground ml-2'>
                          SPA: {user.current_spa}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected User Info */}
          {selectedUser && (
            <div className='p-3 bg-muted rounded-lg'>
              <div className='text-sm space-y-1'>
                <div>
                  <strong>Tên:</strong> {selectedUser.full_name}
                </div>
                <div>
                  <strong>SĐT:</strong> {selectedUser.phone}
                </div>
                <div>
                  <strong>SPA hiện tại:</strong> {selectedUser.current_spa}
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className='space-y-2'>
            <Label htmlFor='amount'>Số điểm SPA</Label>
            <Input
              id='amount'
              type='number'
              min='1'
              max='10000'
              placeholder='Nhập số điểm...'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={!selectedUserId}
            />
          </div>

          {/* Reason Input */}
          <div className='space-y-2'>
            <Label htmlFor='reason'>Lý do cấp SPA</Label>
            <Textarea
              id='reason'
              placeholder='Nhập lý do cấp SPA...'
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={!selectedUserId}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type='submit'
            disabled={!selectedUserId || !amount || !reason || isGranting}
            className='w-full'
          >
            {isGranting ? 'Đang cấp SPA...' : 'Cấp SPA Points'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminSPAGrant;
