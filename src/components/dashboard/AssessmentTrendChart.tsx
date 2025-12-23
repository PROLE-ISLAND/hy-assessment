'use client';

// =====================================================
// Assessment Trend Chart - Glassmorphism Style
// Shows assessment completions over the past 30 days
// Uses design system for consistent glassmorphism styling
// =====================================================

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  chartColors,
  scoreColors,
  chartConfig,
  chartTheme,
} from '@/lib/design-system';

interface TrendDataPoint {
  date: string;
  completed: number;
  started: number;
}

interface AssessmentTrendChartProps {
  data: TrendDataPoint[];
  withGlassContainer?: boolean;
}

export function AssessmentTrendChart({ data, withGlassContainer = false }: AssessmentTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        データがありません
      </div>
    );
  }

  // Use Indigo for "started", Emerald for "completed"
  const startedColor = chartColors[0].stroke;
  const completedColor = scoreColors.excellent.hex;

  const chart = (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {/* Glassmorphism gradient definitions */}
        <defs>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={completedColor} stopOpacity={0.5} />
            <stop offset="50%" stopColor={completedColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={completedColor} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="colorStarted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={startedColor} stopOpacity={0.5} />
            <stop offset="50%" stopColor={startedColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={startedColor} stopOpacity={0.05} />
          </linearGradient>
          <filter id="areaGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray={chartTheme.grid.strokeDasharray}
          stroke={chartConfig.gridColor}
          strokeOpacity={chartTheme.grid.strokeOpacity}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: chartConfig.axisTextColor, fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: chartConfig.axisTextColor, fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          wrapperStyle={chartTheme.tooltip.wrapperStyle}
          labelFormatter={(label) => `${label}`}
          formatter={(value, name) => [
            value ?? 0,
            name === 'completed' ? '完了' : '開始',
          ]}
          cursor={{ stroke: chartConfig.gridColor, strokeDasharray: '4 4' }}
        />
        <Area
          type="monotone"
          dataKey="started"
          stroke={startedColor}
          strokeWidth={chartConfig.strokeWidth}
          strokeOpacity={chartConfig.strokeOpacity}
          fillOpacity={1}
          fill="url(#colorStarted)"
          name="started"
          filter="url(#areaGlow)"
        />
        <Area
          type="monotone"
          dataKey="completed"
          stroke={completedColor}
          strokeWidth={chartConfig.strokeWidth}
          strokeOpacity={chartConfig.strokeOpacity}
          fillOpacity={1}
          fill="url(#colorCompleted)"
          name="completed"
          filter="url(#areaGlow)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (withGlassContainer) {
    return <div className="glass-chart p-4">{chart}</div>;
  }

  return chart;
}
