// =====================================================
// Design System - Recharts Theme Configuration
// Glassmorphism styling for all chart components
// =====================================================

import { chartConfig } from '../tokens/colors';

/**
 * Unified theme configuration for Recharts
 * Glassmorphism style: frosted glass, soft gradients, subtle borders
 */
export const chartTheme = {
  // Grid styling - softer for glass effect
  grid: {
    stroke: chartConfig.gridColor,
    strokeDasharray: '4 4',
    strokeOpacity: 0.5,
    vertical: true,
    horizontal: true,
  },

  // Axis styling - subtle, readable
  axis: {
    tick: {
      fontSize: 12,
      fill: chartConfig.axisTextColor,
      fontWeight: 500,
    },
    axisLine: false,
    tickLine: false,
  },

  // Tooltip styling - Glassmorphism
  tooltip: {
    contentStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      fontSize: '13px',
      padding: '10px 14px',
      color: '#1e293b', // slate-800
    },
    wrapperStyle: {
      outline: 'none',
      zIndex: 100,
    },
    cursor: {
      fill: 'rgba(99, 102, 241, 0.06)', // indigo with opacity
    },
    itemStyle: {
      color: '#334155', // slate-700
      fontWeight: 500,
    },
    labelStyle: {
      fontWeight: 600,
      marginBottom: '6px',
      color: '#0f172a', // slate-900
    },
  },

  // Dark mode tooltip
  tooltipDark: {
    contentStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      fontSize: '13px',
      padding: '10px 14px',
      color: '#e2e8f0', // slate-200
    },
  },

  // Radar chart specific - glassmorphism style
  radar: {
    polarGrid: {
      stroke: chartConfig.gridColor,
      strokeOpacity: 0.4,
    },
    polarAngleAxis: {
      tick: {
        fontSize: 11,
        fill: '#475569', // slate-600
        fontWeight: 500,
      },
      tickLine: false,
    },
    polarRadiusAxis: {
      tick: {
        fontSize: 10,
        fill: chartConfig.axisTextColor,
      },
      axisLine: false,
      tickLine: false,
    },
    fillOpacity: chartConfig.fillOpacity,
    strokeWidth: chartConfig.strokeWidth,
    strokeOpacity: chartConfig.strokeOpacity,
  },

  // Area chart specific - glass gradient
  area: {
    gradient: {
      startOpacity: chartConfig.gradientStartOpacity,
      endOpacity: chartConfig.gradientEndOpacity,
    },
    strokeWidth: chartConfig.strokeWidth,
  },

  // Bar chart specific - rounded corners
  bar: {
    radius: [6, 6, 0, 0] as [number, number, number, number],
    radiusHorizontal: [0, 6, 6, 0] as [number, number, number, number],
    fillOpacity: 0.85,  // Slightly transparent bars
  },

  // Legend styling
  legend: {
    wrapperStyle: {
      paddingTop: '16px',
    },
    iconSize: 10,
    iconType: 'circle' as const,
  },

  // Responsive container
  responsive: {
    minHeight: 200,
    defaultHeight: 300,
  },

  // Glass container styling (applied via className)
  glassContainer: {
    className: 'glass-chart p-4',
  },
} as const;

/**
 * Size configuration for responsive charts
 */
export const chartSizeConfig = {
  sm: { height: 200, fontSize: 10, margin: { top: 10, right: 10, left: 0, bottom: 0 } },
  md: { height: 300, fontSize: 12, margin: { top: 20, right: 20, left: 0, bottom: 0 } },
  lg: { height: 400, fontSize: 14, margin: { top: 20, right: 30, left: 0, bottom: 0 } },
} as const;

export type ChartSize = keyof typeof chartSizeConfig;

/**
 * Get chart configuration by size
 */
export function getChartConfig(size: ChartSize = 'md') {
  return chartSizeConfig[size];
}

/**
 * Common chart margin configuration
 */
export const chartMargin = {
  top: 10,
  right: 10,
  left: 0,
  bottom: 0,
} as const;

/**
 * Domain configuration for percentage charts (0-100)
 */
export const percentageDomain = [0, 100] as const;

/**
 * Format value as percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format score with suffix
 */
export function formatScore(value: number): string {
  return `${Math.round(value)}点`;
}
