import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClub } from '../../../hooks/useClub';
import { useClubRole } from '../../../hooks/useClubRole';
import { Loading } from '../../common/Loading';
import { Error } from '../../common/Error';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperatingHours } from '../../../types/club.types';

interface OperatingHoursFormProps {
  hours: OperatingHours;
  onChange: (hours: OperatingHours) => void;
}

const OperatingHoursForm: React.FC<OperatingHoursFormProps> = ({ hours, onChange }) => {
  const days = [
    { key: 'monday', label: 'Thứ 2' },
    { key: 'tuesday', label: 'Thứ 3' },
    { key: 'wednesday', label: 'Thứ 4' },
    { key: 'thursday', label: 'Thứ 5' },
    { key: 'friday', label: 'Thứ 6' },
    { key: 'saturday', label: 'Thứ 7' },
    { key: 'sunday', label: 'Chủ nhật' },
  ] as const;

  return (
    <div className="space-y-4">
      {days.map(({ key, label }) => (
        <div key={key} className="grid grid-cols-3 gap-4 items-center">
          <Label>{label}</Label>
          <Input
            type="time"
            value={hours[key]?.open || ''}
            onChange={(e) =>
              onChange({
                ...hours,
                [key]: { ...hours[key], open: e.target.value },
              })
            }
          />
          <Input
            type="time"
            value={hours[key]?.close || ''}
            onChange={(e) =>
              onChange({
                ...hours,
                [key]: { ...hours[key], close: e.target.value },
              })
            }
          />
        </div>
      ))}
    </div>
  );
};

export const ClubSettings: React.FC = () => {
  const { club, loading, error, updateClub } = useClub();
  const { permissions } = useClubRole({});
  const [operatingHours, setOperatingHours] = React.useState<OperatingHours>(
    club?.operating_hours || {}
  );

  if (!permissions.canManageClub) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Bạn không có quyền truy cập phần này
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  if (!club) {
    return null;
  }

  const handleUpdateOperatingHours = async () => {
    try {
      await updateClub({
        ...club,
        operating_hours: operatingHours,
      });
    } catch (error) {
      console.error('Error updating operating hours:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt CLB</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">Thông tin chung</TabsTrigger>
              <TabsTrigger value="hours">Giờ hoạt động</TabsTrigger>
              <TabsTrigger value="pricing">Giá dịch vụ</TabsTrigger>
              <TabsTrigger value="staff">Nhân viên</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              {/* General settings form */}
            </TabsContent>

            <TabsContent value="hours">
              <div className="space-y-6">
                <OperatingHoursForm
                  hours={operatingHours}
                  onChange={setOperatingHours}
                />
                <Button onClick={handleUpdateOperatingHours}>
                  Cập nhật giờ hoạt động
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pricing">
              {/* Pricing settings form */}
            </TabsContent>

            <TabsContent value="staff">
              {/* Staff management */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
