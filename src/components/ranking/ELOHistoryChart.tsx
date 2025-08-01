import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Maximize2,
} from 'lucide-react';
import { useMatchResults } from '@/hooks/useMatchResults';
import * as d3 from 'd3';

interface ELOHistoryEntry {
  date: string;
  elo: number;
  change: number;
  matchResult: 'win' | 'loss' | 'draw';
  opponent: string;
  opponentElo: number;
}

interface ELOHistoryChartProps {
  playerId?: string;
  className?: string;
}

export const ELOHistoryChart: React.FC<ELOHistoryChartProps> = ({
  playerId,
  className,
}) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const { fetchEloHistory } = useMatchResults();
  const [timeRange, setTimeRange] = useState<
    '7d' | '30d' | '90d' | '1y' | 'all'
  >('30d');
  const [eloHistory, setEloHistory] = useState<ELOHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (playerId) {
      fetchHistoryData();
    }
  }, [playerId, timeRange]);

  const fetchHistoryData = async () => {
    if (!playerId) return;
    setLoading(true);

    try {
      const limit =
        timeRange === '7d'
          ? 50
          : timeRange === '30d'
            ? 100
            : timeRange === '90d'
              ? 200
              : 500;

      const data = await fetchEloHistory(playerId, limit);

      // Transform data for chart
      const transformedData: ELOHistoryEntry[] = data.map(entry => ({
        date: entry.created_at,
        elo: entry.elo_after,
        change: entry.elo_change,
        matchResult: entry.match_result,
        opponent: 'Unknown', // Would be populated from joined data
        opponentElo: entry.opponent_elo || 0,
      }));

      setEloHistory(transformedData);
    } catch (error) {
      console.error('Failed to fetch ELO history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eloHistory.length > 0 && chartRef.current) {
      drawChart();
    }
  }, [eloHistory, isExpanded]);

  const drawChart = () => {
    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = (isExpanded ? 1000 : 600) - margin.left - margin.right;
    const height = (isExpanded ? 500 : 300) - margin.bottom - margin.top;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates and create scales
    const parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%S');
    const data = eloHistory
      .map(d => ({
        ...d,
        date: parseTime(d.date.split('.')[0]) || new Date(),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, d => d.elo) as [number, number])
      .nice()
      .range([height, 0]);

    // Create line generator
    const line = d3
      .line<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.elo))
      .curve(d3.curveMonotoneX);

    // Add gradient definition
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'elo-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', height);

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'hsl(var(--primary))')
      .attr('stop-opacity', 0.8);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'hsl(var(--primary))')
      .attr('stop-opacity', 0.1);

    // Add area under the line
    const area = d3
      .area<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.elo))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#elo-gradient)')
      .attr('d', area);

    // Add the line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots for each data point
    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.elo))
      .attr('r', 3)
      .attr('fill', d =>
        d.change > 0
          ? 'hsl(var(--success))'
          : d.change < 0
            ? 'hsl(var(--destructive))'
            : 'hsl(var(--muted))'
      )
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat(d3.timeFormat('%m/%d') as any)
          .ticks(6)
      );

    // Add Y axis
    g.append('g').call(d3.axisLeft(yScale).ticks(8));

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'hsl(var(--muted-foreground))')
      .text('ELO Rating');

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'hsl(var(--muted-foreground))')
      .text('Thời gian');

    // Add tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'hsl(var(--popover))')
      .style('border', '1px solid hsl(var(--border))')
      .style('border-radius', '6px')
      .style('padding', '8px')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
      .style('z-index', '1000');

    g.selectAll('.dot')
      .on('mouseover', function (event, d) {
        const dataPoint = d as (typeof data)[0];
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html(
            `
          <div>
            <strong>ELO: ${dataPoint.elo}</strong><br/>
            Thay đổi: ${dataPoint.change > 0 ? '+' : ''}${dataPoint.change}<br/>
            Kết quả: ${dataPoint.matchResult === 'win' ? 'Thắng' : dataPoint.matchResult === 'loss' ? 'Thua' : 'Hòa'}<br/>
            Ngày: ${d3.timeFormat('%d/%m/%Y')(dataPoint.date)}
          </div>
        `
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d':
        return '7 ngày';
      case '30d':
        return '30 ngày';
      case '90d':
        return '3 tháng';
      case '1y':
        return '1 năm';
      case 'all':
        return 'Tất cả';
      default:
        return '30 ngày';
    }
  };

  const getStatsFromHistory = () => {
    if (eloHistory.length === 0) return null;

    const currentElo = eloHistory[eloHistory.length - 1]?.elo || 0;
    const firstElo = eloHistory[0]?.elo || 0;
    const totalChange = currentElo - firstElo;
    const wins = eloHistory.filter(h => h.matchResult === 'win').length;
    const losses = eloHistory.filter(h => h.matchResult === 'loss').length;
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
    const maxElo = Math.max(...eloHistory.map(h => h.elo));
    const minElo = Math.min(...eloHistory.map(h => h.elo));

    return {
      totalChange,
      wins,
      losses,
      winRate,
      maxElo,
      minElo,
      totalMatches: wins + losses,
    };
  };

  const stats = getStatsFromHistory();

  const exportData = () => {
    const csvContent = [
      ['Ngày', 'ELO', 'Thay đổi', 'Kết quả', 'Đối thủ ELO'].join(','),
      ...eloHistory.map(entry =>
        [
          entry.date,
          entry.elo,
          entry.change,
          entry.matchResult,
          entry.opponentElo,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `elo_history_${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={className}>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          Lịch Sử ELO
        </CardTitle>
        <div className='flex items-center gap-2'>
          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7d'>7 ngày</SelectItem>
              <SelectItem value='30d'>30 ngày</SelectItem>
              <SelectItem value='90d'>3 tháng</SelectItem>
              <SelectItem value='1y'>1 năm</SelectItem>
              <SelectItem value='all'>Tất cả</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' size='sm' onClick={exportData}>
            <Download className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Maximize2 className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        ) : eloHistory.length === 0 ? (
          <div className='flex items-center justify-center h-64 text-muted-foreground'>
            Chưa có dữ liệu lịch sử ELO
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Statistics Summary */}
            {stats && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg'>
                <div className='text-center'>
                  <p className='text-lg font-bold text-primary'>
                    {stats.totalChange > 0 ? '+' : ''}
                    {stats.totalChange}
                  </p>
                  <p className='text-xs text-muted-foreground'>Thay đổi tổng</p>
                </div>
                <div className='text-center'>
                  <p className='text-lg font-bold text-green-600'>
                    {stats.wins}
                  </p>
                  <p className='text-xs text-muted-foreground'>Thắng</p>
                </div>
                <div className='text-center'>
                  <p className='text-lg font-bold text-red-600'>
                    {stats.losses}
                  </p>
                  <p className='text-xs text-muted-foreground'>Thua</p>
                </div>
                <div className='text-center'>
                  <p className='text-lg font-bold text-blue-600'>
                    {stats.winRate.toFixed(1)}%
                  </p>
                  <p className='text-xs text-muted-foreground'>Tỷ lệ thắng</p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className='w-full overflow-x-auto'>
              <svg
                ref={chartRef}
                width={isExpanded ? 1000 : 600}
                height={isExpanded ? 500 : 300}
                className='w-full'
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
