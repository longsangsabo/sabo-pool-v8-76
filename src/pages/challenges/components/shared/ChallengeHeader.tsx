import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Trophy, Target } from 'lucide-react';

interface ChallengeHeaderProps {
  onCreateClick: () => void;
}

const ChallengeHeader: React.FC<ChallengeHeaderProps> = ({
  onCreateClick
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Hệ thống Thách đấu
            </h1>
            <p className="text-muted-foreground">
              Quản lý và tham gia các thách đấu billiards chuyên nghiệp
            </p>
          </div>
        </div>
        
        {/* Live status indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Hệ thống hoạt động</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">Cập nhật thời gian thực</span>
        </div>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={onCreateClick}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo thách đấu
        </Button>
        
        
      </div>
    </div>
  );
};

export default ChallengeHeader;