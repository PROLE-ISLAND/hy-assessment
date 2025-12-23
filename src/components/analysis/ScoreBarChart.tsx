'use client';

// =====================================================
// Score Bar Chart - Glassmorphism Style
// Horizontal bar chart for domain scores
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
import { DOMAIN_LABELS } from '@/lib/analysis';
import type { Domain } from '@/lib/analysis';
import {
  scoreColors,
  scoreThresholds,
  chartConfig,
  chartTheme,
} from '@/lib/design-system';

interface ScoreBarChartProps {
  scores: Record<string, number>;
  orientation?: 'horizontal' | 'vertical';
  withGlassContainer?: boolean;
}

/**
 * Get bar color with glassmorphism transparency
 * Uses 75% threshold consistently, with domain-specific adjustments
 */
function getBarColor(domain: Domain, score: number): string {
  // COG domain is reversed - higher is worse (cognitive biases)
  if (domain === 'COG') {
    if (score >= 70) return scoreColors.danger.hex;    // High bias = bad
    if (score >= 40) return scoreColors.warning.hex;
    return scoreColors.excellent.hex;                   // Low bias = good
  }

  // VALID domain - uses higher thresholds for validity
  if (domain === 'VALID') {
    if (score < 60) return scoreColors.danger.hex;     // Low validity = bad
    if (score < 80) return scoreColors.warning.hex;
    return scoreColors.excellent.hex;
  }

  // Standard domains - use 75% threshold
  if (score < scoreThresholds.warning) return scoreColors.danger.hex;
  if (score < scoreThresholds.excellent) return scoreColors.warning.hex;
  return scoreColors.excellent.hex;
}

export function ScoreBarChart({
  scores,
  orientation = 'horizontal',
  withGlassContainer = false,
}: ScoreBarChartProps) {
  const domains: Domain[] = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK', 'VALID'];
  const data = domains.map((domain) => ({
    domain,
    label: DOMAIN_LABELS[domain],
    score: scores[domain] || 0,
    color: getBarColor(domain, scores[domain] || 0),
  }));

  const chart = orientation === 'horizontal' ? (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        {/* Glassmorphism gradient definitions */}
        <defs>
          {data.map((entry, index) => (
            <linearGradient
              key={`gradient-${index}`}
              id={`barGradient-${index}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
            </linearGradient>
          ))}
          <filter id="barGlow">
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
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: chartConfig.axisTextColor, fontWeight: 500 }}
          tickFormatter={(value) => `${value}%`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12, fill: chartTheme.radar.polarAngleAxis.tick.fill, fontWeight: 500 }}
          width={80}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'スコア']}
          labelFormatter={(label) => String(label)}
          contentStyle={chartTheme.tooltip.contentStyle}
          wrapperStyle={chartTheme.tooltip.wrapperStyle}
          cursor={{ fill: chartTheme.tooltip.cursor.fill }}
        />
        <Bar
          dataKey="score"
          radius={chartTheme.bar.radiusHorizontal}
          filter="url(#barGlow)"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#barGradient-${index})`}
              fillOpacity={chartTheme.bar.fillOpacity}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ) : (
    // Vertical orientation
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
      >
        {/* Glassmorphism gradient definitions */}
        <defs>
          {data.map((entry, index) => (
            <linearGradient
              key={`gradient-v-${index}`}
              id={`barGradientV-${index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray={chartTheme.grid.strokeDasharray}
          stroke={chartConfig.gridColor}
          strokeOpacity={chartTheme.grid.strokeOpacity}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: chartTheme.radar.polarAngleAxis.tick.fill, fontWeight: 500 }}
          interval={0}
          height={60}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: chartConfig.axisTextColor, fontWeight: 500 }}
          tickFormatter={(value) => `${value}%`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'スコア']}
          labelFormatter={(label) => String(label)}
          contentStyle={chartTheme.tooltip.contentStyle}
          wrapperStyle={chartTheme.tooltip.wrapperStyle}
          cursor={{ fill: chartTheme.tooltip.cursor.fill }}
        />
        <Bar dataKey="score" radius={chartTheme.bar.radius} filter="url(#barGlow)">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#barGradientV-${index})`}
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
