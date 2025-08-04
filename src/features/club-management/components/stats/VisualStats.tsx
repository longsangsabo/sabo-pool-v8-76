import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface StatsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

interface VisualStatsProps {
  revenueData: StatsData;
  membershipData: StatsData;
  tableUtilizationData: StatsData;
}

export function VisualStats({ revenueData, membershipData, tableUtilizationData }: VisualStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar
            data={revenueData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thành viên</CardTitle>
        </CardHeader>
        <CardContent>
          <Line
            data={membershipData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tỷ lệ sử dụng bàn</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar
            data={tableUtilizationData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
