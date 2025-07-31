import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Clock } from 'lucide-react';

const OpenChallengesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Thách đấu mở
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có thách đấu mở nào</h3>
            <p className="text-muted-foreground mb-4">
              Tính năng thách đấu mở đang được phát triển. Sẽ sớm có thể tham gia các thách đấu công khai từ người chơi khác!
            </p>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Sắp ra mắt
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenChallengesTab;