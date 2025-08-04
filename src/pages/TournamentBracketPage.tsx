import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Users, Calendar, Target } from 'lucide-react';

const TournamentBracketPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Tournament Brackets</h1>
          <p className="text-muted-foreground">
            Xem và theo dõi các brackets tournament đang diễn ra
          </p>
        </div>
      </div>

      {/* Active Tournaments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Spring Championship 2024</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">64</div>
                <div className="text-sm text-muted-foreground">Người chơi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">8</div>
                <div className="text-sm text-muted-foreground">Còn lại</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vòng hiện tại:</span>
                <span className="font-medium">Tứ kết</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Trận tiếp theo:</span>
                <span className="font-medium">15:30 hôm nay</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Giải thưởng:</span>
                <span className="font-medium text-green-600">500,000 VND</span>
              </div>
            </div>
            
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Xem Bracket
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold">Weekend Cup</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">32</div>
                <div className="text-sm text-muted-foreground">Người chơi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">16</div>
                <div className="text-sm text-muted-foreground">Còn lại</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vòng hiện tại:</span>
                <span className="font-medium">Vòng 16</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Trận tiếp theo:</span>
                <span className="font-medium">9:00 ngày mai</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Giải thưởng:</span>
                <span className="font-medium text-green-600">200,000 VND</span>
              </div>
            </div>
            
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Xem Bracket
            </button>
          </div>
        </Card>
      </div>

      {/* Bracket Viewer Placeholder */}
      <Card className="p-8">
        <div className="text-center space-y-4">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto" />
          <h3 className="text-xl font-semibold">Tournament Bracket Viewer</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Chọn một tournament ở trên để xem bracket chi tiết. 
            Bạn có thể theo dõi kết quả real-time và lịch thi đấu.
          </p>
        </div>
      </Card>

      {/* Recent Results */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Kết quả gần đây</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">ProPlayer123 vs PoolMaster</div>
                <div className="text-sm text-muted-foreground">Tứ kết - Spring Championship</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">8-6</div>
                <div className="text-sm text-muted-foreground">Hoàn thành</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Champion99 vs SkillfulOne</div>
                <div className="text-sm text-muted-foreground">Tứ kết - Spring Championship</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">8-4</div>
                <div className="text-sm text-muted-foreground">Hoàn thành</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Beginner01 vs NewPlayer</div>
                <div className="text-sm text-muted-foreground">Vòng 16 - Weekend Cup</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-orange-500">Đang đấu</div>
                <div className="text-sm text-muted-foreground">Set 2: 3-2</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TournamentBracketPage;
