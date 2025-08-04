import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { 
  MessageSquare, 
  Trophy, 
  UserCheck, 
  CircleDollarSign, 
  Calendar,
  Clock
} from 'lucide-react';

type ActivityType = 'message' | 'tournament' | 'rank' | 'payment' | 'booking';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
}

export const RecentActivity: React.FC = () => {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'tournament',
      title: 'Tournament Registration',
      description: 'You registered for "Weekend 9-Ball Open"',
      time: '2 hours ago'
    },
    {
      id: '2',
      type: 'rank',
      title: 'Rank Changed',
      description: 'Your ELO rating increased by 23 points',
      time: '5 hours ago'
    },
    {
      id: '3',
      type: 'booking',
      title: 'Table Reserved',
      description: 'Table #3 reserved for tomorrow at 7:00 PM',
      time: '1 day ago'
    },
    {
      id: '4',
      type: 'message',
      title: 'New Challenge',
      description: 'John invited you to a friendly match',
      time: '2 days ago'
    },
    {
      id: '5',
      type: 'payment',
      title: 'Club Membership',
      description: 'Monthly membership payment processed',
      time: '1 week ago'
    }
  ];

  const getIcon = (type: ActivityType) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'tournament': return <Trophy className="h-4 w-4" />;
      case 'rank': return <UserCheck className="h-4 w-4" />;
      case 'payment': return <CircleDollarSign className="h-4 w-4" />;
      case 'booking': return <Calendar className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getIconClass = (type: ActivityType) => {
    switch (type) {
      case 'message': return 'bg-blue-100 text-blue-600';
      case 'tournament': return 'bg-amber-100 text-amber-600';
      case 'rank': return 'bg-green-100 text-green-600';
      case 'payment': return 'bg-purple-100 text-purple-600';
      case 'booking': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start gap-4 py-2">
            <div className={`p-2 rounded-full ${getIconClass(activity.type)}`}>
              {getIcon(activity.type)}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">{activity.title}</h4>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
