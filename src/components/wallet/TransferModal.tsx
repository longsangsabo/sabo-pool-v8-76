import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  User,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatar_url?: string;
  rank: string;
  is_online: boolean;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onTransfer: (recipientId: string, amount: number, message: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onTransfer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);

  // Mock users - replace with actual API call
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'player2',
      avatar_url: '/avatars/player2.jpg',
      rank: 'B+',
      is_online: true,
    },
    {
      id: '2',
      username: 'pool_master',
      avatar_url: '/avatars/pool_master.jpg',
      rank: 'F+',
      is_online: false,
    },
    {
      id: '3',
      username: 'champion_player',
      avatar_url: '/avatars/champion.jpg',
      rank: 'G',
      is_online: true,
    },
    {
      id: '4',
      username: 'newbie_player',
      avatar_url: '/avatars/newbie.jpg',
      rank: 'I+',
      is_online: true,
    },
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const filtered = mockUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchTerm(user.username);
  };

  const handleTransfer = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount > currentBalance) {
      return;
    }

    setIsTransferring(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      onTransfer(selectedUser.id, transferAmount, message);
      handleClose();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setAmount('');
    setMessage('');
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const isValidAmount = () => {
    const numAmount = parseFloat(amount);
    return numAmount > 0 && numAmount <= currentBalance;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Send className='h-5 w-5' />
            Chuyển điểm
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Current Balance */}
          <div className='bg-blue-50 p-4 rounded-lg'>
            <div className='text-sm text-blue-600 mb-1'>Số dư hiện tại</div>
            <div className='text-2xl font-bold text-blue-800'>
              {formatCurrency(currentBalance)}
            </div>
          </div>

          {/* Recipient Search */}
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700'>
              Người nhận
            </label>

            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm người dùng...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className='pl-10'
              />
            </div>

            {isSearching && (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className='border rounded-lg max-h-48 overflow-y-auto'>
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className='w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 text-left'>
                      <div className='font-medium'>{user.username}</div>
                      <div className='text-sm text-gray-600'>
                        Hạng {user.rank}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {user.is_online && (
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                      )}
                      <Badge variant='outline' className='text-xs'>
                        {user.rank}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className='flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
                <Avatar className='h-10 w-10'>
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <div className='font-medium'>{selectedUser.username}</div>
                  <div className='text-sm text-gray-600'>
                    Hạng {selectedUser.rank}
                  </div>
                </div>
                <CheckCircle className='h-5 w-5 text-green-600' />
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700'>
              Số tiền
            </label>
            <Input
              type='number'
              placeholder='Nhập số tiền muốn chuyển'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min='1000'
              max={currentBalance}
            />
            <div className='text-sm text-gray-600'>
              Số tiền tối thiểu: 1,000 VNĐ
            </div>
            {amount && !isValidAmount() && (
              <div className='flex items-center gap-2 text-sm text-red-600'>
                <AlertCircle className='h-4 w-4' />
                <span>
                  {parseFloat(amount) > currentBalance
                    ? 'Số tiền vượt quá số dư hiện tại'
                    : 'Số tiền phải lớn hơn 0'}
                </span>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700'>
              Tin nhắn (tùy chọn)
            </label>
            <Textarea
              placeholder='Viết tin nhắn cho người nhận...'
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Transfer Summary */}
          {selectedUser && amount && isValidAmount() && (
            <div className='bg-gray-50 p-4 rounded-lg space-y-2'>
              <div className='text-sm font-medium text-gray-700'>
                Tóm tắt giao dịch:
              </div>
              <div className='flex justify-between text-sm'>
                <span>Người nhận:</span>
                <span className='font-medium'>{selectedUser.username}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span>Số tiền:</span>
                <span className='font-medium'>
                  {formatCurrency(parseFloat(amount))}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span>Số dư sau chuyển:</span>
                <span className='font-medium'>
                  {formatCurrency(currentBalance - parseFloat(amount))}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-2'>
            <Button variant='outline' onClick={handleClose} className='flex-1'>
              Hủy
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedUser || !isValidAmount() || isTransferring}
              className='flex-1'
            >
              {isTransferring ? (
                <div className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Đang chuyển...
                </div>
              ) : (
                <>
                  <Send className='h-4 w-4 mr-2' />
                  Chuyển điểm
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
