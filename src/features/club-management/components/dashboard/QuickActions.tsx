import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Trophy, Table2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClubContext } from '../../contexts/ClubContext';
import { useQuickActions } from '../../hooks/useQuickActions';
import { toast } from '@/components/ui/use-toast';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  action: () => void;
  color?: string;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { selectedClub } = useClubContext();

  const { loading, addNewMember, checkInMember, createQuickTournament, bookTable } = useQuickActions();
  
  const quickActions: QuickAction[] = [
    {
      icon: UserPlus,
      label: 'Thêm thành viên',
      action: async () => {
        try {
          await addNewMember({ /* default member data */ });
          toast({
            title: 'Success',
            description: 'Thêm thành viên mới thành công',
          });
          navigate('/club-management/members/new');
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Không thể thêm thành viên mới',
            variant: 'destructive',
          });
        }
      },
      color: 'bg-blue-500',
    },
    {
      icon: CheckCircle,
      label: 'Check-in',
      action: () => navigate('/club-management/members/check-in'),
      color: 'bg-green-500',
    },
    {
      icon: Trophy,
      label: 'Tạo giải đấu',
      action: () => router.push(`/club-management/tournaments/new`),
      color: 'bg-yellow-500',
    },
    {
      icon: Table2,
      label: 'Đặt bàn',
      action: () => router.push(`/club-management/tables/booking`),
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quickActions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          className={`h-24 flex flex-col items-center justify-center gap-2 hover:${action.color} hover:text-white transition-all`}
          onClick={action.action}
          disabled={loading}
        >
          {React.createElement(action.icon, { className: 'w-6 h-6' })}
          <span className="text-sm font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
