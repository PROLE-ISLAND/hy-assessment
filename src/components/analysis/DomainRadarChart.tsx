'use client';

// =====================================================
// Domain Radar Chart - Glassmorphism Style
// 6-domain radar chart for assessment results
// Uses design system for consistent glassmorphism styling
// =====================================================

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { DOMAIN_LABELS } from '@/lib/analysis';
import type { Domain } from '@/lib/analysis';
import {
  chartPrimaryColor,
  chartConfig,
  chartTheme,
  chartSizeConfig,
  type ChartSize,
} from '@/lib/design-system';

interface DomainRadarChartProps {
  scores: Record<string, number>;
  size?: ChartSize;
  showLabels?: boolean;
  withGlassContainer?: boolean;
}

export function DomainRadarChart({
  scores,
  size = 'md',
  showLabels = true,
  withGlassContainer = false,
}: DomainRadarChartProps) {
  const config = chartSizeConfig[size];

  // Transform scores to chart data format
  const domains: Domain[] = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK', 'VALID'];
  const data = domains.map((domain) => ({
    domain,
    label: DOMAIN_LABELS[domain],
    score: scores[domain] || 0,
    fullMark: 100,
  }));

  const chart = (
    <ResponsiveContainer width="100%" height={config.height}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        {/* Glassmorphism gradient definition */}
        <defs>
          <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartPrimaryColor.fill} stopOpacity={0.6} />
            <stop offset="100%" stopColor={chartPrimaryColor.fill} stopOpacity={0.15} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <PolarGrid
          stroke={chartConfig.gridColor}
          strokeOpacity={chartTheme.radar.polarGrid.strokeOpacity}
        />
        <PolarAngleAxis
          dataKey="label"
          tick={{
            fontSize: config.fontSize,
            fill: chartTheme.radar.polarAngleAxis.tick.fill,
            fontWeight: chartTheme.radar.polarAngleAxis.tick.fontWeight,
          }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: chartConfig.axisTextColor }}
          tickCount={5}
          axisLine={false}
        />
        <Radar
          name="スコア"
          dataKey="score"
          stroke={chartPrimaryColor.stroke}
          fill="url(#radarGradient)"
          fillOpacity={1}
          strokeWidth={chartConfig.strokeWidth}
          strokeOpacity={chartConfig.strokeOpacity}
          filter="url(#glow)"
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'スコア']}
          labelFormatter={(label) => String(label)}
          contentStyle={chartTheme.tooltip.contentStyle}
          wrapperStyle={chartTheme.tooltip.wrapperStyle}
        />
      </RadarChart>
    </ResponsiveContainer>
  );

  if (withGlassContainer) {
    return <div className="glass-chart p-4">{chart}</div>;
  }

  return chart;
}
