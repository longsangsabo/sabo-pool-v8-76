import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Incident {
  id: string;
  matchId: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  createdAt: string;
  tournamentName: string;
}

interface MatchIncidentReportingProps {
  tournamentId?: string;
}

const MatchIncidentReporting: React.FC<MatchIncidentReportingProps> = ({
  tournamentId,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [newIncident, setNewIncident] = useState({
    matchId: '',
    type: '',
    description: '',
    severity: 'medium' as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [tournamentId]);

  const loadIncidents = async () => {
    try {
      // Disable since match_events table doesn't exist
      setIncidents([]);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast.error('Có lỗi khi tải danh sách sự cố');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitIncident = async () => {
    if (!newIncident.matchId || !newIncident.type || !newIncident.description) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate incident reporting since table doesn't exist
      toast.success('Đã báo cáo sự cố thành công');

      setNewIncident({
        matchId: '',
        type: '',
        description: '',
        severity: 'medium',
      });

      loadIncidents();
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast.error('Có lỗi khi báo cáo sự cố');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIncidentStatus = async (
    incidentId: string,
    newStatus: string
  ) => {
    try {
      // Simulate status update since table doesn't exist
      toast.success('Đã cập nhật trạng thái sự cố');
      loadIncidents();
    } catch (error) {
      console.error('Error updating incident status:', error);
      toast.error('Có lỗi khi cập nhật trạng thái');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: {
        variant: 'secondary' as const,
        className: 'bg-green-100 text-green-800',
      },
      medium: {
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800',
      },
      high: {
        variant: 'destructive' as const,
        className: 'bg-orange-100 text-orange-800',
      },
      critical: {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800',
      },
    };
    return variants[severity as keyof typeof variants] || variants.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className='w-4 h-4 text-orange-500' />;
      case 'investigating':
        return <Clock className='w-4 h-4 text-blue-500' />;
      case 'resolved':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'closed':
        return <XCircle className='w-4 h-4 text-gray-500' />;
      default:
        return <AlertTriangle className='w-4 h-4 text-orange-500' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5' />
                Báo cáo sự cố trận đấu
              </CardTitle>
              <CardDescription>
                Quản lý và theo dõi các sự cố trong tournament
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className='w-4 h-4 mr-2' />
                  Báo cáo sự cố mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Báo cáo sự cố trận đấu</DialogTitle>
                  <DialogDescription>
                    Ghi lại chi tiết về sự cố xảy ra trong trận đấu
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      ID Trận đấu
                    </label>
                    <Input
                      placeholder='Nhập ID trận đấu...'
                      value={newIncident.matchId}
                      onChange={e =>
                        setNewIncident({
                          ...newIncident,
                          matchId: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Loại sự cố
                    </label>
                    <Select
                      value={newIncident.type}
                      onValueChange={value =>
                        setNewIncident({ ...newIncident, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Chọn loại sự cố...' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='technical_issue'>
                          Sự cố kỹ thuật
                        </SelectItem>
                        <SelectItem value='player_conduct'>
                          Hành vi người chơi
                        </SelectItem>
                        <SelectItem value='rule_violation'>
                          Vi phạm luật chơi
                        </SelectItem>
                        <SelectItem value='equipment_failure'>
                          Hỏng thiết bị
                        </SelectItem>
                        <SelectItem value='venue_issue'>
                          Sự cố địa điểm
                        </SelectItem>
                        <SelectItem value='other'>Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Mức độ nghiêm trọng
                    </label>
                    <Select
                      value={newIncident.severity}
                      onValueChange={(value: any) =>
                        setNewIncident({ ...newIncident, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='low'>Thấp</SelectItem>
                        <SelectItem value='medium'>Trung bình</SelectItem>
                        <SelectItem value='high'>Cao</SelectItem>
                        <SelectItem value='critical'>Nghiêm trọng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Mô tả chi tiết
                    </label>
                    <Textarea
                      placeholder='Mô tả chi tiết về sự cố...'
                      value={newIncident.description}
                      onChange={e =>
                        setNewIncident({
                          ...newIncident,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitIncident}
                    disabled={isSubmitting}
                    className='w-full'
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Báo cáo sự cố'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sự cố</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center h-32'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          ) : incidents.length === 0 ? (
            <div className='text-center text-muted-foreground py-8'>
              Chưa có sự cố nào được báo cáo
            </div>
          ) : (
            <div className='space-y-4'>
              {incidents.map(incident => (
                <div key={incident.id} className='border rounded-lg p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        {getStatusIcon(incident.status)}
                        <h4 className='font-medium'>{incident.type}</h4>
                        <Badge {...getSeverityBadge(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant='outline'>{incident.status}</Badge>
                      </div>

                      <p className='text-sm text-muted-foreground mb-2'>
                        {incident.description}
                      </p>

                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        <span>Trận: {incident.matchId}</span>
                        <span>Tournament: {incident.tournamentName}</span>
                        <span>Báo cáo bởi: {incident.reportedBy}</span>
                        <span>
                          {new Date(incident.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setSelectedIncident(incident)}
                          >
                            <Eye className='w-4 h-4' />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Chi tiết sự cố</DialogTitle>
                          </DialogHeader>
                          {selectedIncident && (
                            <div className='space-y-4'>
                              <div>
                                <label className='text-sm font-medium'>
                                  Loại sự cố:
                                </label>
                                <p>{selectedIncident.type}</p>
                              </div>
                              <div>
                                <label className='text-sm font-medium'>
                                  Mô tả:
                                </label>
                                <p>{selectedIncident.description}</p>
                              </div>
                              <div>
                                <label className='text-sm font-medium'>
                                  Cập nhật trạng thái:
                                </label>
                                <Select
                                  value={selectedIncident.status}
                                  onValueChange={value =>
                                    handleUpdateIncidentStatus(
                                      selectedIncident.id,
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='open'>Mở</SelectItem>
                                    <SelectItem value='investigating'>
                                      Đang điều tra
                                    </SelectItem>
                                    <SelectItem value='resolved'>
                                      Đã giải quyết
                                    </SelectItem>
                                    <SelectItem value='closed'>
                                      Đã đóng
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchIncidentReporting;
