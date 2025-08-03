import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickActionsProps {
  pendingClubs: number;
  pendingTournaments?: number;
  activeIssues?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  pendingClubs,
  pendingTournaments = 0,
  activeIssues = 0,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const actions = [
    {
      title: t('admin.approve_clubs'),
      description: `${pendingClubs} ${t('admin.pending')}`,
      icon: Building2,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      onClick: () => navigate('/admin/clubs'),
      urgent: pendingClubs > 0,
    },
    {
      title: t('admin.manage_users'),
      description: t('admin.user_overview'),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => navigate('/admin/users'),
      urgent: false,
    },
    {
      title: t('admin.financial_overview'),
      description: t('admin.transactions_payments'),
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => navigate('/admin/transactions'),
      urgent: false,
    },
    {
      title: t('admin.system_issues'),
      description: `${activeIssues} ${t('admin.active_issues')}`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      onClick: () => navigate('/admin/monitoring'),
      urgent: activeIssues > 0,
    },
    {
      title: t('admin.system_settings'),
      description: t('admin.configure_system'),
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      onClick: () => navigate('/admin/settings'),
      urgent: false,
    },
  ];

  return (
    <Card className='enhanced-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-card-foreground'>
          <CheckCircle className='w-5 h-5 text-accent-green' />
          {t('admin.quick_actions')}
        </CardTitle>
        <CardDescription className='text-muted-foreground'>
          {t('admin.common_actions')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant='ghost'
              className={`w-full justify-start gap-3 h-auto p-4 rounded-xl transition-all duration-200 ${
                action.urgent
                  ? 'border border-accent-red/30 bg-accent-red/10 hover:bg-accent-red/20 dark:border-accent-red/40 dark:bg-accent-red/20 dark:hover:bg-accent-red/30'
                  : 'hover:bg-secondary dark:hover:bg-secondary/80 border border-transparent hover:border-border/50'
              }`}
              onClick={action.onClick}
            >
              <div
                className={`p-3 rounded-xl transition-all duration-200 ${
                  action.urgent
                    ? 'bg-accent-red/20 dark:bg-accent-red/30'
                    : action.bgColor.includes('yellow')
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : action.bgColor.includes('green')
                        ? 'bg-accent-green/20 dark:bg-accent-green/30'
                        : action.bgColor.includes('purple')
                          ? 'bg-accent-purple/20 dark:bg-accent-purple/30'
                          : action.bgColor.includes('red')
                            ? 'bg-accent-red/20 dark:bg-accent-red/30'
                            : 'bg-muted/50 dark:bg-muted/80'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    action.urgent
                      ? 'text-accent-red'
                      : action.color.includes('yellow')
                        ? 'text-primary'
                        : action.color.includes('green')
                          ? 'text-accent-green'
                          : action.color.includes('purple')
                            ? 'text-accent-purple'
                            : action.color.includes('red')
                              ? 'text-accent-red'
                              : 'text-muted-foreground'
                  }`}
                />
              </div>
              <div className='flex-1 text-left'>
                <div className='font-semibold text-card-foreground'>
                  {action.title}
                </div>
                <div className='text-sm text-muted-foreground mt-1'>
                  {action.description}
                </div>
              </div>
              {action.urgent && (
                <AlertTriangle className='w-5 h-5 text-accent-red animate-pulse' />
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
