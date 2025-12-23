'use client';

// =====================================================
// Score Distribution Chart - Glassmorphism Style
// Shows distribution of overall scores
// Uses design system for consistent glassmorphism styling
// =====================================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  scoreDistributionColors,
  chartConfig,
  chartTheme,
} from '@/lib/design-system';

interface DistributionDataPoint {
  range: string;
  count: number;
}

interface ScoreDistributionChartProps {
  data: DistributionDataPoint[];
  withGlassContainer?: boolean;
}

export function ScoreDistributionChart({ data, withGlassContainer = false }: ScoreDistributionChartProps) {
  if (data.length === 0 || data.every(d => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        データがありません
      </div>
    );
  }

  // Generate gradient IDs for each range
  const rangeColors = data.map((entry) => ({
    range: entry.range,
    color: scoreDistributionColors[
      entry.range as keyof typeof scoreDistributionColors
    ] || chartConfig.axisTextColor,
  }));

  const chart = (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {/* Glassmorphism gradient definitions */}
        <defs>
          {rangeColors.map((item, index) => (
            <linearGradient
              key={`distGradient-${index}`}
              id={`distGradient-${index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={item.color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0.6} />
            </linearGradient>
          ))}
          <filter id="distGlow">
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
          dataKey="range"
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
          formatter={(value) => [`${value ?? 0}人`, '人数']}
          cursor={{ fill: chartTheme.tooltip.cursor.fill }}
        />
        <Bar
          dataKey="count"
          radius={chartTheme.bar.radius}
          filter="url(#distGlow)"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.range}
              fill={`url(#distGradient-${index})`}
              fillOpacity={chartTheme.bar.fillOpacity}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (withGlassContainer) {
    return <div className="glass-chart p-4">{chart}</div>;
  }

  return chart;
}
