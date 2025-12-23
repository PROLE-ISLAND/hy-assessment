// =====================================================
// Design System - Chart Gradient Definitions
// Reusable SVG gradients for Recharts components
// =====================================================

'use client';

import { memo } from 'react';
import { chartColors, scoreColors } from '../tokens/colors';
import { chartTheme } from './theme';

/**
 * Props for individual chart gradient
 */
interface ChartGradientProps {
  id: string;
  color: string;
  startOpacity?: number;
  endOpacity?: number;
}

/**
 * Single gradient definition component
 */
export const ChartGradient = memo(function ChartGradient({
  id,
  color,
  startOpacity = chartTheme.area.gradient.startOpacity,
  endOpacity = chartTheme.area.gradient.endOpacity,
}: ChartGradientProps) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={color} stopOpacity={startOpacity} />
      <stop offset="95%" stopColor={color} stopOpacity={endOpacity} />
    </linearGradient>
  );
});

/**
 * Pre-defined gradient set for common chart use cases
 * Include this in your chart's <defs> section
 */
export function ChartGradientDefs() {
  return (
    <defs>
      {/* Primary chart colors */}
      <ChartGradient id="gradientIndigo" color={chartColors[0].fill} />
      <ChartGradient id="gradientTeal" color={chartColors[1].fill} />
      <ChartGradient id="gradientOrange" color={chartColors[2].fill} />
      <ChartGradient id="gradientPink" color={chartColors[3].fill} />
      <ChartGradient id="gradientViolet" color={chartColors[4].fill} />

      {/* Semantic colors */}
      <ChartGradient id="gradientSuccess" color={scoreColors.excellent.hex} />
      <ChartGradient id="gradientWarning" color={scoreColors.warning.hex} />
      <ChartGradient id="gradientDanger" color={scoreColors.danger.hex} />

      {/* Legacy aliases for compatibility */}
      <ChartGradient id="gradientPrimary" color={chartColors[0].fill} />
      <ChartGradient id="gradientSecondary" color={chartColors[1].fill} />
      <ChartGradient id="colorCompleted" color={scoreColors.excellent.hex} />
      <ChartGradient id="colorStarted" color={chartColors[0].fill} />
    </defs>
  );
}

/**
 * Gradient IDs for easy reference
 */
export const gradientIds = {
  // Primary palette
  indigo: 'gradientIndigo',
  teal: 'gradientTeal',
  orange: 'gradientOrange',
  pink: 'gradientPink',
  violet: 'gradientViolet',

  // Semantic
  success: 'gradientSuccess',
  warning: 'gradientWarning',
  danger: 'gradientDanger',

  // Aliases
  primary: 'gradientPrimary',
  secondary: 'gradientSecondary',
  completed: 'colorCompleted',
  started: 'colorStarted',
} as const;

/**
 * Get gradient URL by ID
 */
export function getGradientUrl(id: keyof typeof gradientIds | string): string {
  const gradientId = id in gradientIds ? gradientIds[id as keyof typeof gradientIds] : id;
  return `url(#${gradientId})`;
}

/**
 * Indexed gradient getter for multi-series charts
 */
export function getChartGradientUrl(index: number): string {
  const ids = ['gradientIndigo', 'gradientTeal', 'gradientOrange', 'gradientPink', 'gradientViolet'];
  return `url(#${ids[index % ids.length]})`;
}

/**
 * Get solid color by index (for strokes)
 */
export function getChartColor(index: number): string {
  return chartColors[index % chartColors.length].stroke;
}
