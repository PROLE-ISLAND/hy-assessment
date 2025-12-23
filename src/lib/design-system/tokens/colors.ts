// =====================================================
// Design System - Color Tokens
// Centralized color definitions for entire application
// =====================================================

import type { AssessmentStatus } from '@/types/database';
import { Star, Search, AlertTriangle, type LucideIcon } from 'lucide-react';

// =====================================================
// Chart Colors (Refined, Professional Palette)
// =====================================================

/**
 * Primary chart color palette - Softer, pastel-like for glassmorphism
 * Used for multi-series charts and comparisons
 */
export const chartColors = [
  { stroke: '#818cf8', fill: '#818cf8' }, // Indigo-400 (softer)
  { stroke: '#2dd4bf', fill: '#2dd4bf' }, // Teal-400 (softer)
  { stroke: '#fb923c', fill: '#fb923c' }, // Orange-400 (softer)
  { stroke: '#f472b6', fill: '#f472b6' }, // Pink-400 (softer)
  { stroke: '#a78bfa', fill: '#a78bfa' }, // Violet-400 (softer)
] as const;

/**
 * Single chart primary color (for radar charts, etc.)
 */
export const chartPrimaryColor = {
  stroke: '#818cf8',  // Indigo-400 (softer)
  fill: '#818cf8',
} as const;

/**
 * Chart styling constants - Glassmorphism Style
 */
export const chartConfig = {
  // Fill opacity - visible but not overpowering
  fillOpacity: 0.25,        // Visible for glassmorphism
  fillOpacityHover: 0.35,   // More visible on hover
  // Stroke styling
  strokeWidth: 2.5,         // Slightly thicker for contrast
  strokeOpacity: 0.9,       // High visibility stroke
  // Grid colors - softer for glass effect
  gridColor: 'rgba(148, 163, 184, 0.3)',   // slate-400 with opacity
  gridColorDark: 'rgba(148, 163, 184, 0.2)', // softer for dark mode
  // Axis text
  axisTextColor: '#64748b',   // slate-500
  axisTextColorDark: '#94a3b8', // slate-400
  // Glassmorphism gradient (for area/radar charts)
  gradientStartOpacity: 0.5,
  gradientEndOpacity: 0.05,
} as const;

// =====================================================
// Score Colors (Threshold: 70%)
// =====================================================

/**
 * Score thresholds - unified to 70% for "excellent"
 */
export const scoreThresholds = {
  excellent: 70,  // >= 70% = emerald
  warning: 50,    // >= 50% = amber
  danger: 0,      // < 50% = rose
} as const;

/**
 * Score color mappings
 */
export const scoreColors = {
  excellent: {
    text: 'text-emerald-600',
    textDark: 'text-emerald-400',
    bg: 'bg-emerald-50',
    bgDark: 'bg-emerald-900/20',
    border: 'border-emerald-200',
    hex: '#059669',       // emerald-600
    hexLight: '#d1fae5',  // emerald-100
  },
  warning: {
    text: 'text-amber-600',
    textDark: 'text-amber-400',
    bg: 'bg-amber-50',
    bgDark: 'bg-amber-900/20',
    border: 'border-amber-200',
    hex: '#d97706',       // amber-600
    hexLight: '#fef3c7',  // amber-100
  },
  danger: {
    text: 'text-rose-600',
    textDark: 'text-rose-400',
    bg: 'bg-rose-50',
    bgDark: 'bg-rose-900/20',
    border: 'border-rose-200',
    hex: '#e11d48',       // rose-600
    hexLight: '#ffe4e6',  // rose-100
  },
} as const;

export type ScoreLevel = keyof typeof scoreColors;

/**
 * Get score level based on score value
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= scoreThresholds.excellent) return 'excellent';
  if (score >= scoreThresholds.warning) return 'warning';
  return 'danger';
}

/**
 * Get score color (hex) based on score value
 */
export function getScoreColor(score: number): string {
  return scoreColors[getScoreLevel(score)].hex;
}

/**
 * Get score color class based on score value
 */
export function getScoreTextClass(score: number): string {
  return scoreColors[getScoreLevel(score)].text;
}

// =====================================================
// Assessment Status Colors
// =====================================================

export const assessmentStatusConfig: Record<AssessmentStatus, {
  label: string;
  className: string;
}> = {
  pending: {
    label: '未開始',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  in_progress: {
    label: '回答中',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  completed: {
    label: '完了',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  expired: {
    label: '期限切れ',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
} as const;

// =====================================================
// Candidate Status Colors (extended)
// =====================================================

export type CandidateStatus = 'no_assessment' | 'pending' | 'in_progress' | 'completed' | 'analyzed';

export const candidateStatusConfig: Record<CandidateStatus, {
  label: string;
  className: string;
  iconClassName: string;
}> = {
  no_assessment: {
    label: '検査未発行',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    iconClassName: 'text-gray-400',
  },
  pending: {
    label: '未開始',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    iconClassName: 'text-amber-500',
  },
  in_progress: {
    label: '回答中',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    iconClassName: 'text-blue-500',
  },
  completed: {
    label: '検査完了',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    iconClassName: 'text-emerald-500',
  },
  analyzed: {
    label: '分析済み',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    iconClassName: 'text-emerald-500',
  },
} as const;

// =====================================================
// Judgment Colors
// =====================================================

export type JudgmentLevel = 'recommended' | 'consider' | 'caution';

export const judgmentConfig: Record<JudgmentLevel, {
  label: string;
  className: string;
  badgeClass: string;
  icon: LucideIcon;
  iconClass: string;
}> = {
  recommended: {
    label: '推奨',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    icon: Star,
    iconClass: 'text-emerald-600',
  },
  consider: {
    label: '要検討',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    badgeClass: 'bg-amber-100 text-amber-700',
    icon: Search,
    iconClass: 'text-amber-600',
  },
  caution: {
    label: '慎重検討',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    badgeClass: 'bg-rose-100 text-rose-700',
    icon: AlertTriangle,
    iconClass: 'text-rose-600',
  },
};

// =====================================================
// Risk Level Colors
// =====================================================

export type RiskLevel = 'low' | 'medium' | 'high';

export const riskLevelConfig: Record<RiskLevel, {
  label: string;
  className: string;
  progressColor: string;
}> = {
  low: {
    label: '良好',
    className: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
    progressColor: 'bg-emerald-500',
  },
  medium: {
    label: '注意',
    className: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
    progressColor: 'bg-amber-500',
  },
  high: {
    label: '要注意',
    className: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20',
    progressColor: 'bg-rose-500',
  },
} as const;

// =====================================================
// Score Distribution Colors (for histogram) - Softer palette
// =====================================================

export const scoreDistributionColors: Record<string, string> = {
  '0-20': '#fda4af',   // rose-300 (lighter)
  '21-40': '#fdba74',  // orange-300 (lighter)
  '41-60': '#fde047',  // yellow-300 (lighter)
  '61-80': '#86efac',  // green-300 (lighter)
  '81-100': '#6ee7b7', // emerald-300 (lighter)
} as const;

// =====================================================
// Pipeline Colors (for funnel chart) - Soft, pastel-like
// =====================================================

export const pipelineColors = {
  noAssessment: 'bg-slate-300',     // 未検査 - soft gray
  inProgress: 'bg-sky-300',         // 回答中 - soft blue
  completed: 'bg-amber-200',        // 完了 - light yellow (not orange!)
  analyzed: 'bg-emerald-300',       // 分析済 - soft green
} as const;

// =====================================================
// Selection Colors (for interactive list items)
// =====================================================

export const selectionColors = {
  selected: {
    border: 'border-indigo-300',
    bg: 'bg-indigo-50/50',
    bgDark: 'dark:bg-indigo-900/20 dark:border-indigo-700',
  },
  hover: {
    bg: 'hover:bg-muted/50',
  },
} as const;

// =====================================================
// Progress Indicator Colors (hex values for inline styles)
// Same approach as Recharts - direct hex for reliability
// =====================================================

export const progressColors = {
  good: '#6ee7b7',     // emerald-300 (pastel)
  warning: '#fcd34d',  // amber-300 (pastel)
  danger: '#fda4af',   // rose-300 (pastel)
} as const;

/**
 * Get progress indicator color based on score
 * Returns hex color directly (same approach as Recharts)
 */
export function getProgressColor(score: number, isReversed: boolean = false): string {
  const effectiveScore = isReversed ? 100 - score : score;
  if (effectiveScore >= 70) return progressColors.good;
  if (effectiveScore >= 50) return progressColors.warning;
  return progressColors.danger;
}
